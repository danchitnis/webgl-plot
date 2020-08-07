const canvas = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

const numX = canvas.width;

const color = new WebGLPlotBundle.ColorRGBA(Math.random(), Math.random(), Math.random(), 1);

const line = new WebGLPlotBundle.WebglLine(color, numX);

const wglp = new WebGLPlotBundle.default(canvas);

line.lineSpaceX(-1, 2 / numX);
wglp.addLine(line);

function newFrame() {
  update();
  wglp.update();
  requestAnimationFrame(newFrame);
}
requestAnimationFrame(newFrame);

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
