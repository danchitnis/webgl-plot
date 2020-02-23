---
id: "webglstep"
title: "WebglStep"
sidebar_label: "WebglStep"
---

[webgl-plot](../index.md) › [Globals](../globals.md) › [WebglStep](webglstep.md)

## Hierarchy

* [WebglBaseLine](webglbaseline.md)

  ↳ **WebglStep**

## Index

### Constructors

* [constructor](webglstep.md#constructor)

### Properties

* [color](webglstep.md#color)
* [coord](webglstep.md#coord)
* [intensity](webglstep.md#intensity)
* [loop](webglstep.md#loop)
* [numPoints](webglstep.md#numpoints)
* [offsetX](webglstep.md#offsetx)
* [offsetY](webglstep.md#offsety)
* [prog](webglstep.md#prog)
* [scaleX](webglstep.md#scalex)
* [scaleY](webglstep.md#scaley)
* [vbuffer](webglstep.md#vbuffer)
* [visible](webglstep.md#visible)
* [webglNumPoints](webglstep.md#webglnumpoints)
* [xy](webglstep.md#xy)

### Methods

* [constY](webglstep.md#consty)
* [getX](webglstep.md#getx)
* [getY](webglstep.md#gety)
* [linespaceX](webglstep.md#linespacex)
* [setY](webglstep.md#sety)
* [shiftAdd](webglstep.md#shiftadd)

## Constructors

###  constructor

\+ **new WebglStep**(`c`: [ColorRGBA](colorrgba.md), `num`: number): *[WebglStep](webglstep.md)*

*Overrides [WebglBaseLine](webglbaseline.md).[constructor](webglbaseline.md#constructor)*

*Defined in [WbglStep.ts:5](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglStep.ts#L5)*

**Parameters:**

Name | Type |
------ | ------ |
`c` | [ColorRGBA](colorrgba.md) |
`num` | number |

**Returns:** *[WebglStep](webglstep.md)*

## Properties

###  color

• **color**: *[ColorRGBA](colorrgba.md)*

*Inherited from [WebglBaseLine](webglbaseline.md).[color](webglbaseline.md#color)*

*Defined in [WebglBaseLine.ts:16](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L16)*

___

###  coord

• **coord**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[coord](webglbaseline.md#coord)*

*Defined in [WebglBaseLine.ts:12](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L12)*

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

*Inherited from [WebglBaseLine](webglbaseline.md).[numPoints](webglbaseline.md#numpoints)*

*Defined in [WebglBaseLine.ts:14](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L14)*

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

*Inherited from [WebglBaseLine](webglbaseline.md).[visible](webglbaseline.md#visible)*

*Defined in [WebglBaseLine.ts:11](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L11)*

___

###  webglNumPoints

• **webglNumPoints**: *number*

*Inherited from [WebglBaseLine](webglbaseline.md).[webglNumPoints](webglbaseline.md#webglnumpoints)*

*Defined in [WebglBaseLine.ts:8](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L8)*

___

###  xy

• **xy**: *Float32Array*

*Inherited from [WebglBaseLine](webglbaseline.md).[xy](webglbaseline.md#xy)*

*Defined in [WebglBaseLine.ts:15](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WebglBaseLine.ts#L15)*

## Methods

###  constY

▸ **constY**(`c`: number): *void*

*Defined in [WbglStep.ts:45](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglStep.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`c` | number |

**Returns:** *void*

___

###  getX

▸ **getX**(`index`: number): *number*

*Defined in [WbglStep.ts:29](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglStep.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *number*

___

###  getY

▸ **getY**(`index`: number): *number*

*Defined in [WbglStep.ts:33](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglStep.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *number*

___

###  linespaceX

▸ **linespaceX**(`start`: number, `stepsize`: number): *void*

*Defined in [WbglStep.ts:37](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglStep.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`start` | number |
`stepsize` | number |

**Returns:** *void*

___

###  setY

▸ **setY**(`index`: number, `y`: number): *void*

*Defined in [WbglStep.ts:24](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglStep.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |
`y` | number |

**Returns:** *void*

___

###  shiftAdd

▸ **shiftAdd**(`data`: Float32Array): *void*

*Defined in [WbglStep.ts:52](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglStep.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Float32Array |

**Returns:** *void*
