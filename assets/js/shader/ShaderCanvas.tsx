import * as React from "react";

import { createShaderToyRuntime, type ShaderToyRuntime } from "./lib/runtime.ts";
import type { ShaderCatalogEntry } from "./lib/types.ts";
import { classNames } from "./utils.ts";

export interface ShaderCanvasProps {
  shader: ShaderCatalogEntry;
  className?: string;
  paused?: boolean;
  fallbackSrc?: string;
  ariaLabel?: string;
  devicePixelRatioCap?: number;
  onError?: (message: string) => void;
  runtimeMode?: "always" | "when-active";
}

function initialReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ShaderCanvas({
  shader,
  className,
  paused = false,
  fallbackSrc,
  ariaLabel,
  devicePixelRatioCap,
  onError,
  runtimeMode = "always",
}: ShaderCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const runtimeRef = React.useRef<ShaderToyRuntime | null>(null);
  const onErrorRef = React.useRef(onError);
  const fragmentSourceRef = React.useRef(shader.fragmentSource);
  const [runtimeError, setRuntimeError] = React.useState<string | null>(null);
  const [isInViewport, setIsInViewport] = React.useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = React.useState(() => {
    if (typeof document === "undefined") return true;
    return document.visibilityState === "visible";
  });
  const prefersReduced = React.useRef(initialReducedMotion()).current;
  const shouldPause = paused || !isInViewport || !isDocumentVisible;
  const shouldEnableRuntime = !prefersReduced && (runtimeMode === "always" || !paused);

  React.useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  React.useEffect(() => {
    fragmentSourceRef.current = shader.fragmentSource;
  }, [shader.fragmentSource]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0.05 },
    );

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shouldEnableRuntime) {
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
      return;
    }

    try {
      setRuntimeError(null);
      const runtime = createShaderToyRuntime(canvas, {
        fragmentSource: fragmentSourceRef.current,
        channels: shader.channels,
        devicePixelRatioCap,
        debugLabel: `${shader.id}:${shader.title}`,
        onError: (message) => {
          setRuntimeError(message);
          onErrorRef.current?.(message);
        },
      });

      runtimeRef.current = runtime;

      return () => {
        runtime.destroy();
        runtimeRef.current = null;
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Shader runtime failed.";
      setRuntimeError(message);
      onErrorRef.current?.(message);
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
      return;
    }
  }, [
    devicePixelRatioCap,
    shader.channels,
    shader.id,
    shader.title,
    shouldEnableRuntime,
  ]);

  React.useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    if (shouldPause) {
      runtime.stop();
      return;
    }

    runtime.start();
  }, [shouldPause]);

  React.useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || !shouldEnableRuntime) return;
    if (runtime.updateFragmentSource(shader.fragmentSource)) {
      setRuntimeError(null);
    }
  }, [shader.fragmentSource, shouldEnableRuntime]);

  const previewSrc = fallbackSrc ?? shader.previewSrc;
  const showFallback = !shouldEnableRuntime || Boolean(runtimeError);

  function updatePointer(event: React.PointerEvent<HTMLCanvasElement>) {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const rect = event.currentTarget.getBoundingClientRect();
    runtime.setPointer(event.clientX - rect.left, event.clientY - rect.top);
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    updatePointer(event);
    const rect = event.currentTarget.getBoundingClientRect();
    runtime.setPointerDown(true, event.clientX - rect.left, event.clientY - rect.top);
  }

  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    updatePointer(event);
    const rect = event.currentTarget.getBoundingClientRect();
    runtime.setPointerDown(false, event.clientX - rect.left, event.clientY - rect.top);
  }

  return (
    <div className={classNames("relative h-full w-full overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        aria-label={ariaLabel ?? `${shader.title} shader canvas`}
        className={classNames(
          "h-full w-full transition-opacity duration-300",
          showFallback ? "opacity-0" : "opacity-100",
        )}
        style={{ touchAction: "none" }}
        onPointerMove={updatePointer}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={() => runtimeRef.current?.setPointerDown(false)}
      />

      {showFallback ? (
        <img
          src={previewSrc}
          alt={shader.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : null}

      {runtimeError ? (
        <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-xl border border-[color:#9f695d] bg-[color:color-mix(in_oklch,#9f695d_18%,transparent)] px-2 py-1 text-[10px] leading-tight text-[color:var(--foreground)]">
          Shader error: {runtimeError}
        </div>
      ) : null}
    </div>
  );
}
