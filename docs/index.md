---
id: "index"
title: "webgl-plot"
sidebar_label: "README"
---

[webgl-plot](index.md) › [Globals](globals.md)

![Build Action](https://github.com/danchitnis/webgl-plot/workflows/Build/badge.svg)

## [Live demo 🚀](https://danchitnis.github.io/webgl-plot-examples/)

# webgl-plot

multi-line high-performance 2D plotting library using native WebGL. The advantages are:

- Simple and efficient 2D WebGL library
- Using WebGL native line drawing
- High update rate which matches the screen refresh rate
- Full control over the color of each line in each frame
- No dependencies
- Works on any browser/platform that [supports WebGL](https://caniuse.com/#feat=webgl)
- Ideal for embedded systems with low resources

## Use cases

When plotting real-time multiple waveforms are required. For example, software-based oscilloscopes, Arduino, microcontrollers, FPGA user interfaces. This framework also can be used in combination with ElectronJS.

## Limitations

cannot change the line width due to the OpenGL implementation of a line. The OpenGL specification only guarantees a minimum of a single pixel line width. There are other solutions to increase the line width however they substantially increase the size of data vector and take a hit on the performance.

## Getting started

Create an HTML canvas:

```html
<div>
  <canvas class="canvas" id="my_canvas"></canvas>
</div>
```

Import WebGL-Plot library using ES6 modules:

```javascript
import WebGLplot, { WebglLine, ColorRGBA } from "webgl-plot";
```

Initialization:

```javascript
const canv = document.getElementById("my_canvas");
const devicePixelRatio = window.devicePixelRatio || 1;
const numX = Math.round(canv.clientWidth * devicePixelRatio);
const color = new ColorRGBA(Math.random(), Math.random(), Math.random(), 1);
const line = new WebglLine(color, numX);
const wglp = new WebGLplot(canv);
```

Add the line to webgl canvas:

```javascript
line.lineSpaceX(-1, 2 / numX);
wglp.addLine(line);
```

Configure the requestAnimationFrame call:

```javascript
function newFrame() {
  update();
  wglp.update();
  window.requestAnimationFrame(newFrame);
}
window.requestAnimationFrame(newFrame);
```

Add the update function:

```javascript
function update() {
  const freq = 0.001;
  const amp = 0.5;
  const noise = 0.1;

  for (let i = 0; i < line.numPoints; i++) {
    const ySin = Math.sin(Math.PI * i * freq * Math.PI * 2);
    const yNoise = Math.random() - 0.5;
    line.setY(i, ySin * amp + yNoise * noise);
  }
}
```

[![Edit WebGLplot](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/webglplot-m40u4?fontsize=14&hidenavigation=1&theme=dark)

## React Example

React example is under development...

[![Edit WebGL-Plot React](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/webgl-plot-react-8y1qj?fontsize=14&hidenavigation=1&theme=dark)

## Demos

See examples based on vanilla JS at [webgl-plot-examples](https://github.com/danchitnis/webgl-plot-examples)

See examples based on [React](https://webgl-plot.now.sh/example/)

See [SPAD Simulation](https://danchitnis.github.io/SPADsim/) which use WebGL-Plot as an oscilloscope display

## JS Bundle

To use WebGL-Plot as a JS pre-bundled package first import the following in your HTML file:

```HTML
<script src="https://cdn.jsdelivr.net/gh/danchitnis/webgl-plot@master/dist/bundle.min.js"></script>
```

See examples on how to use this bundle in [Codepen](https://codepen.io/danchitnis/pen/mdJVEYY) and [JSfiddle](https://jsfiddle.net/danchitnis/mfcw73z2/)

Notice that this method is only recommended for test and small codes.

## API Documentation

See [here 📑](https://webgl-plot.now.sh/)

## How to use with embedded systems applications?

You can use WebUSB, Web Bluetooth, and Serial API. Examples will be provided soon.

## Build

```bash
npm i
npm run build
```

## License

MIT
