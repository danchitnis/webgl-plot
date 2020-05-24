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
* [update](webglplot.md#update)
* [viewport](webglplot.md#viewport)

## Constructors

###  constructor

\+ **new WebGLPlot**(`canv`: HTMLCanvasElement): *[WebGLPlot](webglplot.md)*

*Defined in [webglplot.ts:59](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/webglplot.ts#L59)*

Create a webgl-plot instance

**`example`** 
```typescript
const canv = dcoument.getEelementbyId("canvas");
const webglp = new WebGLplot(canv);
```

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`canv` | HTMLCanvasElement | the HTML canvas in which the plot appears  |

**Returns:** *[WebGLPlot](webglplot.md)*

## Properties

###  gOffsetX

• **gOffsetX**: *number*

*Defined in [webglplot.ts:48](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/webglplot.ts#L48)*

Global horizontal offset

**`default`** = 0

___

###  gOffsetY

• **gOffsetY**: *number*

*Defined in [webglplot.ts:54](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/webglplot.ts#L54)*

Global vertical offset

**`default`** = 0

___

###  gScaleX

• **gScaleX**: *number*

*Defined in [webglplot.ts:30](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/webglplot.ts#L30)*

Global horizontal scale factor

**`default`** = 1.0

___

###  gScaleY

• **gScaleY**: *number*

*Defined in [webglplot.ts:36](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/webglplot.ts#L36)*

Global vertical scale factor

**`default`** = 1.0

___

###  gXYratio

• **gXYratio**: *number*

*Defined in [webglplot.ts:42](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/webglplot.ts#L42)*

Global X/Y scale ratio

**`default`** = 1

___

###  lines

• **lines**: *[WebglBaseLine](webglbaseline.md)[]*

*Defined in [webglplot.ts:59](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/webglplot.ts#L59)*

collection of lines in the plot

## Methods

###  addLine

▸ **addLine**(`line`: [WebglBaseLine](webglbaseline.md)): *void*

*Defined in [webglplot.ts:157](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/webglplot.ts#L157)*

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

*Defined in [webglplot.ts:141](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/webglplot.ts#L141)*

**Returns:** *void*

___

###  update

▸ **update**(): *void*

*Defined in [webglplot.ts:106](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/webglplot.ts#L106)*

updates and redraws the content of the plot

**Returns:** *void*

___

###  viewport

▸ **viewport**(`a`: number, `b`: number, `c`: number, `d`: number): *void*

*Defined in [webglplot.ts:212](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/webglplot.ts#L212)*

Change the WbGL viewport

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`a` | number | - |
`b` | number | - |
`c` | number | - |
`d` | number |   |

**Returns:** *void*
