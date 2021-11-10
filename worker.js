self.document = {
  createElement(type) {
    if (type === "canvas") {
      return new OffscreenCanvas(0, 0);
    } else {
      console.log("CreateElement called with type = ", type);
      return {
        style: {},
      };
    }
  },
  addEventListener() {},
};

self.window = {
  console: self.console,
  navigator: {},
  document: self.document,
  WebGLRenderingContext: {},
  addEventListener() {},
  removeEventListener: function () {},
};


importScripts("pixi_v6.2.0_worker.js");
console.log("PIXI---", PIXI);

self.addEventListener("message", (event) => {
  console.log("worker message event", event.data);
  const { canvas } = event.data;
  canvas.style = {};

  const app = new PIXI.Application({
    width: 800,
    height: 600,
    view: event.data.canvas,
    backgroundColor: 0x1099bb,
    backgroundpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
  });

  const container = new PIXI.Container();
  app.stage.addChild(container);
  // 将容器移到中心
  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;

  // container.interactive = true; // 无效 document
  // container.on("click", (event) => {
  //   console.log("click事件", event);
  // });

  // 创建兔子精灵
  imgToTexture("./test.jpg").then((texture) => {
    console.log(texture);
    const bunny = new PIXI.Sprite(texture);
    bunny.width = 50;
    bunny.height = 50;
    bunny.anchor.set(0.5);
    container.addChild(bunny);
  });
  // 将兔子精灵移动到本地容器坐标的中心
  container.pivot.x = container.width / 2;
  container.pivot.y = container.height / 2;

  // Rectangle
  const graphics = new PIXI.Graphics();
  graphics.beginFill(0xde3249);
  graphics.lineStyle(2, "#ff3300");
  graphics.drawRect(0, 0, 100, 100);
  graphics.moveTo(5, 5);
  graphics.lineTo(200, 200);
  graphics.endFill();
  container.addChild(graphics);

  // 监听动画更新
  app.ticker.add((delta) => {
    // 旋转容器！使用增量创建与帧无关的转换
    container.rotation -= 0.01 * delta;
  });
});

// 创建纹理
async function imgToTexture(imgData) {
  const res = await fetch(imgData);
  // const buffer = await res.arrayBuffer();
  // const buffer = await blob.arrayBuffer();
  // const texture = PIXI.Texture.fromBuffer(buffer, 100, 100); // 无效? Float32Array | Uint8Array ?
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d", { alpha: true, antialias: true });
  ctx.drawImage(bitmap, 10, 10, bitmap.width, bitmap.height);
  bitmap.close();
  const texture = PIXI.Texture.from(canvas);

  return new Promise((resolve, reject) => {
    resolve(texture);
  });
}
