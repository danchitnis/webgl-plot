"use strict";
/**
 * Author Danial Chitnis 2019
 */
exports.__esModule = true;
var ndarray = require("ndarray");
var webGLplot_1 = require("./webGLplot");
var noUiSlider = require("nouislider");
var num = 1000;
var vert = ndarray(new Float32Array(num * 2), [num, 2]);
var canv = document.getElementById("my_canvas");
var wglp = new webGLplot_1.webGLplot(canv, vert);
//amplitude
var amp = 1;
for (var i = 0; i < num; i++) {
    //set x to -num/2:1:+num/2
    vert.set(i, 0, 2 * i / num - 1);
}
var phi = 0;
//sliders
var slider1 = document.getElementById('slider1');
;
noUiSlider.create(slider1, {
    start: [0.5],
    connect: [true, false],
    //tooltips: [false, wNumb({decimals: 1}), true],
    range: {
        min: 0.0,
        max: 1
    }
});
slider1.noUiSlider.on("update", function (values, handle) {
    amp = parseFloat(values[handle]);
    document.getElementById("display_amp").innerHTML = amp.toString();
});
setInterval(function () {
    for (var i = 0; i < num; i++) {
        var y = Math.sin(i * Math.PI / 100 + phi) + Math.random() / 10;
        vert.set(i, 1, 0.9 * amp * y);
    }
    phi = phi + 0.01;
    wglp.update();
}, 16.67 * 3);
