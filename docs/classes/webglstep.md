[webgl-plot](../README.md) / [Exports](../modules.md) / WebglStep

# Class: WebglStep

The step based line plot

## Hierarchy

- `WebglBaseLine`

  ↳ **`WebglStep`**

## Table of contents

### Constructors

- [constructor](WebglStep.md#constructor)

### Properties

- [color](WebglStep.md#color)
- [intensity](WebglStep.md#intensity)
- [loop](WebglStep.md#loop)
- [numPoints](WebglStep.md#numpoints)
- [offsetX](WebglStep.md#offsetx)
- [offsetY](WebglStep.md#offsety)
- [scaleX](WebglStep.md#scalex)
- [scaleY](WebglStep.md#scaley)
- [visible](WebglStep.md#visible)
- [webglNumPoints](WebglStep.md#webglnumpoints)
- [xy](WebglStep.md#xy)

### Methods

- [constY](WebglStep.md#consty)
- [getX](WebglStep.md#getx)
- [getY](WebglStep.md#gety)
- [lineSpaceX](WebglStep.md#linespacex)
- [setY](WebglStep.md#sety)
- [shiftAdd](WebglStep.md#shiftadd)

## Constructors

### constructor

• **new WebglStep**(`c`, `num`)

Create a new step line

**`example`**
```typescript
x= [0,1]
y= [1,2]
line = new WebglStep( new ColorRGBA(0.1,0.1,0.1,1), 2);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `c` | [`ColorRGBA`](ColorRGBA.md) | the color of the line |
| `num` | `number` | - |

#### Overrides

WebglBaseLine.constructor

#### Defined in

[WbglStep.ts:19](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglStep.ts#L19)

## Properties

### color

• **color**: [`ColorRGBA`](ColorRGBA.md)

The Color of the line

#### Inherited from

WebglBaseLine.color

#### Defined in

[WebglBaseLine.ts:26](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WebglBaseLine.ts#L26)

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

The number of data point pairs in the line

#### Inherited from

WebglBaseLine.numPoints

#### Defined in

[WebglBaseLine.ts:15](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WebglBaseLine.ts#L15)

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

#### Inherited from

WebglBaseLine.visible

#### Defined in

[WebglBaseLine.ts:10](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WebglBaseLine.ts#L10)

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

The data ponits for webgl array

**`internal`**

#### Inherited from

WebglBaseLine.xy

#### Defined in

[WebglBaseLine.ts:21](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WebglBaseLine.ts#L21)

## Methods

### constY

▸ **constY**(`c`): `void`

Set a constant value for all Y values in the line

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `c` | `number` | constant value |

#### Returns

`void`

#### Defined in

[WbglStep.ts:74](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglStep.ts#L74)

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

[WbglStep.ts:38](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglStep.ts#L38)

___

### getY

▸ **getY**(`index`): `number`

Get an X value at a specific index

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | the index of X |

#### Returns

`number`

#### Defined in

[WbglStep.ts:46](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglStep.ts#L46)

___

### lineSpaceX

▸ **lineSpaceX**(`start`, `stepsize`): `void`

Make an equally spaced array of X points

**`example`**
```typescript
//x = [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8]
const numX = 10;
line.lineSpaceX(-1, 2 / numX);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `start` | `number` | the start of the series |
| `stepsize` | `number` | - |

#### Returns

`void`

#### Defined in

[WbglStep.ts:62](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglStep.ts#L62)

___

### setY

▸ **setY**(`index`, `y`): `void`

Set the Y value at a specific index

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | the index of the data point |
| `y` | `number` | the vertical value of the data point |

#### Returns

`void`

#### Defined in

[WbglStep.ts:33](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglStep.ts#L33)

___

### shiftAdd

▸ **shiftAdd**(`data`): `void`

Add a new Y values to the end of current array and shift it, so that the total number of the pair remains the same

**`example`**
```typescript
yArray = new Float32Array([3, 4, 5]);
line.shiftAdd(yArray);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `Float32Array` | the Y array |

#### Returns

`void`

#### Defined in

[WbglStep.ts:91](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglStep.ts#L91)
