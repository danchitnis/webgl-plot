![Npm Build](https://github.com/danchitnis/webgl-plot/workflows/Npm%20Build/badge.svg) ![Yarn Build](https://github.com/danchitnis/webgl-plot/workflows/Yarn%20Build/badge.svg) ![Code scanning](https://github.com/danchitnis/webgl-plot/workflows/Code%20scanning/badge.svg) [![DOI](https://zenodo.org/badge/205590760.svg)](https://zenodo.org/badge/latestdoi/205590760)

## [Live demo 🚀](https://danchitnis.github.io/webgl-plot-examples/vanilla/)

# webgl-plot

multi-line high-performance 2D plotting library using native WebGL. The advantages are:

- Simple and efficient 2D WebGL library
- Using WebGL native line drawing
- High update rate which matches the screen's refresh rate (FPS)
- Works for both dynamic and static data
- supports both thin (native) and thick lines
- Full control over the color of each line in each frame
- No dependencies
- Works on any browsers/platforms that [supports WebGL](https://caniuse.com/#feat=webgl)
- Compatible with [OffScreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) and [WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) for offloading cpu time from the main thread
- Ideal for embedded systems with low resources or large datasets

## Use cases

**Dynamic**: When plotting real-time multiple waveforms are required. For example, software-based oscilloscopes, Arduino, microcontrollers, FPGA user interfaces. This framework also can be used in combination with ElectronJS.

**Static**: Enables rapid pan and zoom capability for inspecting very large datasets. See the [static example](https://danchitnis.github.io/webgl-plot-examples/vanilla/static.html)

## Thick Lines

However notice that due to computation of the line data points, the performance of the thick lines is nearly _6 times slower_ than the normal lines. Only use thick lines when you need to see the lines clearly for example when highlighting a specific line. Further information can be found below. For benchmarking, see the [benchmark](https://github.com/danchitnis/webgl-plot#benchmark) section.

## Version `next` coming soon 🎉

The next version is currently under development. More computation is moved to the GPU, significantly improving performance. These improvements specifically benefit the rolling plot and the scatter plot. However, these changes require a rewrite of the main library and migration to `webgl2`. The current version will remain as no maintenance is needed since it is based on pure javascript. See an example [here](https://codesandbox.io/s/wbglscatteracc-krsvmy).

## Python version now released!! 🥳

See [pyglplot](https://github.com/danchitnis/pyglplot) for the python equivalent of this library. However, please notice the python version is at its early stages.

## Getting started

### Install the library using npm:

```bash
npm install webgl-plot
```

### Create an HTML canvas with an appropriate width or height:

```html
<div>
  <canvas style="width: 100%;" id="my_canvas"></canvas>
</div>
```

### Import the `webgl-plot` library using ES6 modules:

```javascript
import { WebglPlot, WebglLine, ColorRGBA } from "webgl-plot";
```

### Prepare the canvas:

```javascript
const canvas = document.getElementById("my_canvas");
const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;
```

Note: The canvas width and height must be set in order to be able to draw on the canvas.

### Initialization:

```javascript
const numX = canvas.width;
const color = new ColorRGBA(Math.random(), Math.random(), Math.random(), 1);
const line = new WebglLine(color, numX);
const wglp = new WebglPlot(canvas);
```

Automatically arrange X values between [-1,1]:

```javascript
line.arrangeX();
```

Add the line to the webgl canvas:

```javascript
wglp.addLine(line);
```

### Configure the requestAnimationFrame call:

```javascript
function newFrame() {
  update();
  wglp.update();
  requestAnimationFrame(newFrame);
}
requestAnimationFrame(newFrame);
```

### Add the `update` function:

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

Don't forget to update the canvas with `wglp.update()` each time you want to redraw the changes that you have made to the line objects.

[![Edit WebGLplot](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/webglplot-m40u4?fontsize=14&hidenavigation=1&theme=dark)

## Demos

See examples based on vanilla JS at [webgl-plot-examples](https://github.com/danchitnis/webgl-plot-examples)

See examples based on [React](https://webgl-plot-react.vercel.app/)

See [SPAD Simulation](https://danchitnis.github.io/SPADsim/) which use WebGL-Plot as an oscilloscope display

## React Examples

For a basic React example see here:

[![Edit WebGL-Plot React](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/webgl-plot-react-8y1qj?fontsize=14&hidenavigation=1&theme=dark)

React website is under development...

[https://webgl-plot-react.vercel.app/](https://webgl-plot-react.vercel.app/) ⚛

## JS Bundles

To use WebGL-Plot as a JS pre-bundled package first import the following in your HTML file:

```HTML
<script src="https://cdn.jsdelivr.net/gh/danchitnis/webgl-plot@master/dist/webglplot.umd.min.js"></script>
```

See examples on how to use this bundle in [Codepen](https://codepen.io/danchitnis/pen/mdJVEYY) and [JSfiddle](https://jsfiddle.net/danchitnis/mfcw73z2/)

For ES6 module and direct browser import use:

```HTML
<script type="module" src="your-code.js"></script>
```

and in your-code.js:

```javascript
import { WebglPlot, WebglLine, ColorRGBA } from "<http source>";
```

You can use web-based bundlers such as [esm.sh](https://esm.sh/), [unpkng](https://unpkg.com/), [JSdeliver](https://www.jsdelivr.com/?docs=esm) ,and [jspm](https://jspm.org/) to import the library to get the appropriate `http source`. See an example here:
[JSfiddle](https://jsfiddle.net/danchitnis/tu1svwbp/)

Thanks to [TimDaub](https://github.com/TimDaub) for testing the ES6 module.

## Benchmark

[Native Line](https://danchitnis.github.io/webgl-plot/benchmark/bench1.html) and
[Thick Line](https://danchitnis.github.io/webgl-plot/benchmark/bench-thick.html).

See [Benchmark](https://github.com/danchitnis/webgl-plot/blob/webglplot-v2/benchmark/README.md) for more detailed analysis.

## Internal test

[ESM](https://danchitnis.github.io/webgl-plot/test/index-esm.html), [off-screen](https://danchitnis.github.io/webgl-plot/test/index-esm-off.html), [UMD](https://danchitnis.github.io/webgl-plot/test/index-umd.html)

## API Documentation

See [here 📑](https://webgl-plot.now.sh/)

## How to use with embedded systems applications?

You can use WebUSB, Web Bluetooth, and Serial API. You can use [ComPort](https://github.com/danchitnis/ComPort) for a basic implementation of Serial API

## Build

```bash
npm i
npm run build
```

## License

MIT
