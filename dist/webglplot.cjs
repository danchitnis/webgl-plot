'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class ColorRGBA {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

/**
 * Baseline class
 */
class WebglBase {
    /**
     * @internal
     */
    constructor() {
        this.scaleX = 1;
        this.scaleY = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.loop = false;
        this._vbuffer = 0;
        this._coord = 0;
        this.visible = true;
        this.intensity = 1;
        this.xy = new Float32Array([]);
        this.numPoints = 0;
        this.color = new ColorRGBA(0, 0, 0, 1);
        this.webglNumPoints = 0;
    }
}

/**
 * The standard Line class
 */
class WebglLine extends WebglBase {
    /**
     * Create a new line
     * @param c - the color of the line
     * @param numPoints - number of data pints
     * @example
     * ```typescript
     * x= [0,1]
     * y= [1,2]
     * line = new WebglLine( new ColorRGBA(0.1,0.1,0.1,1), 2);
     * ```
     */
    constructor(c, numPoints) {
        super();
        this.currentIndex = 0;
        this.webglNumPoints = numPoints;
        this.numPoints = numPoints;
        this.color = c;
        this.xy = new Float32Array(2 * this.webglNumPoints);
    }
    /**
     * Set the X value at a specific index
     * @param index - the index of the data point
     * @param x - the horizontal value of the data point
     */
    setX(index, x) {
        this.xy[index * 2] = x;
    }
    /**
     * Set the Y value at a specific index
     * @param index : the index of the data point
     * @param y : the vertical value of the data point
     */
    setY(index, y) {
        this.xy[index * 2 + 1] = y;
    }
    /**
     * Get an X value at a specific index
     * @param index - the index of X
     */
    getX(index) {
        return this.xy[index * 2];
    }
    /**
     * Get an Y value at a specific index
     * @param index - the index of Y
     */
    getY(index) {
        return this.xy[index * 2 + 1];
    }
    /**
     * Make an equally spaced array of X points
     * @param start  - the start of the series
     * @param stepSize - step size between each data point
     *
     * @example
     * ```typescript
     * //x = [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8]
     * const numX = 10;
     * line.lineSpaceX(-1, 2 / numX);
     * ```
     */
    lineSpaceX(start, stepSize) {
        for (let i = 0; i < this.numPoints; i++) {
            // set x to -num/2:1:+num/2
            this.setX(i, start + stepSize * i);
        }
    }
    /**
     * Automatically generate X between -1 and 1
     * equal to lineSpaceX(-1, 2/ number of points)
     */
    arrangeX() {
        this.lineSpaceX(-1, 2 / this.numPoints);
    }
    /**
     * Set a constant value for all Y values in the line
     * @param c - constant value
     */
    constY(c) {
        for (let i = 0; i < this.numPoints; i++) {
            // set x to -num/2:1:+num/2
            this.setY(i, c);
        }
    }
    /**
     * Add a new Y values to the end of current array and shift it, so that the total number of the pair remains the same
     * @param data - the Y array
     *
     * @example
     * ```typescript
     * yArray = new Float32Array([3, 4, 5]);
     * line.shiftAdd(yArray);
     * ```
     */
    shiftAdd(data) {
        const shiftSize = data.length;
        for (let i = 0; i < this.numPoints - shiftSize; i++) {
            this.setY(i, this.getY(i + shiftSize));
        }
        for (let i = 0; i < shiftSize; i++) {
            this.setY(i + this.numPoints - shiftSize, data[i]);
        }
    }
    /**
     * Add new Y values to the line and maintain the position of the last data point
     */
    addArrayY(yArray) {
        if (this.currentIndex + yArray.length <= this.numPoints) {
            for (let i = 0; i < yArray.length; i++) {
                this.setY(this.currentIndex, yArray[i]);
                this.currentIndex++;
            }
        }
    }
    /**
     * Replace the all Y values of the line
     */
    replaceArrayY(yArray) {
        if (yArray.length == this.numPoints) {
            for (let i = 0; i < this.numPoints; i++) {
                this.setY(i, yArray[i]);
            }
        }
    }
}

