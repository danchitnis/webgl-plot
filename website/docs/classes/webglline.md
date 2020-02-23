---
id: "webglline"
title: "WebglLine"
sidebar_label: "WebglLine"
---

[webgl-plot](../index.md) › [Globals](../globals.md) › [WebglLine](webglline.md)

## Hierarchy

* [WebglBaseLine](webglbaseline.md)

  ↳ **WebglLine**

## Index

### Constructors

* [constructor](webglline.md#constructor)

### Properties

* [color](webglline.md#color)
* [coord](webglline.md#coord)
* [intensity](webglline.md#intensity)
* [loop](webglline.md#loop)
* [numPoints](webglline.md#numpoints)
* [offsetX](webglline.md#offsetx)
* [offsetY](webglline.md#offsety)
* [prog](webglline.md#prog)
* [scaleX](webglline.md#scalex)
* [scaleY](webglline.md#scaley)
* [vbuffer](webglline.md#vbuffer)
* [visible](webglline.md#visible)
* [webglNumPoints](webglline.md#webglnumpoints)
* [xy](webglline.md#xy)

### Methods

* [constY](webglline.md#consty)
* [getX](webglline.md#getx)
* [getY](webglline.md#gety)
* [linespaceX](webglline.md#linespacex)
* [setX](webglline.md#setx)
* [setY](webglline.md#sety)
* [shiftAdd](webglline.md#shiftadd)

## Constructors

###  constructor

\+ **new WebglLine**(`c`: [ColorRGBA](colorrgba.md), `numPoints`: number): *[WebglLine](webglline.md)*

*Overrides [WebglBaseLine](webglbaseline.md).[constructor](webglbaseline.md#constructor)*

*Defined in [WbglLine.ts:5](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglLine.ts#L5)*

Create a new line

**`example`** 
```typescript
x= [0,1]
y= [1,2]
line = new WebglLine( new ColorRGBA(0.1,0.1,0.1,1), 2);
```

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`c` | [ColorRGBA](colorrgba.md) | :the color of the line |
`numPoints` | number | : number of data pints |

**Returns:** *[WebglLine](webglline.md)*

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

*Defined in [WbglLine.ts:73](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglLine.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`c` | number |

**Returns:** *void*

___

###  getX

▸ **getX**(`index`: number): *number*

*Defined in [WbglLine.ts:58](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglLine.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *number*

___

###  getY

▸ **getY**(`index`: number): *number*

*Defined in [WbglLine.ts:62](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglLine.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`index` | number |

**Returns:** *number*

___

###  linespaceX

▸ **linespaceX**(`start`: number, `stepsize`: number): *void*

*Defined in [WbglLine.ts:66](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglLine.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`start` | number |
`stepsize` | number |

**Returns:** *void*

___

###  setX

▸ **setX**(`index`: number, `x`: number): *void*

*Defined in [WbglLine.ts:45](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglLine.ts#L45)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`index` | number | : the index of the data point |
`x` | number | : the horizontal value of the data point  |

**Returns:** *void*

___

###  setY

▸ **setY**(`index`: number, `y`: number): *void*

*Defined in [WbglLine.ts:54](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglLine.ts#L54)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`index` | number | : the index of the data point |
`y` | number | : the vertical value of the data point  |

**Returns:** *void*

___

###  shiftAdd

▸ **shiftAdd**(`data`: Float32Array): *void*

*Defined in [WbglLine.ts:80](https://github.com/danchitnis/webgl-plot/blob/4f87755/src/WbglLine.ts#L80)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | Float32Array |

**Returns:** *void*
