**webgl-plot**

> [README](../README.md) / [Globals](../globals.md) / WebGLPlot

# Class: WebGLPlot

The main class for the webgl-plot library

## Hierarchy

* **WebGLPlot**

## Index

### Constructors

* [constructor](webglplot.md#constructor)

### Properties

* [debug](webglplot.md#debug)
* [gOffsetX](webglplot.md#goffsetx)
* [gOffsetY](webglplot.md#goffsety)
* [gScaleX](webglplot.md#gscalex)
* [gScaleY](webglplot.md#gscaley)
* [gXYratio](webglplot.md#gxyratio)

### Accessors

* [lines](webglplot.md#lines)

### Methods

* [addLine](webglplot.md#addline)
* [clear](webglplot.md#clear)
* [popLine](webglplot.md#popline)
* [removeAllLines](webglplot.md#removealllines)
* [update](webglplot.md#update)
* [viewport](webglplot.md#viewport)

## Constructors

### constructor

\+ **new WebGLPlot**(`canvas`: HTMLCanvasElement \| OffscreenCanvas, `options?`: [WebGLPlotConfig](../globals.md#webglplotconfig)): [WebGLPlot](webglplot.md)

*Defined in [src/webglplot.ts:79](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L79)*

Create a webgl-plot instance

**`example`** 

For HTMLCanvas
```typescript
const canvas = document.getElementbyId("canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const webglp = new WebGLplot(canvas);
...
```

**`example`** 

For OffScreenCanvas
```typescript
const offscreen = htmlCanvas.transferControlToOffscreen();

offscreen.width = htmlCanvas.clientWidth * window.devicePixelRatio;
offscreen.height = htmlCanvas.clientHeight * window.devicePixelRatio;

const worker = new Worker("offScreenCanvas.js", { type: "module" });
worker.postMessage({ canvas: offscreen }, [offscreen]);
```
Then in offScreenCanvas.js
```typescript
onmessage = function (evt) {
const wglp = new WebGLplot(evt.data.canvas);
...
}
```

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`canvas` | HTMLCanvasElement \| OffscreenCanvas | the canvas in which the plot appears |
`options?` | [WebGLPlotConfig](../globals.md#webglplotconfig) | - |

**Returns:** [WebGLPlot](webglplot.md)

## Properties

### debug

•  **debug**: boolean = false

*Defined in [src/webglplot.ts:79](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L79)*

log debug output

___

### gOffsetX

•  **gOffsetX**: number

*Defined in [src/webglplot.ts:57](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L57)*

Global horizontal offset

**`default`** = 0

___

### gOffsetY

•  **gOffsetY**: number

*Defined in [src/webglplot.ts:63](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L63)*

Global vertical offset

**`default`** = 0

___

### gScaleX

•  **gScaleX**: number

*Defined in [src/webglplot.ts:39](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L39)*

Global horizontal scale factor

**`default`** = 1.0

___

### gScaleY

•  **gScaleY**: number

*Defined in [src/webglplot.ts:45](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L45)*

Global vertical scale factor

**`default`** = 1.0

___

### gXYratio

•  **gXYratio**: number

*Defined in [src/webglplot.ts:51](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L51)*

Global X/Y scale ratio

**`default`** = 1

## Accessors

### lines

• get **lines**(): [WebglBaseLine](webglbaseline.md)[]

*Defined in [src/webglplot.ts:70](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L70)*

**Returns:** [WebglBaseLine](webglbaseline.md)[]

## Methods

### addLine

▸ **addLine**(`line`: [WebglLine](webglline.md) \| [WebglStep](webglstep.md) \| [WebglPolar](webglpolar.md)): void

*Defined in [src/webglplot.ts:217](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L217)*

adds a line to the plot

**`example`** 
```typescript
const line = new line(color, numPoints);
wglp.addLine(line);
```

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`line` | [WebglLine](webglline.md) \| [WebglStep](webglstep.md) \| [WebglPolar](webglpolar.md) | this could be any of line, linestep, histogram, or polar  |

**Returns:** void

___

### clear

▸ **clear**(): void

*Defined in [src/webglplot.ts:201](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L201)*

**Returns:** void

___

### popLine

▸ **popLine**(): void

*Defined in [src/webglplot.ts:270](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L270)*

remove the last line

**Returns:** void

___

### removeAllLines

▸ **removeAllLines**(): void

*Defined in [src/webglplot.ts:277](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L277)*

remove all the lines

**Returns:** void

___

### update

▸ **update**(): void

*Defined in [src/webglplot.ts:166](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L166)*

updates and redraws the content of the plot

**Returns:** void

___

### viewport

▸ **viewport**(`a`: number, `b`: number, `c`: number, `d`: number): void

*Defined in [src/webglplot.ts:288](https://github.com/danchitnis/webgl-plot/blob/b445ae1/src/webglplot.ts#L288)*

Change the WbGL viewport

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`a` | number |  |
`b` | number |  |
`c` | number |  |
`d` | number |   |

**Returns:** void