/**
 * The step based line plot
 */
class WebglStep extends WebglBase {
    /**
     * Create a new step line
     * @param c - the color of the line
     * @param numPoints - number of data pints
     * @example
     * ```typescript
     * x= [0,1]
     * y= [1,2]
     * line = new WebglStep( new ColorRGBA(0.1,0.1,0.1,1), 2);
     * ```
     */
    constructor(c, num) {
        super();
        this.webglNumPoints = num * 2;
        this.numPoints = num;
        this.color = c;
        this.xy = new Float32Array(2 * this.webglNumPoints);
    }
    /**
     * Set the Y value at a specific index
     * @param index - the index of the data point
     * @param y - the vertical value of the data point
     */
    setY(index, y) {
        this.xy[index * 4 + 1] = y;
        this.xy[index * 4 + 3] = y;
    }
    getX(index) {
        return this.xy[index * 4];
    }
    /**
     * Get an X value at a specific index
     * @param index - the index of X
     */
    getY(index) {
        return this.xy[index * 4 + 1];
    }
    /**
     * Make an equally spaced array of X points
     * @param start  - the start of the series
     * @param stepSize - step size between each data point
     *
     * @example
     * ```typescript
     * //x = [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8]
     * const numX = 10;
     * line.lineSpaceX(-1, 2 / numX);
     * ```
     */
    lineSpaceX(start, stepsize) {
        for (let i = 0; i < this.numPoints; i++) {
            // set x to -num/2:1:+num/2
            this.xy[i * 4] = start + i * stepsize;
            this.xy[i * 4 + 2] = start + (i * stepsize + stepsize);
        }
    }
    /**
     * Set a constant value for all Y values in the line
     * @param c - constant value
     */
    constY(c) {
        for (let i = 0; i < this.numPoints; i++) {
            // set x to -num/2:1:+num/2
            this.setY(i, c);
        }
    }
    /**
     * Add a new Y values to the end of current array and shift it, so that the total number of the pair remains the same
     * @param data - the Y array
     *
     * @example
     * ```typescript
     * yArray = new Float32Array([3, 4, 5]);
     * line.shiftAdd(yArray);
     * ```
     */
    shiftAdd(data) {
        const shiftSize = data.length;
        for (let i = 0; i < this.numPoints - shiftSize; i++) {
            this.setY(i, this.getY(i + shiftSize));
        }
        for (let i = 0; i < shiftSize; i++) {
            this.setY(i + this.numPoints - shiftSize, data[i]);
        }
    }
}

class WebglPolar extends WebglBase {
    constructor(c, numPoints) {
        super();
        this.webglNumPoints = numPoints;
        this.numPoints = numPoints;
        this.color = c;
        this.intenisty = 1;
        this.xy = new Float32Array(2 * this.webglNumPoints);
        this._vbuffer = 0;
        this._coord = 0;
        this.visible = true;
        this.offsetTheta = 0;
    }
    /**
     * @param index: index of the line
     * @param theta : angle in deg
     * @param r : radius
     */
    setRtheta(index, theta, r) {
        //const rA = Math.abs(r);
        //const thetaA = theta % 360;
        const x = r * Math.cos((2 * Math.PI * (theta + this.offsetTheta)) / 360);
        const y = r * Math.sin((2 * Math.PI * (theta + this.offsetTheta)) / 360);
        //const index = Math.round( ((theta % 360)/360) * this.numPoints );
        this.setX(index, x);
        this.setY(index, y);
    }
    getTheta(index) {
        //return Math.tan
        return 0;
    }
    getR(index) {
        //return Math.tan
        return Math.sqrt(Math.pow(this.getX(index), 2) + Math.pow(this.getY(index), 2));
    }
    setX(index, x) {
        this.xy[index * 2] = x;
    }
    setY(index, y) {
        this.xy[index * 2 + 1] = y;
    }
    getX(index) {
        return this.xy[index * 2];
    }
    getY(index) {
        return this.xy[index * 2 + 1];
    }
}

