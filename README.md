![Build Action](https://github.com/danchitnis/webgl-plot/workflows/Build/badge.svg "")


# webgl-plot
multi-line high-performance 2D graphs using native WebGL. The advantages are:

 * Simple and efficient 2D WebGL interface
 * Using WebGL native line drawing 
 * Using vec2 instead of vec4 to in the vertex shader to decrease the CPU utilization
 * Full control over the color of each line in each frame
 
What are the use cases?
----
When plotting real-time multiple waveforms are required. For example, software-based oscilloscopes, Arduino, microcontrollers, FPGA user interfaces. This framework also can be used in combination with ElectronJS.


### Build
```sh
$ npm run build
```



License
----
MIT

