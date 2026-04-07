import type { ShaderChannelTexture } from "./types.ts";

const MAX_CHANNELS = 4;
const DEFAULT_DPR_CAP = 1.5;
const RUNTIME_LOG_PREFIX = "[shader-runtime]";
const RUNTIME_DEBUG_LOGS_ENABLED = false;
const GL_VERTEX_SHADER = 0x8b31;
const GL_FRAGMENT_SHADER = 0x8b30;
const ADAPTIVE_DPR_MIN_SCALE = 0.6;
const ADAPTIVE_DPR_SLOW_FRAME_MS = 34;
const ADAPTIVE_DPR_FAST_FRAME_MS = 18;
const ADAPTIVE_DPR_DEGRADE_STREAK = 18;
const ADAPTIVE_DPR_RECOVER_STREAK = 90;

let runtimeSequence = 0;
let activeRuntimeCount = 0;

export interface ShaderRuntimeDebugStats {
  activeRuntimeCount: number;
  runtimeSequence: number;
}

export function getShaderRuntimeDebugStats(): ShaderRuntimeDebugStats {
  return {
    activeRuntimeCount,
    runtimeSequence,
  };
}

export function resetShaderRuntimeDebugStats() {
  activeRuntimeCount = 0;
  runtimeSequence = 0;
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

interface ShaderUniformLocations {
  iResolution: WebGLUniformLocation | null;
  iTime: WebGLUniformLocation | null;
  iTimeDelta: WebGLUniformLocation | null;
  iFrameRate: WebGLUniformLocation | null;
  iFrame: WebGLUniformLocation | null;
  iChannelTime: WebGLUniformLocation | null;
  iChannelResolution: WebGLUniformLocation | null;
  iMouse: WebGLUniformLocation | null;
  iDate: WebGLUniformLocation | null;
  iChannels: Array<WebGLUniformLocation | null>;
}

interface RuntimePointerState {
  x: number;
  y: number;
  clickX: number;
  clickY: number;
  hasClick: boolean;
  isDown: boolean;
}

interface RuntimeChannelState {
  texture: WebGLTexture;
  width: number;
  height: number;
  loadedAtMs: number;
}

export interface ShaderToyRuntimeOptions {
  fragmentSource: string;
  channels?: readonly (ShaderChannelTexture | null | undefined)[];
  devicePixelRatioCap?: number;
  preserveDrawingBuffer?: boolean;
  debugLabel?: string;
  onError?: (message: string) => void;
}

export interface ShaderToyRuntime {
  start: () => void;
  stop: () => void;
  resize: () => void;
  destroy: () => void;
  updateFragmentSource: (fragmentSource: string) => boolean;
  setPointer: (x: number, y: number) => void;
  setPointerDown: (isDown: boolean, x?: number, y?: number) => void;
  renderFrameAt: (elapsedSeconds: number, deltaSeconds?: number) => void;
  captureFrame: (type?: string, quality?: number) => string | null;
}

function buildFragmentShaderSource(source: string) {
  return `
#ifdef GL_ES
precision highp float;
precision highp int;
#endif

uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform float iFrameRate;
uniform int iFrame;
uniform float iChannelTime[4];
uniform vec3 iChannelResolution[4];
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
uniform vec4 iDate;

${source}

void main() {
  vec4 shaderColor = vec4(0.0);
  mainImage(shaderColor, gl_FragCoord.xy);
  gl_FragColor = shaderColor;
}
`;
}

function shaderTypeLabel(type: number) {
  if (type === GL_VERTEX_SHADER) return "vertex";
  if (type === GL_FRAGMENT_SHADER) return "fragment";
  return `type-${type}`;
}

function withLineNumbers(source: string) {
  return source
    .split("\n")
    .map((line, index) => `${String(index + 1).padStart(4, " ")}| ${line}`)
    .join("\n");
}

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
  debugLabel?: string,
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Unable to allocate shader object.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!ok) {
    const info = gl.getShaderInfoLog(shader) ?? "Unknown shader compile error.";
    const label = debugLabel ?? "unknown";
    console.error(
      `${RUNTIME_LOG_PREFIX} compile failed (${label}, ${shaderTypeLabel(type)}): ${info}`,
    );
    console.error(
      `${RUNTIME_LOG_PREFIX} source (${label}, ${shaderTypeLabel(type)}):\n${withLineNumbers(source)}`,
    );
    gl.deleteShader(shader);
    throw new Error(info);
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
  debugLabel?: string,
) {
  let vertexShader: WebGLShader | null = null;
  let fragmentShader: WebGLShader | null = null;
  let program: WebGLProgram | null = null;

  try {
    vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource, debugLabel);
    fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource, debugLabel);

    program = gl.createProgram();
    if (!program) {
      throw new Error("Unable to allocate shader program.");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const ok = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!ok) {
      const info = gl.getProgramInfoLog(program) ?? "Unknown program link error.";
      const label = debugLabel ?? "unknown";
      console.error(`${RUNTIME_LOG_PREFIX} link failed (${label}): ${info}`);
      throw new Error(info);
    }

    return program;
  } catch (error) {
    if (program) {
      gl.deleteProgram(program);
    }
    throw error;
  } finally {
    if (vertexShader) {
      gl.deleteShader(vertexShader);
    }
    if (fragmentShader) {
      gl.deleteShader(fragmentShader);
    }
  }
}

