[webgl-plot](../README.md) / [Exports](../modules.md) / WebglLine

# Class: WebglLine

The standard Line class

## Hierarchy

- `WebglBaseLine`

  ↳ **`WebglLine`**

## Table of contents

### Constructors

- [constructor](WebglLine.md#constructor)

### Properties

- [color](WebglLine.md#color)
- [intensity](WebglLine.md#intensity)
- [loop](WebglLine.md#loop)
- [numPoints](WebglLine.md#numpoints)
- [offsetX](WebglLine.md#offsetx)
- [offsetY](WebglLine.md#offsety)
- [scaleX](WebglLine.md#scalex)
- [scaleY](WebglLine.md#scaley)
- [visible](WebglLine.md#visible)
- [webglNumPoints](WebglLine.md#webglnumpoints)
- [xy](WebglLine.md#xy)

### Methods

- [addArrayY](WebglLine.md#addarrayy)
- [arrangeX](WebglLine.md#arrangex)
- [constY](WebglLine.md#consty)
- [getX](WebglLine.md#getx)
- [getY](WebglLine.md#gety)
- [lineSpaceX](WebglLine.md#linespacex)
- [replaceArrayY](WebglLine.md#replacearrayy)
- [setX](WebglLine.md#setx)
- [setY](WebglLine.md#sety)
- [shiftAdd](WebglLine.md#shiftadd)

## Constructors

### constructor

• **new WebglLine**(`c`, `numPoints`)

Create a new line

**`example`**
```typescript
x= [0,1]
y= [1,2]
line = new WebglLine( new ColorRGBA(0.1,0.1,0.1,1), 2);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `c` | [`ColorRGBA`](ColorRGBA.md) | the color of the line |
| `numPoints` | `number` | number of data pints |

#### Overrides

WebglBaseLine.constructor

#### Defined in

[WbglLine.ts:21](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglLine.ts#L21)

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

### addArrayY

▸ **addArrayY**(`yArray`): `void`

Add new Y values to the line and maintain the position of the last data point

#### Parameters

| Name | Type |
| :------ | :------ |
| `yArray` | `number`[] |

#### Returns

`void`

#### Defined in

[WbglLine.ts:127](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglLine.ts#L127)

___

### arrangeX

▸ **arrangeX**(): `void`

Automatically generate X between -1 and 1
equal to lineSpaceX(-1, 2/ number of points)

#### Returns

`void`

#### Defined in

[WbglLine.ts:87](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglLine.ts#L87)

___

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

[WbglLine.ts:95](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglLine.ts#L95)

___

### getX

▸ **getX**(`index`): `number`

Get an X value at a specific index

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | the index of X |

#### Returns

`number`

#### Defined in

[WbglLine.ts:52](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglLine.ts#L52)

___

### getY

▸ **getY**(`index`): `number`

Get an Y value at a specific index

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | the index of Y |

#### Returns

`number`

#### Defined in

[WbglLine.ts:60](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglLine.ts#L60)

___

### lineSpaceX

▸ **lineSpaceX**(`start`, `stepSize`): `void`

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
| `stepSize` | `number` | step size between each data point |

#### Returns

`void`

#### Defined in

[WbglLine.ts:76](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglLine.ts#L76)

___

### replaceArrayY

▸ **replaceArrayY**(`yArray`): `void`

Replace the all Y values of the line

#### Parameters

| Name | Type |
| :------ | :------ |
| `yArray` | `number`[] |

#### Returns

`void`

#### Defined in

[WbglLine.ts:139](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglLine.ts#L139)

___

### setX

▸ **setX**(`index`, `x`): `void`

Set the X value at a specific index

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | the index of the data point |
| `x` | `number` | the horizontal value of the data point |

#### Returns

`void`

#### Defined in

[WbglLine.ts:35](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglLine.ts#L35)

___

### setY

▸ **setY**(`index`, `y`): `void`

Set the Y value at a specific index

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | : the index of the data point |
| `y` | `number` | : the vertical value of the data point |

#### Returns

`void`

#### Defined in

[WbglLine.ts:44](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglLine.ts#L44)

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

[WbglLine.ts:112](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/WbglLine.ts#L112)
