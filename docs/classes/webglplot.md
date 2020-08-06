---
id: "webglplot"
title: "WebGLPlot"
sidebar_label: "WebGLPlot"
---

[webgl-plot](../index.md) › [Globals](../globals.md) › [WebGLPlot](webglplot.md)

The main class for the webgl-plot library

## Hierarchy

* **WebGLPlot**

## Index

### Constructors

* [constructor](webglplot.md#constructor)

### Properties

* [gOffsetX](webglplot.md#goffsetx)
* [gOffsetY](webglplot.md#goffsety)
* [gScaleX](webglplot.md#gscalex)
* [gScaleY](webglplot.md#gscaley)
* [gXYratio](webglplot.md#gxyratio)
* [lines](webglplot.md#lines)

### Methods

* [addLine](webglplot.md#addline)
* [clear](webglplot.md#clear)
* [removeLine](webglplot.md#removeline)
* [update](webglplot.md#update)
* [viewport](webglplot.md#viewport)

## Constructors

###  constructor

\+ **new WebGLPlot**(`canvas`: HTMLCanvasElement | OffscreenCanvas): *[WebGLPlot](webglplot.md)*

*Defined in [src/webglplot.ts:59](https://github.com/danchitnis/webgl-plot/blob/d10059b/src/webglplot.ts#L59)*

Create a webgl-plot instance

**`example`** 

For HTMLCanvas
```typescript
const canvas = dcoument.getEelementbyId("canvas");

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

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`canvas` | HTMLCanvasElement &#124; OffscreenCanvas | the canvas in which the plot appears  |

**Returns:** *[WebGLPlot](webglplot.md)*

## Properties

###  gOffsetX

• **gOffsetX**: *number*

*Defined in [src/webglplot.ts:48](https://github.com/danchitnis/webgl-plot/blob/d10059b/src/webglplot.ts#L48)*

Global horizontal offset

**`default`** = 0

___

###  gOffsetY

• **gOffsetY**: *number*

*Defined in [src/webglplot.ts:54](https://github.com/danchitnis/webgl-plot/blob/d10059b/src/webglplot.ts#L54)*

Global vertical offset

**`default`** = 0

___

###  gScaleX

• **gScaleX**: *number*

*Defined in [src/webglplot.ts:30](https://github.com/danchitnis/webgl-plot/blob/d10059b/src/webglplot.ts#L30)*

Global horizontal scale factor

**`default`** = 1.0

___

###  gScaleY

• **gScaleY**: *number*

*Defined in [src/webglplot.ts:36](https://github.com/danchitnis/webgl-plot/blob/d10059b/src/webglplot.ts#L36)*

Global vertical scale factor

**`default`** = 1.0

___

###  gXYratio

• **gXYratio**: *number*

*Defined in [src/webglplot.ts:42](https://github.com/danchitnis/webgl-plot/blob/d10059b/src/webglplot.ts#L42)*

Global X/Y scale ratio

**`default`** = 1

___

###  lines

• **lines**: *[WebglBaseLine](webglbaseline.md)[]*

*Defined in [src/webglplot.ts:59](https://github.com/danchitnis/webgl-plot/blob/d10059b/src/webglplot.ts#L59)*

collection of lines in the plot

## Methods

###  addLine

▸ **addLine**(`line`: [WebglBaseLine](webglbaseline.md)): *void*

*Defined in [src/webglplot.ts:181](https://github.com/danchitnis/webgl-plot/blob/d10059b/src/webglplot.ts#L181)*

adds a line to the plot

**`example`** 
```typescript
const line = new line(color, numPoints);
wglp.addLine(line);
```

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`line` | [WebglBaseLine](webglbaseline.md) | this could be any of line, linestep, histogram, or polar  |

**Returns:** *void*

___

###  clear

▸ **clear**(): *void*

*Defined in [src/webglplot.ts:165](https://github.com/danchitnis/webgl-plot/blob/d10059b/src/webglplot.ts#L165)*

**Returns:** *void*

___

###  removeLine

▸ **removeLine**(`index`: number): *void*

*Defined in [src/webglplot.ts:229](https://github.com/danchitnis/webgl-plot/blob/d10059b/src/webglplot.ts#L229)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *void*

___

###  update

▸ **update**(): *void*

*Defined in [src/webglplot.ts:130](https://github.com/danchitnis/webgl-plot/blob/d10059b/src/webglplot.ts#L130)*

updates and redraws the content of the plot

**Returns:** *void*

___

###  viewport

▸ **viewport**(`a`: number, `b`: number, `c`: number, `d`: number): *void*

*Defined in [src/webglplot.ts:240](https://github.com/danchitnis/webgl-plot/blob/d10059b/src/webglplot.ts#L240)*

Change the WbGL viewport

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`a` | number | - |
`b` | number | - |
`c` | number | - |
`d` | number |   |

**Returns:** *void*
