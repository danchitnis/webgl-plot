import * as ts from "typescript";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";

export type LiveTsEditorStatusKind =
    | "ready"
    | "editing"
    | "running"
    | "compile-error"
    | "runtime-error";

export type LiveTsEditorOptions<TApi extends object> = {
    editorParent: HTMLElement;
    api: TApi;
    initialTypeScript: string;
    statusEl?: HTMLElement;
    debounceMs?: number;
    allowTopLevelImports?: boolean;
    onStatus?: (text: string, kind: LiveTsEditorStatusKind) => void;
};

export type LiveTsEditorHandle = {
    editorView: EditorView;
    getTypeScript: () => string;
    setTypeScript: (text: string) => void;
    runNow: () => Promise<void>;
    dispose: () => void;
};

export function functionBodyToTypeScript<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => TReturn
): string {
    const raw = fn.toString();

    const parenStart = raw.indexOf("(");
    const parenEnd = parenStart >= 0 ? raw.indexOf(")", parenStart + 1) : -1;
    const paramList = parenStart >= 0 && parenEnd > parenStart ? raw.slice(parenStart + 1, parenEnd) : "";
    const firstParam = paramList
        .split(",")[0]
        .trim()
        .replace(/^\.{3}/, "")
        .replace(/\s*=.*$/, "")
        .trim();

    const shouldRenameParam = firstParam.length > 0 && firstParam !== "api";

    const bodyStart = raw.indexOf("{");
    const bodyEnd = raw.lastIndexOf("}");
    if (bodyStart < 0 || bodyEnd < 0 || bodyEnd <= bodyStart) {
        return "";
    }

    let body = raw.slice(bodyStart + 1, bodyEnd);
    body = body.replace(/^\s*\n/, "");

    const lines = body.split("\n");
    const nonEmpty = lines.filter((line) => line.trim().length > 0);
    const indents = nonEmpty.map((line) => (line.match(/^[\t ]*/)?.[0] ?? ""));
    const minIndentLen = indents.length ? Math.min(...indents.map((indent) => indent.length)) : 0;

    const trimmedLines =
        minIndentLen > 0
            ? lines.map((line) => {
                const prefix = line.slice(0, minIndentLen);
                const shouldTrim = /^[\t ]+$/.test(prefix);
                return shouldTrim ? line.slice(minIndentLen) : line;
            })
            : lines;

    let result = trimmedLines.join("\n").trimEnd() + "\n";
    if (shouldRenameParam && /^[$A-Z_][0-9A-Z_$]*$/i.test(firstParam)) {
        // Replace identifier occurrences of the first parameter with `api`.
        // This avoids issues where bundlers rename the parameter (e.g. api2, a) which would break the editor runtime.
        const re = new RegExp(`\\b${firstParam}\\b`, "g");
        result = result.replace(re, "api");
    }

    return result;
}

type CompileResult = { ok: true; js: string } | { ok: false; message: string };

function defaultSetStatus(statusEl: HTMLElement | undefined, onStatus: LiveTsEditorOptions<object>["onStatus"], text: string, kind: LiveTsEditorStatusKind) {
    if (statusEl) statusEl.textContent = text;
    if (onStatus) onStatus(text, kind);
}

function compileTypeScript(userCode: string, allowTopLevelImports: boolean): CompileResult {
    if (!allowTopLevelImports) {
        if (/^\s*import\s+/m.test(userCode) || /^\s*export\s+/m.test(userCode)) {
            return {
                ok: false,
                message: "This live editor runs code in a function context; please avoid top-level import/export.",
            };
        }
    }

    const result = ts.transpileModule(userCode, {
        compilerOptions: {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.ES2020,
            strict: true,
            isolatedModules: true,
        },
        reportDiagnostics: true,
    });

    const diagnostics = result.diagnostics ?? [];
    const errors = diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
    if (errors.length > 0) {
        const first = errors[0];
        const msg = ts.flattenDiagnosticMessageText(first.messageText, "\n");
        return { ok: false, message: msg };
    }

    return { ok: true, js: result.outputText };
}

export function createLiveTypeScriptEditor<TApi extends object>(options: LiveTsEditorOptions<TApi>): LiveTsEditorHandle {
    const debounceMs = options.debounceMs ?? 200;
    const allowTopLevelImports = options.allowTopLevelImports ?? false;

    let scheduledRun: number | undefined;
    let lastDisposer: (() => void) | undefined;
    let disposed = false;

    const setStatus = (text: string, kind: LiveTsEditorStatusKind) => {
        defaultSetStatus(options.statusEl, options.onStatus, text, kind);
    };

    const editorState = EditorState.create({
        doc: options.initialTypeScript,
        extensions: [
            lineNumbers(),
            history(),
            javascript({ typescript: true }),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
            EditorView.updateListener.of((update) => {
                if (!update.docChanged) return;
                setStatus("Editing...", "editing");
                scheduleRun();
            }),
            EditorView.theme({
                "&": { backgroundColor: "rgb(0.1, 0.1,0.1)", color: "white" },
                ".cm-content": { caretColor: "white" },
                ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.06)" },
                ".cm-selectionBackground": { backgroundColor: "rgba(30,144,255,0.35)" },
            }),
        ],
    });

    const editorView = new EditorView({
        state: editorState,
        parent: options.editorParent,
    });

    async function runUserCode() {
        if (disposed) return;

        if (lastDisposer) {
            try {
                lastDisposer();
            } catch {
                // ignore
            }
            lastDisposer = undefined;
        }

        const tsSource = editorView.state.doc.toString();
        const compiled = compileTypeScript(tsSource, allowTopLevelImports);
        if (!compiled.ok) {
            setStatus(`Compile error: ${compiled.message}`, "compile-error");
            return;
        }

        try {
            const fn = new Function(
                "api",
                "return (async () => {\n" + compiled.js + "\n})();"
            ) as (api: TApi) => Promise<unknown>;

            const result = await fn(options.api);
            if (typeof result === "function") {
                lastDisposer = result as () => void;
            }

            setStatus("Running", "running");
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setStatus(`Runtime error: ${message}`, "runtime-error");
            // Avoid console.error so simple smoke tests don't fail by default.
            console.warn("Live editor runtime error:", err);
        }
    }

    function scheduleRun() {
        if (disposed) return;
        if (scheduledRun !== undefined) {
            window.clearTimeout(scheduledRun);
        }
        scheduledRun = window.setTimeout(() => {
            scheduledRun = undefined;
            void runUserCode();
        }, debounceMs);
    }

    setStatus("Ready", "ready");
    void runUserCode();

    return {
        editorView,
        getTypeScript: () => editorView.state.doc.toString(),
        setTypeScript: (text: string) => {
            editorView.dispatch({
                changes: { from: 0, to: editorView.state.doc.length, insert: text },
            });
        },
        runNow: async () => {
            if (scheduledRun !== undefined) {
                window.clearTimeout(scheduledRun);
                scheduledRun = undefined;
            }
            await runUserCode();
        },
        dispose: () => {
            disposed = true;
            if (scheduledRun !== undefined) {
                window.clearTimeout(scheduledRun);
                scheduledRun = undefined;
            }
            if (lastDisposer) {
                try {
                    lastDisposer();
                } catch {
                    // ignore
                }
                lastDisposer = undefined;
            }
            editorView.destroy();
        },
    };
}
