const canv = document.getElementById("my_canvas");

const devicePixelRatio = window.devicePixelRatio || 1;
const numX = Math.round(canv.clientWidth * devicePixelRatio);

const color = new webglplotBundle.ColorRGBA(Math.random(), Math.random(), Math.random(), 1);

const line = new webglplotBundle.WebglLine(color, numX);

console.log(webglplotBundle);

const wglp = new webglplotBundle.default(canv);

line.lineSpaceX(-1, 2 / numX);
wglp.addLine(line);

function newFrame() {
  update();
  wglp.update();
  window.requestAnimationFrame(newFrame);
}
window.requestAnimationFrame(newFrame);

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
