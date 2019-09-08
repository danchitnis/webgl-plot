"use strict";
/**
 * Author Danial Chitnis 2019
 */
exports.__esModule = true;
var ndarray = require("ndarray");
var webGLplot_1 = require("./webGLplot");
var webGLplot_2 = require("./webGLplot");
var noUiSlider = require("nouislider");
var num = 1000;
var vert = ndarray(new Float32Array(num * 2), [num, 2]);
var canv = document.getElementById("my_canvas");
var line_color = new webGLplot_2.color_rgba(1, 1, 0, 1);
var wglp = new webGLplot_1.webGLplot(canv, vert, line_color);
//amplitude
var amp = 1;
var freq = 1;
var phi_delta = 1;
for (var i = 0; i < num; i++) {
    //set x to -num/2:1:+num/2
    vert.set(i, 0, 2 * i / num - 1);
}
var phi = 0;
//sliders
var slider_amp = document.getElementById('slider_amp');
var slider_freq = document.getElementById('slider_freq');
var slider_phid = document.getElementById('slider_phid');
noUiSlider.create(slider_amp, {
    start: [0.5],
    connect: [true, false],
    //tooltips: [false, wNumb({decimals: 1}), true],
    range: {
        min: 0.0,
        max: 1
    }
});
noUiSlider.create(slider_freq, {
    start: [0.5],
    connect: [true, false],
    //tooltips: [false, wNumb({decimals: 1}), true],
    range: {
        min: 0.0,
        max: 1
    }
});
noUiSlider.create(slider_phid, {
    start: [0.5],
    connect: [true, false],
    //tooltips: [false, wNumb({decimals: 1}), true],
    range: {
        min: 0.0,
        max: 1
    }
});
slider_amp.noUiSlider.on("update", function (values, handle) {
    amp = parseFloat(values[handle]);
    document.getElementById("display_amp").innerHTML = amp.toString();
});
slider_freq.noUiSlider.on("update", function (values, handle) {
    freq = parseFloat(values[handle]);
    document.getElementById("display_freq").innerHTML = freq.toString();
});
slider_phid.noUiSlider.on("update", function (values, handle) {
    phi_delta = parseFloat(values[handle]);
    document.getElementById("display_phid").innerHTML = phi_delta.toString();
});
setInterval(function () {
    for (var i = 0; i < num; i++) {
        var y = Math.sin(i * freq * Math.PI / 100 + phi) + Math.random() / 10;
        vert.set(i, 1, 0.9 * amp * y);
    }
    phi = phi + phi_delta * 0.1;
    wglp.update();
}, 16.67 * 3);
