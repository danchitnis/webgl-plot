---
id: "webglplot"
title: "WebGLplot"
sidebar_label: "WebGLplot"
---

[webgl-plot](../index.md) › [Globals](../globals.md) › [WebGLplot](webglplot.md)

The main class for the webgl-plot framework

## Hierarchy

* **WebGLplot**

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

\+ **new WebGLplot**(`canv`: HTMLCanvasElement): *[WebGLplot](webglplot.md)*

*Defined in [webglplot.ts:58](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/webglplot.ts#L58)*

Create a webgl-plot instance

**Parameters:**

Name | Type |
------ | ------ |
`canv` | HTMLCanvasElement |

**Returns:** *[WebGLplot](webglplot.md)*

## Properties

###  gOffsetX

• **gOffsetX**: *number*

*Defined in [webglplot.ts:47](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/webglplot.ts#L47)*

Global horizontal offset

**`default`** = 0

___

###  gOffsetY

• **gOffsetY**: *number*

*Defined in [webglplot.ts:53](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/webglplot.ts#L53)*

Global vertical offset

**`default`** = 0

___

###  gScaleX

• **gScaleX**: *number*

*Defined in [webglplot.ts:29](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/webglplot.ts#L29)*

Global horizontal scale factor

**`default`** = 1.0

___

###  gScaleY

• **gScaleY**: *number*

*Defined in [webglplot.ts:35](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/webglplot.ts#L35)*

Global vertical scale factor

**`default`** = 1.0

___

###  gXYratio

• **gXYratio**: *number*

*Defined in [webglplot.ts:41](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/webglplot.ts#L41)*

Global X/Y scale ratio

**`default`** = 1

___

###  lines

• **lines**: *[WebglBaseLine](webglbaseline.md)[]*

*Defined in [webglplot.ts:58](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/webglplot.ts#L58)*

collection of lines in the plot

## Methods

###  addLine

▸ **addLine**(`line`: [WebglBaseLine](webglbaseline.md)): *void*

*Defined in [webglplot.ts:142](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/webglplot.ts#L142)*

adds a line to the plot

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`line` | [WebglBaseLine](webglbaseline.md) | : this could be any of line, linestep, histogram, or polar  |

**Returns:** *void*

___

###  clear

▸ **clear**(): *void*

*Defined in [webglplot.ts:132](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/webglplot.ts#L132)*

**Returns:** *void*

___

###  update

▸ **update**(): *void*

*Defined in [webglplot.ts:105](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/webglplot.ts#L105)*

update and redraws the content

**Returns:** *void*

___

###  viewport

▸ **viewport**(`a`: number, `b`: number, `c`: number, `d`: number): *void*

*Defined in [webglplot.ts:192](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/webglplot.ts#L192)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | number |
`b` | number |
`c` | number |
`d` | number |

**Returns:** *void*
