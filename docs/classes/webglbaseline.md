---
id: "webglbaseline"
title: "WebglBaseLine"
sidebar_label: "WebglBaseLine"
---

[webgl-plot](../index.md) › [Globals](../globals.md) › [WebglBaseLine](webglbaseline.md)

Baseline class

## Hierarchy

* **WebglBaseLine**

  ↳ [WebglLine](webglline.md)

  ↳ [WebglPolar](webglpolar.md)

  ↳ [WebglStep](webglstep.md)

## Index

### Constructors

* [constructor](webglbaseline.md#constructor)

### Properties

* [color](webglbaseline.md#color)
* [intensity](webglbaseline.md#intensity)
* [loop](webglbaseline.md#loop)
* [numPoints](webglbaseline.md#numpoints)
* [offsetX](webglbaseline.md#offsetx)
* [offsetY](webglbaseline.md#offsety)
* [scaleX](webglbaseline.md#scalex)
* [scaleY](webglbaseline.md#scaley)
* [visible](webglbaseline.md#visible)
* [webglNumPoints](webglbaseline.md#webglnumpoints)
* [xy](webglbaseline.md#xy)

## Constructors

###  constructor

\+ **new WebglBaseLine**(): *[WebglBaseLine](webglbaseline.md)*

*Defined in [WebglBaseLine.ts:78](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/WebglBaseLine.ts#L78)*

**`internal`** 

**Returns:** *[WebglBaseLine](webglbaseline.md)*

## Properties

###  color

• **color**: *[ColorRGBA](colorrgba.md)*

*Defined in [WebglBaseLine.ts:24](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/WebglBaseLine.ts#L24)*

The Color of the line

___

###  intensity

• **intensity**: *number*

*Defined in [WebglBaseLine.ts:7](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/WebglBaseLine.ts#L7)*

___

###  loop

• **loop**: *boolean*

*Defined in [WebglBaseLine.ts:54](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/WebglBaseLine.ts#L54)*

if this is a close loop line or not

**`default`** = false

___

###  numPoints

• **numPoints**: *number*

*Defined in [WebglBaseLine.ts:13](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/WebglBaseLine.ts#L13)*

The number of data point pairs in the line

___

###  offsetX

• **offsetX**: *number*

*Defined in [WebglBaseLine.ts:42](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/WebglBaseLine.ts#L42)*

The horixontal offset of the line

**`default`** = 0

___

###  offsetY

• **offsetY**: *number*

*Defined in [WebglBaseLine.ts:48](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/WebglBaseLine.ts#L48)*

the vertical offset of the line

**`default`** = 0

___

###  scaleX

• **scaleX**: *number*

*Defined in [WebglBaseLine.ts:30](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/WebglBaseLine.ts#L30)*

The horizontal scale of the line

**`default`** = 1

___

###  scaleY

• **scaleY**: *number*

*Defined in [WebglBaseLine.ts:36](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/WebglBaseLine.ts#L36)*

The vertical sclae of the line

**`default`** = 1

___

###  visible

• **visible**: *boolean*

*Defined in [WebglBaseLine.ts:8](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/WebglBaseLine.ts#L8)*

___

###  webglNumPoints

• **webglNumPoints**: *number*

*Defined in [WebglBaseLine.ts:60](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/WebglBaseLine.ts#L60)*

total webgl number of points

**`internal`** 

___

###  xy

• **xy**: *Float32Array*

*Defined in [WebglBaseLine.ts:19](https://github.com/danchitnis/webgl-plot/blob/88a7835/src/WebglBaseLine.ts#L19)*

The data ponits for webgl array

**`internal`**