/**
 * The Square class
 */
class WebglSquare extends WebglBase {
    /**
     * Create a new line
     * @param c - the color of the line
     * @example
     * ```typescript
     * line = new WebglSquare( new ColorRGBA(0.1,0.1,0.1,0.5) );
     * ```
     */
    constructor(c) {
        super();
        this.webglNumPoints = 4;
        this.numPoints = 4;
        this.color = c;
        this.xy = new Float32Array(2 * this.webglNumPoints);
    }
    /**
     * draw a square
     * @param x1 start x
     * @param y1 start y
     * @param x2 end x
     * @param y2 end y
     */
    setSquare(x1, y1, x2, y2) {
        this.xy = new Float32Array([x1, y1, x1, y2, x2, y1, x2, y2]);
    }
}

/**
 * modified functions from:
 * https://github.com/stackgl/gl-vec2
 * See License2.md for more info
 */
const scaleAndAdd = (a, b, scale) => {
    const out = { x: 0, y: 0 };
    out.x = a.x + b.x * scale;
    out.y = a.y + b.y * scale;
    return out;
};
const normal = (dir) => {
    //get perpendicular
    const out = set(-dir.y, dir.x);
    return out;
};
const direction = (a, b) => {
    //get unit dir of two lines
    let out = subtract(a, b);
    out = normalize(out);
    return out;
};
/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
const add = (a, b) => {
    const out = { x: 0, y: 0 };
    out.x = a.x + b.x;
    out.y = a.y + b.y;
    return out;
};
/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
const dot = (a, b) => {
    return a.x * b.x + a.y * b.y;
};
/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
const normalize = (a) => {
    const out = { x: 0, y: 0 };
    let len = a.x * a.x + a.y * a.y;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out.x = a.x * len;
        out.y = a.y * len;
    }
    return out;
};
/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
const set = (x, y) => {
    const out = { x: 0, y: 0 };
    out.x = x;
    out.y = y;
    return out;
};
/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
const subtract = (a, b) => {
    const out = { x: 0, y: 0 };
    out.x = a.x - b.x;
    out.y = a.y - b.y;
    return out;
};

/**
 * inspired and modified from:
 * https://github.com/mattdesl/polyline-normals
 * See License1.md for more info
 */
const PolyLine = (lineXY) => {
    let curNormal;
    let lineA = { x: 0, y: 0 };
    let lineB = { x: 0, y: 0 };
    const out = [];
    const addNext = (normal, length) => {
        out.push({ vec2: normal, miterLength: length });
    };
    const getXY = (index) => {
        return { x: lineXY[index * 2], y: lineXY[index * 2 + 1] };
    };
    // add initial normals
    lineA = direction(getXY(1), getXY(0));
    curNormal = normal(lineA);
    addNext(curNormal, 1);
    const numPoints = lineXY.length / 2;
    for (let i = 1; i < numPoints - 1; i++) {
        const last = getXY(i - 1);
        const cur = getXY(i);
        const next = getXY(i + 1);
        lineA = direction(cur, last);
        curNormal = normal(lineA);
        lineB = direction(next, cur);
        //stores tangent & miter
        const miter = computeMiter(lineA, lineB);
        const miterLen = computeMiterLen(lineA, miter, 1);
        addNext(miter, miterLen);
    }
    // add last normal
    // no miter, simple segment
    lineA = direction(getXY(numPoints - 1), getXY(numPoints - 2));
    curNormal = normal(lineA); //reset normal
    addNext(curNormal, 1);
    return out;
};
const computeMiter = (lineA, lineB) => {
    //get tangent line
    let tangent = add(lineA, lineB);
    tangent = normalize(tangent);
    //get miter as a unit vector
    const miter = set(-tangent.y, tangent.x);
    return miter;
};
const computeMiterLen = (lineA, miter, halfThick) => {
    const tmp = set(-lineA.y, lineA.x);
    //get the necessary length of our miter
    return halfThick / dot(miter, tmp);
};

