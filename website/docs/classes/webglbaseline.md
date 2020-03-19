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

*Defined in [WebglBaseLine.ts:80](https://github.com/danchitnis/webgl-plot/blob/3034d30/src/WebglBaseLine.ts#L80)*

**`internal`** 

**Returns:** *[WebglBaseLine](webglbaseline.md)*

## Properties

###  color

• **color**: *[ColorRGBA](colorrgba.md)*

*Defined in [WebglBaseLine.ts:26](https://github.com/danchitnis/webgl-plot/blob/3034d30/src/WebglBaseLine.ts#L26)*

The Color of the line

___

###  intensity

• **intensity**: *number*

*Defined in [WebglBaseLine.ts:8](https://github.com/danchitnis/webgl-plot/blob/3034d30/src/WebglBaseLine.ts#L8)*

___

###  loop

• **loop**: *boolean*

*Defined in [WebglBaseLine.ts:56](https://github.com/danchitnis/webgl-plot/blob/3034d30/src/WebglBaseLine.ts#L56)*

if this is a close loop line or not

**`default`** = false

___

###  numPoints

• **numPoints**: *number*

*Defined in [WebglBaseLine.ts:15](https://github.com/danchitnis/webgl-plot/blob/3034d30/src/WebglBaseLine.ts#L15)*

The number of data point pairs in the line

___

###  offsetX

• **offsetX**: *number*

*Defined in [WebglBaseLine.ts:44](https://github.com/danchitnis/webgl-plot/blob/3034d30/src/WebglBaseLine.ts#L44)*

The horixontal offset of the line

**`default`** = 0

___

###  offsetY

• **offsetY**: *number*

*Defined in [WebglBaseLine.ts:50](https://github.com/danchitnis/webgl-plot/blob/3034d30/src/WebglBaseLine.ts#L50)*

the vertical offset of the line

**`default`** = 0

___

###  scaleX

• **scaleX**: *number*

*Defined in [WebglBaseLine.ts:32](https://github.com/danchitnis/webgl-plot/blob/3034d30/src/WebglBaseLine.ts#L32)*

The horizontal scale of the line

**`default`** = 1

___

###  scaleY

• **scaleY**: *number*

*Defined in [WebglBaseLine.ts:38](https://github.com/danchitnis/webgl-plot/blob/3034d30/src/WebglBaseLine.ts#L38)*

The vertical sclae of the line

**`default`** = 1

___

###  visible

• **visible**: *boolean*

*Defined in [WebglBaseLine.ts:9](https://github.com/danchitnis/webgl-plot/blob/3034d30/src/WebglBaseLine.ts#L9)*

___

###  webglNumPoints

• **webglNumPoints**: *number*

*Defined in [WebglBaseLine.ts:62](https://github.com/danchitnis/webgl-plot/blob/3034d30/src/WebglBaseLine.ts#L62)*

total webgl number of points

**`internal`** 

___

###  xy

• **xy**: *Float32Array*

*Defined in [WebglBaseLine.ts:21](https://github.com/danchitnis/webgl-plot/blob/3034d30/src/WebglBaseLine.ts#L21)*

The data ponits for webgl array

**`internal`**
