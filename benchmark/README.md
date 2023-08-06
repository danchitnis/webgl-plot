# Benchmarks

Here benchmarks results are presented for three implementations of the same core OpenGL kernel in Javascript ([webgl-plot](https://github.com/danchitnis/webgl-plot)), Python ([pyglplot](https://github.com/danchitnis/pyglplot)) and C++ ([cpp-plot](https://github.com/danchitnis/cpp-plot)). The kernel is a simple shader that compute lines and updates each data point in every frame. This is to keep the computation time on CPU as low as possible and focus on the OpenGL overhead.

The benchmark is run on a an Nvidia RTX 4090 and Intel i7-13700K. The results are presented in the following tables:

## Line

The line width is 2000 data points and the number of lines is increase until the frame rate drops below 60 fps. The maximum number of lines which can be rendered at 60 fps is then reported.

| Implementation | Max lines | Max GPU Util | Update rate | Code                                                                                         |
| -------------- | --------- | ------------ | ----------- | -------------------------------------------------------------------------------------------- |
| Javascript     | 800       | 20%          | 96 Mpts/s   | [webgl-plot](https://github.com/danchitnis/webgl-plot/blob/webglplot-v2/benchmark/bench2.js) |
| Python         | 350       | 65%          | 42 Mpts/s   | [pyglplot](https://github.com/danchitnis/pyglplot/blob/main/test/benchmark.py)               |
| C++            | 3000      | 60%          | 360 Mpts/s  | [cpp-plot](https://github.com/danchitnis/cpp-plot/blob/main/src/line.cpp)                    |

## Line Roll

| Implementation | Max lines | Max buffer | Max GPU Util | Code                                                                                         |
| -------------- | --------- | ---------- | ------------ | -------------------------------------------------------------------------------------------- |
| Javascript     | 7.5k      | 2k         | 65%          | [webgl-plot](https://github.com/danchitnis/webgl-plot/blob/webglplot-v2/benchmark/bench2.js) |
| Javascript     | 2.5k      | 10k        | 65%          | [webgl-plot](https://github.com/danchitnis/webgl-plot/blob/webglplot-v2/benchmark/bench2.js) |
| Javascript     | 0.2k      | 100k       | 65%          | [webgl-plot](https://github.com/danchitnis/webgl-plot/blob/webglplot-v2/benchmark/bench2.js) |
| Python         | 1.5k      | 2k         | 12%          | [pyglplot](https://github.com/danchitnis/pyglplot/blob/main/test/testRoll.py)                |
| Python         | 1k        | 10k        | 25%          | [pyglplot](https://github.com/danchitnis/pyglplot/blob/main/test/testRoll.py)                |
| Python         | 0.3k      | 100k       | 40%          | [pyglplot](https://github.com/danchitnis/pyglplot/blob/main/test/testRoll.py)                |
| C++            | 40k       | 2k         | 95%          | [cpp-plot](https://github.com/danchitnis/cpp-plot/blob/main/src/roll.cpp)                    |
| C++            | 15k       | 10k        | 95%          | [cpp-plot](https://github.com/danchitnis/cpp-plot/blob/main/src/roll.cpp)                    |
| C++            | 1.5k      | 100k       | 95%          | [cpp-plot](https://github.com/danchitnis/cpp-plot/blob/main/src/roll.cpp)                    |

## Scatter Plot

| Implementation | Max Square | Max GPU Util | Code                                                                                         |
| -------------- | ---------- | ------------ | -------------------------------------------------------------------------------------------- |
| Javascript     | 6M         | 30%          | [webgl-plot](https://github.com/danchitnis/webgl-plot/blob/webglplot-v2/benchmark/bench2.js) |
| Python         | -          | -            | [pyglplot]()                                                                                 |
| C++            | 30M        | 98%          | [cpp-plot](https://github.com/danchitnis/cpp-plot/blob/main/src/scatter.cpp)                 |

The results are show that the Javascript and Python implementations are limited by the CPU and not the GPU. This may be to translation overhead of the interpreter or slower memory operations or due to sandboxing in the browser. The C++ implementation compiler using the -O3 flag limited by the GPU takes benefit full CPU cache and memory bandwidth.

More benchmarks are to follow ⚡