/**
 * The standard Line class
 */
class WebglThickLine extends WebglBase {
    /**
     * Create a new line
     * @param c - the color of the line
     * @param numPoints - number of data pints
     * @example
     * ```typescript
     * x= [0,1]
     * y= [1,2]
     * line = new WebglLine( new ColorRGBA(0.1,0.1,0.1,1), 2);
     * ```
     */
    constructor(c, numPoints, thickness) {
        super();
        this.currentIndex = 0;
        this._thicknessRequested = 0;
        this._actualThickness = 0;
        this.webglNumPoints = numPoints * 2;
        this.numPoints = numPoints;
        this.color = c;
        this._thicknessRequested = thickness;
        this._linePoints = new Float32Array(numPoints * 2);
        //this.triPoints = new Float32Array(this.numPoints * 4);
        this.xy = new Float32Array(2 * this.webglNumPoints);
    }
    convertToTriPoints() {
        //const thick = 0.01;
        const halfThick = this._actualThickness / 2;
        const normals = PolyLine(this._linePoints);
        //console.log(this.linePoints);
        //console.log(normals);
        for (let i = 0; i < this.numPoints; i++) {
            const x = this._linePoints[2 * i];
            const y = this._linePoints[2 * i + 1];
            const point = { x: x, y: y };
            const top = scaleAndAdd(point, normals[i].vec2, normals[i].miterLength * halfThick);
            const bot = scaleAndAdd(point, normals[i].vec2, -normals[i].miterLength * halfThick);
            this.xy[i * 4] = top.x;
            this.xy[i * 4 + 1] = top.y;
            this.xy[i * 4 + 2] = bot.x;
            this.xy[i * 4 + 3] = bot.y;
        }
    }
    /**
     * Set the X value at a specific index
     * @param index - the index of the data point
     * @param x - the horizontal value of the data point
     */
    setX(index, x) {
        this._linePoints[index * 2] = x;
    }
    /**
     * Set the Y value at a specific index
     * @param index : the index of the data point
     * @param y : the vertical value of the data point
     */
    setY(index, y) {
        this._linePoints[index * 2 + 1] = y;
    }
    /**
     * Make an equally spaced array of X points
     * @param start  - the start of the series
     * @param stepSize - step size between each data point
     *
     * @example
     * ```typescript
     * //x = [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8]
     * const numX = 10;
     * line.lineSpaceX(-1, 2 / numX);
     * ```
     */
    lineSpaceX(start, stepSize) {
        for (let i = 0; i < this.numPoints; i++) {
            // set x to -num/2:1:+num/2
            this.setX(i, start + stepSize * i);
        }
    }
    setThickness(thickness) {
        this._thicknessRequested = thickness;
    }
    getThickness() {
        return this._thicknessRequested;
    }
    setActualThickness(thickness) {
        this._actualThickness = thickness;
    }
}

/**
 * Author Danial Chitnis 2019-20
 *
 * inspired by:
 * https://codepen.io/AzazelN28
 * https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
 */
/**
 * The main class for the webgl-plot library
 */
