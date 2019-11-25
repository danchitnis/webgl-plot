![Build Action](https://github.com/danchitnis/webgl-plot/workflows/Build/badge.svg "")


# webgl-plot
multi-line high-performance 2D graphs using native WebGL. The advantages are:

 * Simple and efficient 2D WebGL interface
 * Using WebGL native line drawing 
 * Using vec2 instead of vec4 to in the vertex shader to decrease the CPU utilization
 * Full control over the color of each line in each frame
 * Works on any browser/platfrom that [supports WebGL](https://caniuse.com/#feat=webgl) 
 

## What are the use cases?
When plotting real-time multiple waveforms are required. For example, software-based oscilloscopes, Arduino, microcontrollers, FPGA user interfaces. This framework also can be used in combination with ElectronJS.

## Limits
cannot change the line width due to the OpenGL implementation of Line. The OpenGL specification only guarantees a minimum of a single pixel line width. There are other solutions to increase the line width however they substantially increase the size of data vector and take a hit on the performance.

## Getting started
See examples at [webgl-plot-examples](https://github.com/danchitnis/webgl-plot-examples)


## Build
```bash
npm i
npm run build
```

##License
MIT

