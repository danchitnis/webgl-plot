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
* [prog](webglpolar.md#prog)
* [scaleX](webglpolar.md#scalex)
* [scaleY](webglpolar.md#scaley)
* [vbuffer](webglpolar.md#vbuffer)
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

*Defined in [WbglPolar.ts:13](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L13)*

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

*Defined in [WbglPolar.ts:9](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L9)*

___

###  coord

• **coord**: *number*

*Overrides [WebglBaseLine](webglbaseline.md).[coord](webglbaseline.md#coord)*

*Defined in [WbglPolar.ts:12](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L12)*

___

###  intenisty

• **intenisty**: *number*

*Defined in [WbglPolar.ts:10](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L10)*

___

###  intensity

• **intensity**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[intensity](webglbaseline.md#intensity)*

*Defined in [WebglBaseLine.ts:10](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L10)*

___

###  loop

• **loop**: *boolean*

*Inherited from [WebglBaseLine](webglbaseline.md).[loop](webglbaseline.md#loop)*

*Defined in [WebglBaseLine.ts:23](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L23)*

___

###  numPoints

• **numPoints**: *number*

*Overrides [WebglBaseLine](webglbaseline.md).[numPoints](webglbaseline.md#numpoints)*

*Defined in [WbglPolar.ts:7](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L7)*

___

###  offsetTheta

• **offsetTheta**: *number*

*Defined in [WbglPolar.ts:13](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L13)*

___

###  offsetX

• **offsetX**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[offsetX](webglbaseline.md#offsetx)*

*Defined in [WebglBaseLine.ts:20](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L20)*

___

###  offsetY

• **offsetY**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[offsetY](webglbaseline.md#offsety)*

*Defined in [WebglBaseLine.ts:21](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L21)*

___

###  prog

• **prog**: *WebGLProgram*

*Inherited from [WebglBaseLine](webglbaseline.md).[prog](webglbaseline.md#prog)*

*Defined in [WebglBaseLine.ts:6](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L6)*

___

###  scaleX

• **scaleX**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[scaleX](webglbaseline.md#scalex)*

*Defined in [WebglBaseLine.ts:18](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L18)*

___

###  scaleY

• **scaleY**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[scaleY](webglbaseline.md#scaley)*

*Defined in [WebglBaseLine.ts:19](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L19)*

___

###  vbuffer

• **vbuffer**: *WebGLBuffer*

*Inherited from [WebglBaseLine](webglbaseline.md).[vbuffer](webglbaseline.md#vbuffer)*

*Defined in [WebglBaseLine.ts:5](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L5)*

___

###  visible

• **visible**: *boolean*

*Overrides [WebglBaseLine](webglbaseline.md).[visible](webglbaseline.md#visible)*

*Defined in [WbglPolar.ts:11](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L11)*

___

###  webglNumPoints

• **webglNumPoints**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[webglNumPoints](webglbaseline.md#webglnumpoints)*

*Defined in [WebglBaseLine.ts:8](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L8)*

___

###  xy

• **xy**: *Float32Array*

*Overrides [WebglBaseLine](webglbaseline.md).[xy](webglbaseline.md#xy)*

*Defined in [WbglPolar.ts:8](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L8)*

## Methods

###  getR

▸ **getR**(`index`: number): *number*

*Defined in [WbglPolar.ts:53](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *number*

___

###  getTheta

▸ **getTheta**(`index`: number): *number*

*Defined in [WbglPolar.ts:48](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *number*

___

###  getX

▸ **getX**(`index`: number): *number*

*Defined in [WbglPolar.ts:66](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *number*

___

###  getY

▸ **getY**(`index`: number): *number*

*Defined in [WbglPolar.ts:70](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *number*

___

###  setRtheta

▸ **setRtheta**(`index`: number, `theta`: number, `r`: number): *void*

*Defined in [WbglPolar.ts:38](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglPolar.ts#L38)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`index` | number | - |
`theta` | number | : angle in deg |
`r` | number | : radius  |

**Returns:** *void*