function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0;
}

function applyTextureParameters(
  gl: WebGLRenderingContext,
  config: ShaderChannelTexture | null | undefined,
  width: number,
  height: number,
) {
  const filter = config?.filter ?? "linear";
  const wrap = config?.wrap ?? "clamp";

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    filter === "nearest" ? gl.NEAREST : gl.LINEAR,
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    filter === "nearest" ? gl.NEAREST : gl.LINEAR,
  );

  const canRepeat = wrap === "repeat" && isPowerOfTwo(width) && isPowerOfTwo(height);
  const wrapMode = canRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode);
}

function createDefaultTexture(gl: WebGLRenderingContext) {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("Unable to allocate channel texture.");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 255]),
  );
  applyTextureParameters(gl, null, 1, 1);

  return texture;
}

function clamp(value: number, min: number, max: number) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function logRuntimeInfo(message: string) {
  if (!RUNTIME_DEBUG_LOGS_ENABLED) return;
  console.info(message);
}

function getUniformLocations(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
): ShaderUniformLocations {
  return {
    iResolution: gl.getUniformLocation(program, "iResolution"),
    iTime: gl.getUniformLocation(program, "iTime"),
    iTimeDelta: gl.getUniformLocation(program, "iTimeDelta"),
    iFrameRate: gl.getUniformLocation(program, "iFrameRate"),
    iFrame: gl.getUniformLocation(program, "iFrame"),
    iChannelTime: gl.getUniformLocation(program, "iChannelTime"),
    iChannelResolution: gl.getUniformLocation(program, "iChannelResolution"),
    iMouse: gl.getUniformLocation(program, "iMouse"),
    iDate: gl.getUniformLocation(program, "iDate"),
    iChannels: Array.from({ length: MAX_CHANNELS }, (_, index) =>
      gl.getUniformLocation(program, `iChannel${index}`),
    ),
  };
}

