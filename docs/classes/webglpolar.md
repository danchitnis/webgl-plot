[webgl-plot](../README.md) / [Exports](../modules.md) / WebglPolar

# Class: WebglPolar

## Hierarchy

- `WebglBaseLine`

  ↳ **`WebglPolar`**

## Table of contents

### Constructors

- [constructor](WebglPolar.md#constructor)

### Properties

- [color](WebglPolar.md#color)
- [intenisty](WebglPolar.md#intenisty)
- [intensity](WebglPolar.md#intensity)
- [loop](WebglPolar.md#loop)
- [numPoints](WebglPolar.md#numpoints)
- [offsetTheta](WebglPolar.md#offsettheta)
- [offsetX](WebglPolar.md#offsetx)
- [offsetY](WebglPolar.md#offsety)
- [scaleX](WebglPolar.md#scalex)
- [scaleY](WebglPolar.md#scaley)
- [visible](WebglPolar.md#visible)
- [webglNumPoints](WebglPolar.md#webglnumpoints)
- [xy](WebglPolar.md#xy)

### Methods

- [getR](WebglPolar.md#getr)
- [getTheta](WebglPolar.md#gettheta)
- [getX](WebglPolar.md#getx)
- [getY](WebglPolar.md#gety)
- [setRtheta](WebglPolar.md#setrtheta)

## Constructors

### constructor

• **new WebglPolar**(`c`, `numPoints`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `c` | [`ColorRGBA`](ColorRGBA.md) |
| `numPoints` | `number` |

#### Overrides

WebglBaseLine.constructor

#### Defined in

[WbglPolar.ts:12](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglPolar.ts#L12)

## Properties

### color

• **color**: [`ColorRGBA`](ColorRGBA.md)

#### Overrides

WebglBaseLine.color

#### Defined in

[WbglPolar.ts:7](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglPolar.ts#L7)

___

### intenisty

• **intenisty**: `number`

#### Defined in

[WbglPolar.ts:8](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglPolar.ts#L8)

___

### intensity

• **intensity**: `number`

#### Inherited from

WebglBaseLine.intensity

#### Defined in

[WebglBaseLine.ts:9](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WebglBaseLine.ts#L9)

___

### loop

• **loop**: `boolean`

if this is a close loop line or not

**`default`** = false

#### Inherited from

WebglBaseLine.loop

#### Defined in

[WebglBaseLine.ts:56](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WebglBaseLine.ts#L56)

___

### numPoints

• **numPoints**: `number`

#### Overrides

WebglBaseLine.numPoints

#### Defined in

[WbglPolar.ts:5](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglPolar.ts#L5)

___

### offsetTheta

• **offsetTheta**: `number`

#### Defined in

[WbglPolar.ts:10](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglPolar.ts#L10)

___

### offsetX

• **offsetX**: `number`

The horizontal offset of the line

**`default`** = 0

#### Inherited from

WebglBaseLine.offsetX

#### Defined in

[WebglBaseLine.ts:44](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WebglBaseLine.ts#L44)

___

### offsetY

• **offsetY**: `number`

the vertical offset of the line

**`default`** = 0

#### Inherited from

WebglBaseLine.offsetY

#### Defined in

[WebglBaseLine.ts:50](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WebglBaseLine.ts#L50)

___

### scaleX

• **scaleX**: `number`

The horizontal scale of the line

**`default`** = 1

#### Inherited from

WebglBaseLine.scaleX

#### Defined in

[WebglBaseLine.ts:32](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WebglBaseLine.ts#L32)

___

### scaleY

• **scaleY**: `number`

The vertical scale of the line

**`default`** = 1

#### Inherited from

WebglBaseLine.scaleY

#### Defined in

[WebglBaseLine.ts:38](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WebglBaseLine.ts#L38)

___

### visible

• **visible**: `boolean`

#### Overrides

WebglBaseLine.visible

#### Defined in

[WbglPolar.ts:9](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglPolar.ts#L9)

___

### webglNumPoints

• **webglNumPoints**: `number`

total webgl number of points

**`internal`**

#### Inherited from

WebglBaseLine.webglNumPoints

#### Defined in

[WebglBaseLine.ts:62](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WebglBaseLine.ts#L62)

___

### xy

• **xy**: `Float32Array`

#### Overrides

WebglBaseLine.xy

#### Defined in

[WbglPolar.ts:6](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglPolar.ts#L6)

## Methods

### getR

▸ **getR**(`index`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `index` | `number` |

#### Returns

`number`

#### Defined in

[WbglPolar.ts:45](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglPolar.ts#L45)

___

### getTheta

▸ **getTheta**(`index`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `index` | `number` |

#### Returns

`number`

#### Defined in

[WbglPolar.ts:40](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglPolar.ts#L40)

___

### getX

▸ **getX**(`index`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `index` | `number` |

#### Returns

`number`

#### Defined in

[WbglPolar.ts:58](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglPolar.ts#L58)

___

### getY

▸ **getY**(`index`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `index` | `number` |

#### Returns

`number`

#### Defined in

[WbglPolar.ts:62](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglPolar.ts#L62)

___

### setRtheta

▸ **setRtheta**(`index`, `theta`, `r`): `void`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | - |
| `theta` | `number` | : angle in deg |
| `r` | `number` | : radius |

#### Returns

`void`

#### Defined in

[WbglPolar.ts:30](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglPolar.ts#L30)
