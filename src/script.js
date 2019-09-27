"use strict";
/**
 * Author Danial Chitnis 2019
 */
exports.__esModule = true;
var ndarray = require("ndarray");
var webGLplot_1 = require("./webGLplot");
var webGLplot_2 = require("./webGLplot");
var webGLplot_3 = require("./webGLplot");
var noUiSlider = require("nouislider");
var Stats = require("stats.js");
var canv = document.getElementById("my_canvas");
var devicePixelRatio = window.devicePixelRatio || 1;
var num = Math.round(canv.clientWidth * devicePixelRatio);
//let num=1000;
var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
var line_num = 100;
var yscale = 1;
var line_colors;
var lines;
var wglp;
var fps_divder = 1;
var fps_counter = 0;
var line_num_list = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
//sliders
var slider_lines = document.getElementById('slider_lines');
var slider_yscale = document.getElementById('slider_yscale');
var slider_new_data = document.getElementById('slider_new_data');
var slider_fps = document.getElementById('slider_fps');
noUiSlider.create(slider_lines, {
    start: [0],
    step: 1,
    connect: [true, false],
    //tooltips: [false, wNumb({decimals: 1}), true],
    range: {
        min: 0,
        max: 11
    }
});
noUiSlider.create(slider_yscale, {
    start: [1],
    connect: [true, false],
    //tooltips: [false, wNumb({decimals: 1}), true],
    range: {
        min: 0.01,
        max: 10
    }
});
noUiSlider.create(slider_new_data, {
    start: [1],
    step: 1,
    connect: [true, false],
    //tooltips: [false, wNumb({decimals: 1}), true],
    range: {
        min: 0,
        max: 1000
    }
});
noUiSlider.create(slider_fps, {
    start: [1],
    step: 1,
    connect: [true, false],
    //tooltips: [false, wNumb({decimals: 1}), true],
    range: {
        min: 1,
        max: 10
    }
});
slider_lines.noUiSlider.on("update", function (values, handle) {
    line_num = line_num_list[parseFloat(values[handle])];
    document.getElementById("display_lines").innerHTML = line_num.toString();
});
slider_lines.noUiSlider.on("set", function (values, handle) {
    init();
});
slider_yscale.noUiSlider.on("update", function (values, handle) {
    yscale = parseFloat(values[handle]);
    document.getElementById("display_yscale").innerHTML = yscale.toString();
});
slider_new_data.noUiSlider.on("update", function (values, handle) {
    //freq = parseFloat(values[handle]);
    //(<HTMLParagraphElement>document.getElementById("display_new_data_size")).innerHTML = freq.toString();
});
slider_fps.noUiSlider.on("update", function (values, handle) {
    fps_divder = parseFloat(values[handle]);
    document.getElementById("display_fps").innerHTML = (60 / fps_divder).toString();
});
var resizeId;
window.addEventListener('resize', function () {
    clearTimeout(resizeId);
    resizeId = setTimeout(doneResizing, 500);
});
init();
function new_frame() {
    stats.begin();
    if (fps_counter == 0) {
        random_walk();
        wglp.scaleY = yscale;
        wglp.update();
    }
    fps_counter++;
    if (fps_counter >= fps_divder) {
        fps_counter = 0;
    }
    stats.end();
    window.requestAnimationFrame(new_frame);
}
window.requestAnimationFrame(new_frame);
function random_walk() {
    var _loop_1 = function (i) {
        lines.forEach(function (line) {
            line.xy.set(i, 1, line.xy.get(i + 1, 1));
        });
    };
    for (var i = 0; i < num - 1; i++) {
        _loop_1(i);
    }
    lines.forEach(function (line) {
        var y = line.xy.get(num - 1, 1) + 0.01 * (Math.round(Math.random()) - 0.5);
        line.xy.set(num - 1, 1, y);
    });
}
function init() {
    line_colors = [];
    lines = [];
    for (var i = 0; i < line_num; i++) {
        line_colors.push(new webGLplot_2.color_rgba(Math.random(), Math.random(), Math.random(), 0.5));
        lines.push(new webGLplot_3.lineGroup(line_colors[i]));
    }
    lines.forEach(function (line) {
        line.xy = ndarray(new Float32Array(num * 2), [num, 2]);
    });
    wglp = new webGLplot_1.webGLplot(canv, lines);
    console.log(num);
    var _loop_2 = function (i) {
        //set x to -num/2:1:+num/2
        lines.forEach(function (line) {
            line.xy.set(i, 0, 2 * i / num - 1);
            line.xy.set(i, 1, 0);
        });
    };
    for (var i = 0; i < num; i++) {
        _loop_2(i);
    }
}
function doneResizing() {
    wglp.viewport(0, 0, canv.width, canv.height);
    console.log(window.innerWidth);
}
