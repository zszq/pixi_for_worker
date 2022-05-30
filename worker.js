const listeners = (function () {
  const listeners = [];
  // 存储事件
  const addEventListener = (...args) => {
    listeners.push(args);
  };
  // 删除事件
  const removeEventListener = (...args) => {
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      if (listener[0] === args[0]) {
        listeners.splice(i, 1);
      }
    }
  };

  self.document = {
    createElement(type) {
      if (type === "canvas") {
        return new OffscreenCanvas(0, 0);
      } else {
        console.log("CreateElement called with type = ", type);

        return {
          style: {},
          addEventListener,
          removeEventListener,
        };
      }
    },
    body: {
      appendChild() {},
      addEventListener,
      removeEventListener,
    },
    addEventListener,
    removeEventListener,
  };

  self.window = {
    console: self.console,
    navigator: {},
    document: self.document,
    addEventListener,
    removeEventListener,
    WebGLRenderingContext:
      self.WebGL2RenderingContext || self.WebGLRenderingContext,
    location: {},
  };

  const workerEvent = ["message", "error", "messageerror"];
  // 劫持self.addEventListener
  self.addEventListenerNative = self.addEventListener;
  self.addEventListener = (...args) => {
    if (workerEvent.includes(args[0])) {
      self.addEventListenerNative(...args);
    } else {
      addEventListener(...args);
    }
  };
  // 劫持self.removeEventListener
  self.removeEventListenerNative = self.removeEventListener;
  self.removeEventListener = (...args) => {
    if (workerEvent.includes(args[0])) {
      self.removeEventListenerNative(...args);
    } else {
      removeEventListener(...args);
    }
  };

  // fix error: v6.3.2 line:14698 'if (source instanceof HTMLImageElement) {'
  self.HTMLImageElement = function () {};
  self.HTMLVideoElement = function () {};
  self.HTMLCanvasElement = function () {};

  return listeners;
})();

importScripts("./library/pixi.js");
console.log("PIXI---", PIXI);

importScripts("./library/viewport.min.js");
console.log("viewport---", pixi_viewport);
// importScripts("./library/graphology.js");
// console.log("graphology---", graphology);

let canvas;
const start = (event) => {
  // 处理offscreen对象相关引用
  canvas = event.data.canvas;
  canvas.addEventListener = (...args) => listeners.push(args);
  canvas.removeEventListener = (...args) => {
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      if (listener[0] === args[0]) {
        listeners.splice(i, 1);
      }
    }
  };
  canvas.style = {};
  canvas.parentElement = {};
  canvas.getBoundingClientRect = () => event.data.boundingClientRect; // 重要！修复坐标问题

  // 实例化PIXI
  const app = new PIXI.Application({
    width: 800,
    height: 600,
    view: canvas,
    backgroundColor: 0x1099bb,
    backgroundAlpha: 1,
    antialias: true,
    // resolution: window.devicePixelRatio || 1,
  });

  // 实例化viewport
  const viewport = new pixi_viewport.Viewport({
    screenWidth: 800,
    screenHeight: 600,
    worldWidth: 800,
    worldHeight: 600,
    interaction: app.renderer.plugins.interaction,
    // divWheel: canvas
  });
  app.stage.addChild(viewport);
  viewport.drag().pinch().wheel().decelerate();
  // 测试viewport
  const sprite = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
  sprite.tint = 0xff0000;
  sprite.width = sprite.height = 100;
  sprite.position.set(100, 100);

  // 测试pixi
  const container = new PIXI.Container();
  app.stage.addChild(container);
  // 创建纹理
  imgToTexture("./test.jpg").then((texture) => {
    console.log(texture);
    const sprite = new PIXI.Sprite(texture);
    sprite.width = 50;
    sprite.height = 50;
    sprite.x = app.screen.width / 2;
    sprite.y = app.screen.height / 2;
    sprite.anchor.set(0.5);
    container.addChild(sprite);
  });

  // 绘图
  const graphics = new PIXI.Graphics();
  graphics.beginFill(0xde3249);
  graphics.lineStyle(2, "#ff3300");
  graphics.drawRect(0, 0, 100, 100);
  graphics.endFill();
  container.addChild(graphics);
  // 事件
  container.interactive = true;
  container.interactiveChildren = true;

  container.on("mousemove", (e) => {
    // console.log("mousemove-worker", e);
    // container.x = e.data.global.x;
    // container.y = e.data.global.y;
  });
  container.on("mouseover", (e) => {
    console.log("mouseover-worker", e);
  });
  container.on("mouseout", (e) => {
    console.log("mouseout-worker", e);
  });
  container.on("mousedown", (e) => {
    console.log("mousedown-worker", e);
    graphics.x = e.data.global.x;
    graphics.y = e.data.global.y;
  });
  container.on("mouseup", (e) => {
    console.log("mouseup-worker", e);
    graphics.x = e.data.global.x - 20;
    graphics.y = e.data.global.y - 20;
  });
  container.on("mouseupoutside", (e) => {
    console.log("mouseupoutside-worker", e);
  });
  // mouse -> click
  container.on("click", (e) => {
    console.log("click-worker", e);
  });
  container.on("rightclick", (e) => {
    console.log("rightclick-worker", e);
  });
  container.on("rightdown", (e) => {
    console.log("rightdown-worker", e);
  });
  container.on("rightup", (e) => {
    console.log("rightup-worker", e);
  });
  container.on("rightupoutside", (e) => {
    console.log("rightupoutside-worker", e);
  });

  console.log("listeners", listeners);

  // 监听动画更新
  // app.ticker.add((delta) => {
  //   container.rotation -= 0.01 * delta; // 旋转容器！使用增量创建与帧无关的转换
  // });
};

// 创建纹理
function imgToTexture(imgData) {
  return new Promise(async (resolve, reject) => {
    const res = await fetch(imgData);
    // const arrayBuffer = await res.arrayBuffer();
    // const texture = PIXI.Texture.fromBuffer(new Uint8Array(arrayBuffer), 100, 100); // 点状?
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d", { alpha: true, antialias: true });
    ctx.drawImage(bitmap, 10, 10, bitmap.width, bitmap.height);
    bitmap.close();
    const texture = PIXI.Texture.from(canvas);

    resolve(texture);
  });
}

self.addEventListener("message", (event) => {
  switch (event.data.type) {
    case "start":
      start(event);
      break;
    case "event":
      const fn = listeners.find(([t]) => t === event.data.event.type);
      event.data.event.data.target = canvas;
      event.data.event.data.preventDefault = () => void 0;
      if (fn) {
        fn[1](event.data.event.data);
      }
      break;
  }
});
