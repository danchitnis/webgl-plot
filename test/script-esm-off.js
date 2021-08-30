const htmlCanvas = document.getElementById("my_canvas");

const offscreen = htmlCanvas.transferControlToOffscreen();

offscreen.width = htmlCanvas.clientWidth * window.devicePixelRatio;
offscreen.height = htmlCanvas.clientHeight * window.devicePixelRatio;

console.log("before calling action");

const worker = new Worker("worker.js", { type: "module" });

console.log(worker);

worker.postMessage({ canvas: offscreen }, [offscreen]);

let i = 0;
let a = 0;

function action() {
  console.log("going to loop");
  for (i = 0; i < 100000000; i++) {
    a = a + Math.sin(i);
  }
  console.log(a);
  console.log("exiting to loop");
}

document.getElementById("btBusy").addEventListener("click", () => {
  const info = document.getElementById("info");

  info.innerHTML =
    "Main thread working...<br>Check the console (F12)<br> Try resizing the window now";
  let a = 0;
  const total = 100000000;

  for (i = 0; i < total; i++) {
    a = a + Math.sin(i);
    if (i % (total / 20) == 0) {
      console.log(((100 * i) / total).toFixed(0) + "%");
    }
  }
  info.innerHTML = "Done!";
});
