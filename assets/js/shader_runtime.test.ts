import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { JSDOM } from "jsdom";

import {
  createShaderToyRuntime,
  getShaderRuntimeDebugStats,
  resetShaderRuntimeDebugStats,
} from "./shader/lib/runtime.ts";

function installDom() {
  const dom = new JSDOM("<!doctype html><body></body>", {
    url: "https://regents.sh/shader",
  });
  const { window } = dom;

  Object.defineProperty(globalThis, "window", {
    value: window,
    configurable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: window.document,
    configurable: true,
  });
  Object.defineProperty(globalThis, "ResizeObserver", {
    value: class {
      observe() {}
      disconnect() {}
    },
    configurable: true,
  });

  Object.defineProperty(window, "devicePixelRatio", {
    value: 1,
    configurable: true,
  });
  window.requestAnimationFrame = (() => 1) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = (() => undefined) as typeof window.cancelAnimationFrame;
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    value: window.requestAnimationFrame.bind(window),
    configurable: true,
  });
  Object.defineProperty(globalThis, "cancelAnimationFrame", {
    value: window.cancelAnimationFrame.bind(window),
    configurable: true,
  });
  return dom;
}

function createFakeGl() {
  return {
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4,
    FLOAT: 0x1406,
    TRIANGLES: 0x0004,
    TEXTURE_2D: 0x0de1,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    NEAREST: 0x2600,
    LINEAR: 0x2601,
    REPEAT: 0x2901,
    CLAMP_TO_EDGE: 0x812f,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    TEXTURE0: 0x84c0,
    UNPACK_FLIP_Y_WEBGL: 0x9240,
    createShader() {
      return {};
    },
    shaderSource() {},
    compileShader() {},
    getShaderParameter() {
      return true;
    },
    getShaderInfoLog() {
      return "";
    },
    deleteShader() {},
    createProgram() {
      return {};
    },
    attachShader() {},
    linkProgram() {},
    getProgramParameter() {
      return true;
    },
    getProgramInfoLog() {
      return "";
    },
    deleteProgram() {},
    createBuffer() {
      return {};
    },
    bindBuffer() {},
    bufferData() {},
    getAttribLocation() {
      return 0;
    },
    useProgram() {},
    enableVertexAttribArray() {},
    vertexAttribPointer() {},
    createTexture() {
      return {};
    },
    bindTexture() {},
    texImage2D() {},
    texParameteri() {},
    getUniformLocation() {
      return {};
    },
    uniform3f() {},
    uniform1f() {},
    uniform1i() {},
    uniform4f() {},
    uniform1fv() {},
    uniform3fv() {},
    activeTexture() {},
    drawArrays() {},
    viewport() {},
    pixelStorei() {},
    deleteTexture() {},
    deleteBuffer() {},
    getExtension() {
      return null;
    },
  };
}

function createFakeCanvas(gl: ReturnType<typeof createFakeGl>) {
  const eventHandlers = new Map<string, EventListener>();

  return {
    width: 0,
    height: 0,
    clientWidth: 320,
    clientHeight: 320,
    getContext(type: string) {
      return type === "webgl" ? gl : null;
    },
    getBoundingClientRect() {
      return { width: 320, height: 320 };
    },
    addEventListener(type: string, listener: EventListener) {
      eventHandlers.set(type, listener);
    },
    removeEventListener(type: string) {
      eventHandlers.delete(type);
    },
    toDataURL() {
      return "data:image/png;base64,stub";
    },
  } as unknown as HTMLCanvasElement;
}

describe("shader runtime", () => {
  it("initializes and tears down cleanly", () => {
    const dom = installDom();
    const gl = createFakeGl();
    const canvas = createFakeCanvas(gl);

    resetShaderRuntimeDebugStats();

    const runtime = createShaderToyRuntime(canvas, {
      fragmentSource: `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
      `,
      debugLabel: "test-runtime",
    });

    assert.equal(getShaderRuntimeDebugStats().activeRuntimeCount, 1);
    assert.equal(runtime.captureFrame(), "data:image/png;base64,stub");

    runtime.start();
    runtime.stop();
    runtime.destroy();

    assert.equal(getShaderRuntimeDebugStats().activeRuntimeCount, 0);

    dom.window.close();
  });
});
