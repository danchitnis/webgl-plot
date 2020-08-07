---
id: "webglpolar"
title: "WebglPolar"
sidebar_label: "WebglPolar"
---

[webgl-plot](../index.md) › [Globals](../globals.md) › [WebglPolar](webglpolar.md)

## Hierarchy

* [WebglBaseLine](webglbaseline.md)

  ↳ **WebglPolar**

## Index

### Constructors

* [constructor](webglpolar.md#constructor)

### Properties

* [color](webglpolar.md#color)
* [coord](webglpolar.md#coord)
* [intenisty](webglpolar.md#intenisty)
* [intensity](webglpolar.md#intensity)
* [loop](webglpolar.md#loop)
* [numPoints](webglpolar.md#numpoints)
* [offsetTheta](webglpolar.md#offsettheta)
* [offsetX](webglpolar.md#offsetx)
* [offsetY](webglpolar.md#offsety)
* [scaleX](webglpolar.md#scalex)
* [scaleY](webglpolar.md#scaley)
* [visible](webglpolar.md#visible)
* [webglNumPoints](webglpolar.md#webglnumpoints)
* [xy](webglpolar.md#xy)

### Methods

* [getR](webglpolar.md#getr)
* [getTheta](webglpolar.md#gettheta)
* [getX](webglpolar.md#getx)
* [getY](webglpolar.md#gety)
* [setRtheta](webglpolar.md#setrtheta)

## Constructors

###  constructor

\+ **new WebglPolar**(`c`: [ColorRGBA](colorrgba.md), `numPoints`: number): *[WebglPolar](webglpolar.md)*

*Overrides [WebglBaseLine](webglbaseline.md).[constructor](webglbaseline.md#constructor)*

*Defined in [src/WbglPolar.ts:11](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`c` | [ColorRGBA](colorrgba.md) |
`numPoints` | number |

**Returns:** *[WebglPolar](webglpolar.md)*

## Properties

###  color

• **color**: *[ColorRGBA](colorrgba.md)*

*Overrides [WebglBaseLine](webglbaseline.md).[color](webglbaseline.md#color)*

*Defined in [src/WbglPolar.ts:7](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L7)*

___

###  coord

• **coord**: *number*

*Defined in [src/WbglPolar.ts:10](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L10)*

___

###  intenisty

• **intenisty**: *number*

*Defined in [src/WbglPolar.ts:8](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L8)*

___

###  intensity

• **intensity**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[intensity](webglbaseline.md#intensity)*

*Defined in [src/WebglBaseLine.ts:7](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WebglBaseLine.ts#L7)*

___

###  loop

• **loop**: *boolean*

*Inherited from [WebglBaseLine](webglbaseline.md).[loop](webglbaseline.md#loop)*

*Defined in [src/WebglBaseLine.ts:54](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WebglBaseLine.ts#L54)*

if this is a close loop line or not

**`default`** = false

___

###  numPoints

• **numPoints**: *number*

*Overrides [WebglBaseLine](webglbaseline.md).[numPoints](webglbaseline.md#numpoints)*

*Defined in [src/WbglPolar.ts:5](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L5)*

___

###  offsetTheta

• **offsetTheta**: *number*

*Defined in [src/WbglPolar.ts:11](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L11)*

___

###  offsetX

• **offsetX**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[offsetX](webglbaseline.md#offsetx)*

*Defined in [src/WebglBaseLine.ts:42](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WebglBaseLine.ts#L42)*

The horixontal offset of the line

**`default`** = 0

___

###  offsetY

• **offsetY**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[offsetY](webglbaseline.md#offsety)*

*Defined in [src/WebglBaseLine.ts:48](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WebglBaseLine.ts#L48)*

the vertical offset of the line

**`default`** = 0

___

###  scaleX

• **scaleX**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[scaleX](webglbaseline.md#scalex)*

*Defined in [src/WebglBaseLine.ts:30](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WebglBaseLine.ts#L30)*

The horizontal scale of the line

**`default`** = 1

___

###  scaleY

• **scaleY**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[scaleY](webglbaseline.md#scaley)*

*Defined in [src/WebglBaseLine.ts:36](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WebglBaseLine.ts#L36)*

The vertical sclae of the line

**`default`** = 1

___

###  visible

• **visible**: *boolean*

*Overrides [WebglBaseLine](webglbaseline.md).[visible](webglbaseline.md#visible)*

*Defined in [src/WbglPolar.ts:9](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L9)*

___

###  webglNumPoints

• **webglNumPoints**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[webglNumPoints](webglbaseline.md#webglnumpoints)*

*Defined in [src/WebglBaseLine.ts:60](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WebglBaseLine.ts#L60)*

total webgl number of points

**`internal`** 

___

###  xy

• **xy**: *Float32Array*

*Overrides [WebglBaseLine](webglbaseline.md).[xy](webglbaseline.md#xy)*

*Defined in [src/WbglPolar.ts:6](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L6)*

## Methods

###  getR

▸ **getR**(`index`: number): *number*

*Defined in [src/WbglPolar.ts:47](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *number*

___

###  getTheta

▸ **getTheta**(`index`: number): *number*

*Defined in [src/WbglPolar.ts:42](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *number*

___

###  getX

▸ **getX**(`index`: number): *number*

*Defined in [src/WbglPolar.ts:60](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *number*

___

###  getY

▸ **getY**(`index`: number): *number*

*Defined in [src/WbglPolar.ts:64](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *number*

___

###  setRtheta

▸ **setRtheta**(`index`: number, `theta`: number, `r`: number): *void*

*Defined in [src/WbglPolar.ts:32](https://github.com/danchitnis/webgl-plot/blob/65b6867/src/WbglPolar.ts#L32)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`index` | number | - |
`theta` | number | : angle in deg |
`r` | number | : radius  |

**Returns:** *void*
