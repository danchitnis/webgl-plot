# Benchmarks

Here benchmarks results are presented for three implementations of the same core OpenGL kernel in Javascript, Python and C++. The kernel is a simple shader that compute lines and updates each data point in every frame. This is to keep the computation time on CPU as low as possible and focus on the OpenGL overhead.

The benchmark is run on a an Nvidia RTX 4090 and Intel i7-13700K. The line width is 2000 data points and the number of lines is increase until the frame rate drops below 60 fps. The maximum number of lines which can be rendered at 60 fps is then reported.

The results are presented in the following table:

| Implementation | Max lines |
| -------------- | --------- |
| Javascript     | 800       |
| Python         | 350       |
| C++            | 3000      |

The results are show that the Javascript and Python implementations are limited by the CPU and not the GPU. This may be to translation overhead of the interpreter or slower memory operations or due to sandboxing in the browser. The C++ implementation compiler using the -O3 flag limited by the GPU takes benefit full CPU cache and memory bandwidth.