export function createShaderToyRuntime(
  canvas: HTMLCanvasElement,
  options: ShaderToyRuntimeOptions,
): ShaderToyRuntime {
  const runtimeId = ++runtimeSequence;
  const debugLabel = options.debugLabel ?? `runtime-${runtimeId}`;

  const context = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
    failIfMajorPerformanceCaveat: true,
    powerPreference: "high-performance",
  });

  if (!context) {
    throw new Error("WebGL is unavailable in this browser.");
  }
  const glContext: WebGLRenderingContext = context;
  activeRuntimeCount += 1;
  logRuntimeInfo(
    `${RUNTIME_LOG_PREFIX} spawn (${debugLabel}) active=${activeRuntimeCount}`,
  );

  let runtimeSlotReleased = false;
  const releaseRuntimeSlot = (reason: "destroy" | "init-failed") => {
    if (runtimeSlotReleased) return;
    runtimeSlotReleased = true;
    activeRuntimeCount = Math.max(0, activeRuntimeCount - 1);
    logRuntimeInfo(
      `${RUNTIME_LOG_PREFIX} ${reason} (${debugLabel}) active=${activeRuntimeCount}`,
    );
  };

  const configuredChannels = options.channels ?? [];
  let currentFragmentSource = options.fragmentSource;

  const pointer: RuntimePointerState = {
    x: 0,
    y: 0,
    clickX: 0,
    clickY: 0,
    hasClick: false,
    isDown: false,
  };

  let running = false;
  let destroyed = false;
  let contextLost = false;
  let shouldResumeAfterContextRestore = false;
  let contextLostAtMs = 0;
  let frame = 0;
  let animationFrameId = 0;
  let startedAtMs = performance.now();
  let lastFrameAtMs = startedAtMs;
  let cssWidth = 1;
  let cssHeight = 1;
  let dynamicDprScale = 1;
  let slowFrameStreak = 0;
  let fastFrameStreak = 0;

  let program: WebGLProgram | null = null;
  let uniforms: ShaderUniformLocations | null = null;
  let vertexBuffer: WebGLBuffer | null = null;
  const channelStates: RuntimeChannelState[] = [];
  const channelTimeData = new Float32Array(MAX_CHANNELS);
  const channelResolutionData = new Float32Array(MAX_CHANNELS * 3);

  function reportError(message: string) {
    console.error(`${RUNTIME_LOG_PREFIX} ${debugLabel}: ${message}`);
    options.onError?.(message);
  }

  function loadChannelTexture(
    index: number,
    config: ShaderChannelTexture | null | undefined,
  ) {
    if (!config?.src) return;

    const image = new Image();
    image.decoding = "async";
    image.crossOrigin = "anonymous";

    image.onload = () => {
      if (destroyed || contextLost) return;
      const channel = channelStates[index];
      if (!channel) return;
      glContext.bindTexture(glContext.TEXTURE_2D, channel.texture);
      glContext.pixelStorei(glContext.UNPACK_FLIP_Y_WEBGL, 1);
      glContext.texImage2D(
        glContext.TEXTURE_2D,
        0,
        glContext.RGBA,
        glContext.RGBA,
        glContext.UNSIGNED_BYTE,
        image,
      );
      applyTextureParameters(glContext, config, image.width, image.height);
      glContext.pixelStorei(glContext.UNPACK_FLIP_Y_WEBGL, 0);

      channel.width = image.width;
      channel.height = image.height;
      channel.loadedAtMs = performance.now();
    };

    image.onerror = () => {
      reportError(`Failed to load shader channel ${index}: ${config.src}`);
    };

    image.src = config.src;
  }

  function initializeResources(fragmentSource: string) {
    let nextProgram: WebGLProgram | null = null;
    let nextUniforms: ShaderUniformLocations | null = null;
    let nextVertexBuffer: WebGLBuffer | null = null;
    const nextChannelStates: RuntimeChannelState[] = [];
    const fragmentShaderSource = buildFragmentShaderSource(fragmentSource);

    try {
      nextProgram = createProgram(
        glContext,
        VERTEX_SHADER_SOURCE,
        fragmentShaderSource,
        debugLabel,
      );
      nextUniforms = getUniformLocations(glContext, nextProgram);

      nextVertexBuffer = glContext.createBuffer();
      if (!nextVertexBuffer) {
        throw new Error("Unable to allocate vertex buffer.");
      }

      glContext.bindBuffer(glContext.ARRAY_BUFFER, nextVertexBuffer);
      glContext.bufferData(
        glContext.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        glContext.STATIC_DRAW,
      );

      const nextPositionLocation = glContext.getAttribLocation(nextProgram, "aPosition");
      if (nextPositionLocation < 0) {
        throw new Error("Shader program is missing aPosition attribute.");
      }

      glContext.useProgram(nextProgram);
      glContext.enableVertexAttribArray(nextPositionLocation);
      glContext.vertexAttribPointer(
        nextPositionLocation,
        2,
        glContext.FLOAT,
        false,
        0,
        0,
      );

      const nowMs = performance.now();
      for (let index = 0; index < MAX_CHANNELS; index += 1) {
        const texture = createDefaultTexture(glContext);
        nextChannelStates.push({ texture, width: 1, height: 1, loadedAtMs: nowMs });
      }
    } catch (error) {
      if (nextProgram) {
        glContext.deleteProgram(nextProgram);
      }
      if (nextVertexBuffer) {
        glContext.deleteBuffer(nextVertexBuffer);
      }
      for (const channel of nextChannelStates) {
        glContext.deleteTexture(channel.texture);
      }
      throw error;
    }

    for (const channel of channelStates) {
      glContext.deleteTexture(channel.texture);
    }
    if (vertexBuffer) {
      glContext.deleteBuffer(vertexBuffer);
    }
    if (program) {
      glContext.deleteProgram(program);
    }

    program = nextProgram;
    uniforms = nextUniforms;
    vertexBuffer = nextVertexBuffer;
    channelStates.splice(0, channelStates.length, ...nextChannelStates);
    currentFragmentSource = fragmentSource;

    for (let index = 0; index < MAX_CHANNELS; index += 1) {
      loadChannelTexture(index, configuredChannels[index]);
    }
  }

  try {
    initializeResources(currentFragmentSource);
  } catch (error) {
    releaseRuntimeSlot("init-failed");
    const loseContext = glContext.getExtension("WEBGL_lose_context");
    loseContext?.loseContext();
    throw error;
  }

  function resize() {
    if (destroyed || contextLost) return;

    const rect = canvas.getBoundingClientRect();
    cssWidth = Math.max(1, rect.width || canvas.clientWidth || 1);
    cssHeight = Math.max(1, rect.height || canvas.clientHeight || 1);

    const dprCap = options.devicePixelRatioCap ?? DEFAULT_DPR_CAP;
    const baseDpr = clamp(window.devicePixelRatio || 1, 1, dprCap);
    const dpr = clamp(baseDpr * dynamicDprScale, ADAPTIVE_DPR_MIN_SCALE, dprCap);

    const nextWidth = Math.max(1, Math.round(cssWidth * dpr));
    const nextHeight = Math.max(1, Math.round(cssHeight * dpr));

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }

    glContext.viewport(0, 0, canvas.width, canvas.height);
  }

  function updateAdaptiveDpr(deltaSeconds: number) {
    if (deltaSeconds <= 0) return;

    const frameMs = deltaSeconds * 1000;
    if (frameMs >= ADAPTIVE_DPR_SLOW_FRAME_MS) {
      slowFrameStreak += 1;
      fastFrameStreak = 0;
    } else if (frameMs <= ADAPTIVE_DPR_FAST_FRAME_MS) {
      fastFrameStreak += 1;
      slowFrameStreak = Math.max(0, slowFrameStreak - 1);
    } else {
      slowFrameStreak = Math.max(0, slowFrameStreak - 1);
      fastFrameStreak = Math.max(0, fastFrameStreak - 1);
    }

    if (slowFrameStreak >= ADAPTIVE_DPR_DEGRADE_STREAK) {
      const nextScale = Math.max(ADAPTIVE_DPR_MIN_SCALE, dynamicDprScale * 0.9);
      if (nextScale !== dynamicDprScale) {
        dynamicDprScale = nextScale;
        resize();
      }
      slowFrameStreak = 0;
      fastFrameStreak = 0;
      return;
    }

    if (fastFrameStreak >= ADAPTIVE_DPR_RECOVER_STREAK) {
      const nextScale = Math.min(1, dynamicDprScale * 1.05);
      if (nextScale !== dynamicDprScale) {
        dynamicDprScale = nextScale;
        resize();
      }
      slowFrameStreak = 0;
      fastFrameStreak = 0;
    }
  }

  function drawFrame(
    elapsedSeconds: number,
    deltaSeconds: number,
    nowMs: number,
    nowDate: Date,
  ) {
    if (destroyed || contextLost || !program || !uniforms) return;

    resize();

    const frameRate = deltaSeconds > 0 ? 1 / deltaSeconds : 0;
    updateAdaptiveDpr(deltaSeconds);

    const safeCssWidth = Math.max(1, cssWidth);
    const safeCssHeight = Math.max(1, cssHeight);
    const scaleX = canvas.width / safeCssWidth;
    const scaleY = canvas.height / safeCssHeight;

    const pointerX = pointer.x * scaleX;
    const pointerY = canvas.height - pointer.y * scaleY;
    const clickX = pointer.clickX * scaleX;
    const clickY = canvas.height - pointer.clickY * scaleY;

    const mouseZ = pointer.hasClick ? (pointer.isDown ? clickX : -Math.abs(clickX)) : 0;
    const mouseW = pointer.hasClick ? (pointer.isDown ? clickY : -Math.abs(clickY)) : 0;

    const daySeconds =
      nowDate.getHours() * 3600 +
      nowDate.getMinutes() * 60 +
      nowDate.getSeconds() +
      nowDate.getMilliseconds() / 1000;

    const activeUniforms = uniforms;
    glContext.useProgram(program);

    if (activeUniforms.iResolution) {
      glContext.uniform3f(activeUniforms.iResolution, canvas.width, canvas.height, 1);
    }
    if (activeUniforms.iTime) {
      glContext.uniform1f(activeUniforms.iTime, elapsedSeconds);
    }
    if (activeUniforms.iTimeDelta) {
      glContext.uniform1f(activeUniforms.iTimeDelta, deltaSeconds);
    }
    if (activeUniforms.iFrameRate) {
      glContext.uniform1f(activeUniforms.iFrameRate, frameRate);
    }
    if (activeUniforms.iFrame) {
      glContext.uniform1i(activeUniforms.iFrame, frame);
    }
    if (activeUniforms.iMouse) {
      glContext.uniform4f(activeUniforms.iMouse, pointerX, pointerY, mouseZ, mouseW);
    }
    if (activeUniforms.iDate) {
      glContext.uniform4f(
        activeUniforms.iDate,
        nowDate.getFullYear(),
        nowDate.getMonth() + 1,
        nowDate.getDate(),
        daySeconds,
      );
    }

    for (let index = 0; index < MAX_CHANNELS; index += 1) {
      const channel = channelStates[index];
      if (!channel) continue;
      channelTimeData[index] = (nowMs - channel.loadedAtMs) / 1000;
      channelResolutionData[index * 3] = channel.width;
      channelResolutionData[index * 3 + 1] = channel.height;
      channelResolutionData[index * 3 + 2] = 1;

      glContext.activeTexture(glContext.TEXTURE0 + index);
      glContext.bindTexture(glContext.TEXTURE_2D, channel.texture);

      const samplerLocation = activeUniforms.iChannels[index];
      if (samplerLocation !== null) {
        glContext.uniform1i(samplerLocation, index);
      }
    }

    if (activeUniforms.iChannelTime) {
      glContext.uniform1fv(activeUniforms.iChannelTime, channelTimeData);
    }
    if (activeUniforms.iChannelResolution) {
      glContext.uniform3fv(activeUniforms.iChannelResolution, channelResolutionData);
    }

    glContext.drawArrays(glContext.TRIANGLES, 0, 6);

    frame += 1;
    lastFrameAtMs = nowMs;
  }

  function render(nowMs: number) {
    if (!running || destroyed || contextLost || !program || !uniforms) return;

    const elapsedSeconds = (nowMs - startedAtMs) / 1000;
    const deltaSeconds = frame === 0 ? 0 : Math.max(0, (nowMs - lastFrameAtMs) / 1000);
    drawFrame(elapsedSeconds, deltaSeconds, nowMs, new Date());
    animationFrameId = requestAnimationFrame(render);
  }

  const onWindowResize = () => {
    resize();
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    if (destroyed) return;
    contextLost = true;
    shouldResumeAfterContextRestore = running;
    contextLostAtMs = performance.now();
    stop();
    console.warn(`${RUNTIME_LOG_PREFIX} context lost (${debugLabel})`);
  };

  const onContextRestored = () => {
    if (destroyed) return;
    contextLost = false;
    try {
      initializeResources(currentFragmentSource);
      if (contextLostAtMs > 0) {
        const nowMs = performance.now();
        const pausedDuration = Math.max(0, nowMs - contextLostAtMs);
        startedAtMs += pausedDuration;
        lastFrameAtMs = nowMs;
      }
      contextLostAtMs = 0;
      console.info(`${RUNTIME_LOG_PREFIX} context restored (${debugLabel})`);
      if (shouldResumeAfterContextRestore) {
        start();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to rebuild shader runtime.";
      reportError(`WebGL context restore failed: ${message}`);
    }
  };

  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          resize();
        })
      : null;

  resizeObserver?.observe(canvas);
  window.addEventListener("resize", onWindowResize);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  function setPointer(x: number, y: number) {
    pointer.x = clamp(x, 0, cssWidth);
    pointer.y = clamp(y, 0, cssHeight);
  }

  function setPointerDown(isDown: boolean, x?: number, y?: number) {
    if (typeof x === "number" && typeof y === "number") {
      setPointer(x, y);
    }

    if (isDown && !pointer.isDown) {
      pointer.clickX = pointer.x;
      pointer.clickY = pointer.y;
      pointer.hasClick = true;
    }

    pointer.isDown = isDown;
  }

  function updateFragmentSource(fragmentSource: string) {
    if (destroyed || contextLost || !program || !vertexBuffer) return false;
    if (fragmentSource === currentFragmentSource) return true;

    let nextProgram: WebGLProgram | null = null;
    try {
      nextProgram = createProgram(
        glContext,
        VERTEX_SHADER_SOURCE,
        buildFragmentShaderSource(fragmentSource),
        `${debugLabel}:update`,
      );
      const nextPositionLocation = glContext.getAttribLocation(nextProgram, "aPosition");
      if (nextPositionLocation < 0) {
        throw new Error("Shader program is missing aPosition attribute.");
      }

      const nextUniforms = getUniformLocations(glContext, nextProgram);
      const previousProgram = program;

      glContext.useProgram(nextProgram);
      glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer);
      glContext.enableVertexAttribArray(nextPositionLocation);
      glContext.vertexAttribPointer(
        nextPositionLocation,
        2,
        glContext.FLOAT,
        false,
        0,
        0,
      );

      program = nextProgram;
      uniforms = nextUniforms;
      currentFragmentSource = fragmentSource;
      glContext.deleteProgram(previousProgram);
      return true;
    } catch (error) {
      if (nextProgram) {
        glContext.deleteProgram(nextProgram);
      }
      const message = error instanceof Error ? error.message : "Shader update failed.";
      reportError(`Shader update failed: ${message}`);
      return false;
    }
  }

  function start() {
    if (destroyed || running || contextLost || !program || !uniforms) return;
    running = true;
    if (frame === 0) {
      const now = performance.now();
      startedAtMs = now;
      lastFrameAtMs = now;
    }
    animationFrameId = requestAnimationFrame(render);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(animationFrameId);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;

    stop();
    resizeObserver?.disconnect();
    window.removeEventListener("resize", onWindowResize);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);

    for (const channel of channelStates) {
      glContext.deleteTexture(channel.texture);
    }

    if (vertexBuffer) {
      glContext.deleteBuffer(vertexBuffer);
      vertexBuffer = null;
    }
    if (program) {
      glContext.deleteProgram(program);
      program = null;
    }
    uniforms = null;
    releaseRuntimeSlot("destroy");
  }

  function captureFrame(type?: string, quality?: number) {
    if (destroyed) return null;
    try {
      return canvas.toDataURL(type ?? "image/png", quality);
    } catch {
      return null;
    }
  }

  function renderFrameAt(elapsedSeconds: number, deltaSeconds = 0) {
    if (destroyed || contextLost || !program || !uniforms) return;
    stop();
    const nowMs = startedAtMs + Math.max(0, elapsedSeconds) * 1000;
    drawFrame(Math.max(0, elapsedSeconds), Math.max(0, deltaSeconds), nowMs, new Date());
  }

  resize();

  return {
    start,
    stop,
    resize,
    destroy,
    updateFragmentSource,
    setPointer,
    setPointerDown,
    renderFrameAt,
    captureFrame,
  };
}