class WebglPlot {
    /**
     * Create a webgl-plot instance
     * @param canvas - the canvas in which the plot appears
     * @param debug - (Optional) log debug messages to console
     *
     * @example
     *
     * For HTMLCanvas
     * ```typescript
     * const canvas = document.getElementbyId("canvas");
     *
     * const devicePixelRatio = window.devicePixelRatio || 1;
     * canvas.width = canvas.clientWidth * devicePixelRatio;
     * canvas.height = canvas.clientHeight * devicePixelRatio;
     *
     * const webglp = new WebGLplot(canvas);
     * ...
     * ```
     * @example
     *
     * For OffScreenCanvas
     * ```typescript
     * const offscreen = htmlCanvas.transferControlToOffscreen();
     *
     * offscreen.width = htmlCanvas.clientWidth * window.devicePixelRatio;
     * offscreen.height = htmlCanvas.clientHeight * window.devicePixelRatio;
     *
     * const worker = new Worker("offScreenCanvas.js", { type: "module" });
     * worker.postMessage({ canvas: offscreen }, [offscreen]);
     * ```
     * Then in offScreenCanvas.js
     * ```typescript
     * onmessage = function (evt) {
     * const wglp = new WebGLplot(evt.data.canvas);
     * ...
     * }
     * ```
     */
    constructor(canvas, options) {
        /**
         * log debug output
         */
        this.debug = false;
        this.addLine = this.addDataLine;
        if (options == undefined) {
            this.webgl = canvas.getContext("webgl", {
                antialias: true,
                transparent: false,
            });
        }
        else {
            this.webgl = canvas.getContext("webgl", {
                antialias: options.antialias,
                transparent: options.transparent,
                desynchronized: options.deSync,
                powerPerformance: options.powerPerformance,
                preserveDrawing: options.preserveDrawing,
            });
            this.debug = options.debug == undefined ? false : options.debug;
        }
        this.log("canvas type is: " + canvas.constructor.name);
        this.log(`[webgl-plot]:width=${canvas.width}, height=${canvas.height}`);
        this._linesData = [];
        this._linesAux = [];
        this._thickLines = [];
        this._surfaces = [];
        //this.webgl = webgl;
        this.gScaleX = 1;
        this.gScaleY = 1;
        this.gXYratio = 1;
        this.gOffsetX = 0;
        this.gOffsetY = 0;
        this.gLog10X = false;
        this.gLog10Y = false;
        // Clear the color
        this.webgl.clear(this.webgl.COLOR_BUFFER_BIT);
        // Set the view port
        this.webgl.viewport(0, 0, canvas.width, canvas.height);
        this._progLine = this.webgl.createProgram();
        this.initThinLineProgram();
        //https://learnopengl.com/Advanced-OpenGL/Blending
        this.webgl.enable(this.webgl.BLEND);
        this.webgl.blendFunc(this.webgl.SRC_ALPHA, this.webgl.ONE_MINUS_SRC_ALPHA);
    }
    get linesData() {
        return this._linesData;
    }
    get linesAux() {
        return this._linesAux;
    }
    get thickLines() {
        return this._thickLines;
    }
    get surfaces() {
        return this._surfaces;
    }
    /**
     * updates and redraws the content of the plot
     */
    _drawLines(lines) {
        const webgl = this.webgl;
        lines.forEach((line) => {
            if (line.visible) {
                webgl.useProgram(this._progLine);
                const uscale = webgl.getUniformLocation(this._progLine, "uscale");
                webgl.uniformMatrix2fv(uscale, false, new Float32Array([
                    line.scaleX * this.gScaleX * (this.gLog10X ? 1 / Math.log(10) : 1),
                    0,
                    0,
                    line.scaleY * this.gScaleY * this.gXYratio * (this.gLog10Y ? 1 / Math.log(10) : 1),
                ]));
                const uoffset = webgl.getUniformLocation(this._progLine, "uoffset");
                webgl.uniform2fv(uoffset, new Float32Array([line.offsetX + this.gOffsetX, line.offsetY + this.gOffsetY]));
                const isLog = webgl.getUniformLocation(this._progLine, "is_log");
                webgl.uniform2iv(isLog, new Int32Array([this.gLog10X ? 1 : 0, this.gLog10Y ? 1 : 0]));
                const uColor = webgl.getUniformLocation(this._progLine, "uColor");
                webgl.uniform4fv(uColor, [line.color.r, line.color.g, line.color.b, line.color.a]);
                webgl.bufferData(webgl.ARRAY_BUFFER, line.xy, webgl.STREAM_DRAW);
                webgl.drawArrays(line.loop ? webgl.LINE_LOOP : webgl.LINE_STRIP, 0, line.webglNumPoints);
            }
        });
    }
    _drawSurfaces(squares) {
        const webgl = this.webgl;
        squares.forEach((square) => {
            if (square.visible) {
                webgl.useProgram(this._progLine);
                const uscale = webgl.getUniformLocation(this._progLine, "uscale");
                webgl.uniformMatrix2fv(uscale, false, new Float32Array([
                    square.scaleX * this.gScaleX * (this.gLog10X ? 1 / Math.log(10) : 1),
                    0,
                    0,
                    square.scaleY * this.gScaleY * this.gXYratio * (this.gLog10Y ? 1 / Math.log(10) : 1),
                ]));
                const uoffset = webgl.getUniformLocation(this._progLine, "uoffset");
                webgl.uniform2fv(uoffset, new Float32Array([square.offsetX + this.gOffsetX, square.offsetY + this.gOffsetY]));
                const isLog = webgl.getUniformLocation(this._progLine, "is_log");
                webgl.uniform2iv(isLog, new Int32Array([this.gLog10X ? 1 : 0, this.gLog10Y ? 1 : 0]));
                const uColor = webgl.getUniformLocation(this._progLine, "uColor");
                webgl.uniform4fv(uColor, [square.color.r, square.color.g, square.color.b, square.color.a]);
                webgl.bufferData(webgl.ARRAY_BUFFER, square.xy, webgl.STREAM_DRAW);
                webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, square.webglNumPoints);
            }
        });
    }
    _drawTriangles(thickLine) {
        const webgl = this.webgl;
        webgl.bufferData(webgl.ARRAY_BUFFER, thickLine.xy, webgl.STREAM_DRAW);
        webgl.useProgram(this._progLine);
        const uscale = webgl.getUniformLocation(this._progLine, "uscale");
        webgl.uniformMatrix2fv(uscale, false, new Float32Array([
            thickLine.scaleX * this.gScaleX * (this.gLog10X ? 1 / Math.log(10) : 1),
            0,
            0,
            thickLine.scaleY * this.gScaleY * this.gXYratio * (this.gLog10Y ? 1 / Math.log(10) : 1),
        ]));
        const uoffset = webgl.getUniformLocation(this._progLine, "uoffset");
        webgl.uniform2fv(uoffset, new Float32Array([thickLine.offsetX + this.gOffsetX, thickLine.offsetY + this.gOffsetY]));
        const isLog = webgl.getUniformLocation(this._progLine, "is_log");
        webgl.uniform2iv(isLog, new Int32Array([0, 0]));
        const uColor = webgl.getUniformLocation(this._progLine, "uColor");
        webgl.uniform4fv(uColor, [
            thickLine.color.r,
            thickLine.color.g,
            thickLine.color.b,
            thickLine.color.a,
        ]);
        webgl.drawArrays(webgl.TRIANGLE_STRIP, 0, thickLine.xy.length / 2);
    }
    _drawThickLines() {
        this._thickLines.forEach((thickLine) => {
            if (thickLine.visible) {
                const calibFactor = Math.min(this.gScaleX, this.gScaleY);
                //const calibFactor = 10;
                //console.log(thickLine.getThickness());
                thickLine.setActualThickness(thickLine.getThickness() / calibFactor);
                thickLine.convertToTriPoints();
                this._drawTriangles(thickLine);
            }
        });
    }
    /**
     * Draw and clear the canvas
     */
    update() {
        this.clear();
        this.draw();
    }
    /**
     * Draw without clearing the canvas
     */
    draw() {
        this._drawLines(this.linesData);
        this._drawLines(this.linesAux);
        this._drawThickLines();
        this._drawSurfaces(this.surfaces);
    }
    /**
     * Clear the canvas
     */
    clear() {
        //this.webgl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.webgl.clear(this.webgl.COLOR_BUFFER_BIT);
    }
    /**
     * adds a line to the plot
     * @param line - this could be any of line, linestep, histogram, or polar
     *
     * @example
     * ```typescript
     * const line = new line(color, numPoints);
     * wglp.addLine(line);
     * ```
     */
    _addLine(line) {
        //line.initProgram(this.webgl);
        line._vbuffer = this.webgl.createBuffer();
        this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);
        this.webgl.bufferData(this.webgl.ARRAY_BUFFER, line.xy, this.webgl.STREAM_DRAW);
        //this.webgl.bindBuffer(this.webgl.ARRAY_BUFFER, line._vbuffer);
        line._coord = this.webgl.getAttribLocation(this._progLine, "coordinates");
        this.webgl.vertexAttribPointer(line._coord, 2, this.webgl.FLOAT, false, 0, 0);
        this.webgl.enableVertexAttribArray(line._coord);
    }
    addDataLine(line) {
        this._addLine(line);
        this.linesData.push(line);
    }
    addAuxLine(line) {
        this._addLine(line);
        this.linesAux.push(line);
    }
    addThickLine(thickLine) {
        this._addLine(thickLine);
        this._thickLines.push(thickLine);
    }
    addSurface(surface) {
        this._addLine(surface);
        this.surfaces.push(surface);
    }
    initThinLineProgram() {
        const vertCode = `
      attribute vec2 coordinates;
      uniform mat2 uscale;
      uniform vec2 uoffset;
      uniform ivec2 is_log;

      void main(void) {
         float x = (is_log[0]==1) ? log(coordinates.x) : coordinates.x;
         float y = (is_log[1]==1) ? log(coordinates.y) : coordinates.y;
         vec2 line = vec2(x, y);
         gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);
      }`;
        // Create a vertex shader object
        const vertShader = this.webgl.createShader(this.webgl.VERTEX_SHADER);
        // Attach vertex shader source code
        this.webgl.shaderSource(vertShader, vertCode);
        // Compile the vertex shader
        this.webgl.compileShader(vertShader);
        // Fragment shader source code
        const fragCode = `
         precision mediump float;
         uniform highp vec4 uColor;
         void main(void) {
            gl_FragColor =  uColor;
         }`;
        const fragShader = this.webgl.createShader(this.webgl.FRAGMENT_SHADER);
        this.webgl.shaderSource(fragShader, fragCode);
        this.webgl.compileShader(fragShader);
        this._progLine = this.webgl.createProgram();
        this.webgl.attachShader(this._progLine, vertShader);
        this.webgl.attachShader(this._progLine, fragShader);
        this.webgl.linkProgram(this._progLine);
    }
    /**
     * remove the last data line
     */
    popDataLine() {
        this.linesData.pop();
    }
    /**
     * remove all the lines
     */
    removeAllLines() {
        this._linesData = [];
        this._linesAux = [];
        this._thickLines = [];
        this._surfaces = [];
    }
    /**
     * remove all data lines
     */
    removeDataLines() {
        this._linesData = [];
    }
    /**
     * remove all auxiliary lines
     */
    removeAuxLines() {
        this._linesAux = [];
    }
    /**
     * Change the WbGL viewport
     * @param a
     * @param b
     * @param c
     * @param d
     */
    viewport(a, b, c, d) {
        this.webgl.viewport(a, b, c, d);
    }
    log(str) {
        if (this.debug) {
            console.log("[webgl-plot]:" + str);
        }
    }
}

exports.ColorRGBA = ColorRGBA;
exports.WebglLine = WebglLine;
exports.WebglPlot = WebglPlot;
exports.WebglPolar = WebglPolar;
exports.WebglSquare = WebglSquare;
exports.WebglStep = WebglStep;
exports.WebglThickLine = WebglThickLine;
