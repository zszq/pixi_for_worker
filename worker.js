const listeners = (function () {
  const listeners = [];
  // 存储事件
  const addEventListener = (...args) => { listeners.push(args) };
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
          removeEventListener
        };
      }
    },
    body: {
      appendChild() {},
    },
    addEventListener,
    removeEventListener
  };

  self.window = {
    console: self.console,
    navigator: {},
    document: self.document,
    addEventListener,
    removeEventListener,
    WebGLRenderingContext: self.WebGL2RenderingContext || self.WebGLRenderingContext,
    location: {},
  };

  const workerEvent = ['message', 'error', 'messageerror'];
  // 劫持self.addEventListener
  self.addEventListenerNative = self.addEventListener;
  self.addEventListener = (...args) => {
    if (workerEvent.includes(args[0])) {
      self.addEventListenerNative(...args);
    } else {
      addEventListener(...args);
    }
  }
  // 劫持self.removeEventListener
  self.removeEventListenerNative = self.removeEventListener;
  self.removeEventListener = (...args) => {
    if (workerEvent.includes(args[0])) {
      self.removeEventListenerNative(...args);
    } else {
      removeEventListener(...args);
    }
  }

  return listeners;
})();



importScripts("pixi_v6.2.1_worker.js");
console.log("PIXI---", PIXI);

let canvas;
const start = (event) => {
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
  // canvas.getBoundingClientRect = () => event.data.clientRect; // 按键tab事件



  const app = new PIXI.Application({
    width: 800,
    height: 600,
    view: canvas,
    backgroundColor: 0x1099bb,
    backgroundAlpha: 1,
    antialias: true,
    // resolution: window.devicePixelRatio || 1,
  });

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
  
  container.on("mousemove", e => {
    // console.log("mousemove-worker", e);
    // container.x = e.data.global.x;
    // container.y = e.data.global.y;
  })
  container.on("mouseover", e => {
    console.log("mouseover-worker", e);
  })
  container.on("mouseout", e => {
    console.log("mouseout-worker", e);
  })
  container.on("mousedown", e => {
    console.log("mousedown-worker", e);
    graphics.x = e.data.global.x;
    graphics.y = e.data.global.y;
  })
  container.on("mouseup", e => {
    console.log("mouseup-worker", e);
    graphics.x = e.data.global.x - 20;
    graphics.y = e.data.global.y - 20;
  })
  container.on("mouseupoutside", e => {
    console.log("mouseupoutside-worker", e);
  })
  // mouse -> click
  container.on("click", e => {
    console.log("click-worker", e);
  })
  container.on("rightclick", e => {
    console.log("rightclick-worker", e);
  })
  container.on("rightdown", e => {
    console.log("rightdown-worker", e);
  })
  container.on("rightup", e => {
    console.log("rightup-worker", e);
  })
  container.on("rightupoutside", e => {
    console.log("rightupoutside-worker", e);
  })

  console.log('listeners', listeners);

  // 监听动画更新
  // app.ticker.add((delta) => {
  //   container.rotation -= 0.01 * delta; // 旋转容器！使用增量创建与帧无关的转换
  // });
}

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
