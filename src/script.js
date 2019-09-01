"use strict";
exports.__esModule = true;
var ndarray = require("ndarray");
var webGLplot_1 = require("./webGLplot");
var num = 1000;
var vert = ndarray(new Float32Array(num * 2), [num, 2]);
var canv = document.getElementById("my_canvas");
var wglp = new webGLplot_1.webGLplot(canv, vert);
for (var i = 0; i < num; i++) {
    //set x to -num/2:1:+num/2
    vert.set(i, 0, 2 * i / num - 1);
}
var phi = 0;
setInterval(function () {
    for (var i = 0; i < num; i++) {
        var y = Math.sin(i * Math.PI / 100 + phi) + Math.random() / 10;
        vert.set(i, 1, 0.9 * y);
    }
    phi = phi + 0.01;
    wglp.update();
}, 16.667 * 3);
