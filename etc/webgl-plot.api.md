## API Report File for "webgl-plot"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @public (undocumented)
export class ColorRGBA {
    constructor(r: number, g: number, b: number, a: number);
    // (undocumented)
    a: number;
    // (undocumented)
    b: number;
    // (undocumented)
    g: number;
    // (undocumented)
    r: number;
}

// Warning: (ae-forgotten-export) The symbol "WebglBaseLine" needs to be exported by the entry point webglplot.d.ts
//
// @public (undocumented)
export class WebglLine extends WebglBaseLine {
    constructor(c: ColorRGBA, numPoints: number);
    // (undocumented)
    constY(c: number): void;
    // (undocumented)
    getX(index: number): number;
    // (undocumented)
    getY(index: number): number;
    // (undocumented)
    linespaceX(start: number, stepsize: number): void;
    // (undocumented)
    setX(index: number, x: number): void;
    // (undocumented)
    setY(index: number, y: number): void;
    // (undocumented)
    shiftAdd(data: Float32Array): void;
}

// @public
export class WebGLplot {
    constructor(canv: HTMLCanvasElement);
    addLine(line: WebglBaseLine): void;
    // (undocumented)
    clear(): void;
    gOffsetX: number;
    gOffsetY: number;
    gScaleX: number;
    gScaleY: number;
    gXYratio: number;
    lines: WebglBaseLine[];
    update(): void;
    // (undocumented)
    viewport(a: number, b: number, c: number, d: number): void;
    }

// @public (undocumented)
export class WebglPolar extends WebglBaseLine {
    constructor(c: ColorRGBA, numPoints: number);
    // (undocumented)
    color: ColorRGBA;
    // (undocumented)
    coord: number;
    // (undocumented)
    getR(index: number): number;
    // (undocumented)
    getTheta(index: number): number;
    // (undocumented)
    getX(index: number): number;
    // (undocumented)
    getY(index: number): number;
    // (undocumented)
    intenisty: number;
    // (undocumented)
    numPoints: number;
    // (undocumented)
    offsetTheta: number;
    // (undocumented)
    setRtheta(index: number, theta: number, r: number): void;
    // (undocumented)
    visible: boolean;
    // (undocumented)
    xy: Float32Array;
}

// @public (undocumented)
export class WebglStep extends WebglBaseLine {
    constructor(c: ColorRGBA, num: number);
    // (undocumented)
    constY(c: number): void;
    // (undocumented)
    getX(index: number): number;
    // (undocumented)
    getY(index: number): number;
    // (undocumented)
    linespaceX(start: number, stepsize: number): void;
    // (undocumented)
    setY(index: number, y: number): void;
    // (undocumented)
    shiftAdd(data: Float32Array): void;
}


// (No @packageDocumentation comment for this package)

```