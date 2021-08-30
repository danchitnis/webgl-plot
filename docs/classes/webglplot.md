[webgl-plot](../README.md) / [Exports](../modules.md) / WebglPlot

# Class: WebglPlot

The main class for the webgl-plot library

## Table of contents

### Constructors

- [constructor](WebglPlot.md#constructor)

### Properties

- [addLine](WebglPlot.md#addline)
- [debug](WebglPlot.md#debug)
- [gLog10X](WebglPlot.md#glog10x)
- [gLog10Y](WebglPlot.md#glog10y)
- [gOffsetX](WebglPlot.md#goffsetx)
- [gOffsetY](WebglPlot.md#goffsety)
- [gScaleX](WebglPlot.md#gscalex)
- [gScaleY](WebglPlot.md#gscaley)
- [gXYratio](WebglPlot.md#gxyratio)

### Accessors

- [linesAux](WebglPlot.md#linesaux)
- [linesData](WebglPlot.md#linesdata)
- [surfaces](WebglPlot.md#surfaces)

### Methods

- [addAuxLine](WebglPlot.md#addauxline)
- [addDataLine](WebglPlot.md#adddataline)
- [addSurface](WebglPlot.md#addsurface)
- [clear](WebglPlot.md#clear)
- [draw](WebglPlot.md#draw)
- [popDataLine](WebglPlot.md#popdataline)
- [removeAllLines](WebglPlot.md#removealllines)
- [removeAuxLines](WebglPlot.md#removeauxlines)
- [removeDataLines](WebglPlot.md#removedatalines)
- [update](WebglPlot.md#update)
- [viewport](WebglPlot.md#viewport)

## Constructors

### constructor

• **new WebglPlot**(`canvas`, `options?`)

Create a webgl-plot instance

**`example`**

For HTMLCanvas
```typescript
const canvas = document.getElementbyId("canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const webglp = new WebGLplot(canvas);
...
```

**`example`**

For OffScreenCanvas
```typescript
const offscreen = htmlCanvas.transferControlToOffscreen();

offscreen.width = htmlCanvas.clientWidth * window.devicePixelRatio;
offscreen.height = htmlCanvas.clientHeight * window.devicePixelRatio;

const worker = new Worker("offScreenCanvas.js", { type: "module" });
worker.postMessage({ canvas: offscreen }, [offscreen]);
```
Then in offScreenCanvas.js
```typescript
onmessage = function (evt) {
const wglp = new WebGLplot(evt.data.canvas);
...
}
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `canvas` | `HTMLCanvasElement` | the canvas in which the plot appears |
| `options?` | `WebglPlotConfig` | - |

#### Defined in

[webglplot.ts:147](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L147)

## Properties

### addLine

• **addLine**: (`line`: [`WebglLine`](WebglLine.md) \| [`WebglStep`](WebglStep.md) \| [`WebglPolar`](WebglPolar.md)) => `void`

#### Type declaration

▸ (`line`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `line` | [`WebglLine`](WebglLine.md) \| [`WebglStep`](WebglStep.md) \| [`WebglPolar`](WebglPolar.md) |

##### Returns

`void`

#### Defined in

[webglplot.ts:333](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L333)

___

### debug

• **debug**: `boolean` = `false`

log debug output

#### Defined in

[webglplot.ts:107](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L107)

___

### gLog10X

• **gLog10X**: `boolean`

Global log10 of x-axis

**`default`** = false

#### Defined in

[webglplot.ts:70](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L70)

___

### gLog10Y

• **gLog10Y**: `boolean`

Global log10 of y-axis

**`default`** = false

#### Defined in

[webglplot.ts:76](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L76)

___

### gOffsetX

• **gOffsetX**: `number`

Global horizontal offset

**`default`** = 0

#### Defined in

[webglplot.ts:58](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L58)

___

### gOffsetY

• **gOffsetY**: `number`

Global vertical offset

**`default`** = 0

#### Defined in

[webglplot.ts:64](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L64)

___

### gScaleX

• **gScaleX**: `number`

Global horizontal scale factor

**`default`** = 1.0

#### Defined in

[webglplot.ts:40](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L40)

___

### gScaleY

• **gScaleY**: `number`

Global vertical scale factor

**`default`** = 1.0

#### Defined in

[webglplot.ts:46](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L46)

___

### gXYratio

• **gXYratio**: `number`

Global X/Y scale ratio

**`default`** = 1

#### Defined in

[webglplot.ts:52](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L52)

## Accessors

### linesAux

• `get` **linesAux**(): `WebglBaseLine`[]

#### Returns

`WebglBaseLine`[]

#### Defined in

[webglplot.ts:94](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L94)

___

### linesData

• `get` **linesData**(): `WebglBaseLine`[]

#### Returns

`WebglBaseLine`[]

#### Defined in

[webglplot.ts:90](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L90)

___

### surfaces

• `get` **surfaces**(): [`WebglSquare`](WebglSquare.md)[]

#### Returns

[`WebglSquare`](WebglSquare.md)[]

#### Defined in

[webglplot.ts:98](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L98)

## Methods

### addAuxLine

▸ **addAuxLine**(`line`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `line` | [`WebglLine`](WebglLine.md) \| [`WebglStep`](WebglStep.md) \| [`WebglPolar`](WebglPolar.md) |

#### Returns

`void`

#### Defined in

[webglplot.ts:335](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L335)

___

### addDataLine

▸ **addDataLine**(`line`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `line` | [`WebglLine`](WebglLine.md) \| [`WebglStep`](WebglStep.md) \| [`WebglPolar`](WebglPolar.md) |

#### Returns

`void`

#### Defined in

[webglplot.ts:328](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L328)

___

### addSurface

▸ **addSurface**(`surface`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `surface` | [`WebglSquare`](WebglSquare.md) |

#### Returns

`void`

#### Defined in

[webglplot.ts:340](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L340)

___

### clear

▸ **clear**(): `void`

Clear the canvas

#### Returns

`void`

#### Defined in

[webglplot.ts:300](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L300)

___

### draw

▸ **draw**(): `void`

Draw without clearing the canvas

#### Returns

`void`

#### Defined in

[webglplot.ts:290](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L290)

___

### popDataLine

▸ **popDataLine**(): `void`

remove the last data line

#### Returns

`void`

#### Defined in

[webglplot.ts:388](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L388)

___

### removeAllLines

▸ **removeAllLines**(): `void`

remove all the lines

#### Returns

`void`

#### Defined in

[webglplot.ts:395](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L395)

___

### removeAuxLines

▸ **removeAuxLines**(): `void`

remove all auxiliary lines

#### Returns

`void`

#### Defined in

[webglplot.ts:410](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L410)

___

### removeDataLines

▸ **removeDataLines**(): `void`

remove all data lines

#### Returns

`void`

#### Defined in

[webglplot.ts:403](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L403)

___

### update

▸ **update**(): `void`

Draw and clear the canvas

#### Returns

`void`

#### Defined in

[webglplot.ts:278](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L278)

___

### viewport

▸ **viewport**(`a`, `b`, `c`, `d`): `void`

Change the WbGL viewport

#### Parameters

| Name | Type |
| :------ | :------ |
| `a` | `number` |
| `b` | `number` |
| `c` | `number` |
| `d` | `number` |

#### Returns

`void`

#### Defined in

[webglplot.ts:421](https://github.com/danchitnis/webgl-plot/blob/8cb7c36/src/webglplot.ts#L421)
