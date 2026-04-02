import { animate } from "animejs";

export const COLOR_MODE_STORAGE_KEY = "pp-color-mode";
export const COLOR_MODE_CHANGE_EVENT = "pp:color-mode-change";
export const COLOR_MODE_TOGGLE_EVENT = "pp:color-mode-toggle";

export type ColorMode = "light" | "dark";

type MatchMediaLike = {
  matches: boolean;
  addEventListener?: (type: "change", listener: (event: { matches: boolean }) => void) => void;
  removeEventListener?: (type: "change", listener: (event: { matches: boolean }) => void) => void;
  addListener?: (listener: (event: { matches: boolean }) => void) => void;
  removeListener?: (listener: (event: { matches: boolean }) => void) => void;
};

type WindowLike = {
  matchMedia: (query: string) => MatchMediaLike;
  localStorage?: Pick<Storage, "getItem" | "setItem">;
  getComputedStyle?: typeof window.getComputedStyle;
};

function getRuntimeWindow(): WindowLike {
  return window;
}

export function prefersDarkMode(win: WindowLike = getRuntimeWindow()): boolean {
  try {
    return win.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function motionReduced(win: WindowLike = getRuntimeWindow()): boolean {
  try {
    return win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function readStoredColorMode(
  storage?: Pick<Storage, "getItem">,
): ColorMode | null {
  try {
    const runtimeStorage = storage ?? getRuntimeWindow().localStorage;
    const stored = runtimeStorage?.getItem(COLOR_MODE_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

export function resolveColorMode(
  win: WindowLike = getRuntimeWindow(),
  storage?: Pick<Storage, "getItem">,
): ColorMode {
  return readStoredColorMode(storage ?? win.localStorage) ?? (prefersDarkMode(win) ? "dark" : "light");
}

export function applyColorMode(
  mode: ColorMode,
  doc: Pick<Document, "documentElement" | "body"> = document,
): void {
  doc.documentElement.dataset.colorMode = mode;
  doc.body?.setAttribute("data-color-mode", mode);
}

export function dispatchColorModeChange(
  mode: ColorMode,
  doc: Document = document,
): void {
  const EventCtor = doc.defaultView?.CustomEvent ?? CustomEvent;
  doc.dispatchEvent(
    new EventCtor(COLOR_MODE_CHANGE_EVENT, {
      detail: { mode },
    }),
  );
}

export function persistColorMode(
  mode: ColorMode,
  storage?: Pick<Storage, "setItem">,
): void {
  try {
    const runtimeStorage = storage ?? getRuntimeWindow().localStorage;
    runtimeStorage?.setItem(COLOR_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore unavailable storage.
  }
}

function syncGroupIndicator(
  group: HTMLElement,
  mode: ColorMode,
  immediate: boolean,
  win: WindowLike,
): void {
  const indicator = group.querySelector<HTMLElement>("[data-color-mode-indicator]");
  const target = group.querySelector<HTMLElement>(`[data-color-mode-value="${mode}"]`);

  if (!indicator || !target) return;

  const groupStyle = win.getComputedStyle?.(group);
  const paddingLeft = Number.parseFloat(groupStyle?.paddingLeft ?? "0") || 0;
  const targetX = Math.max(0, target.offsetLeft - paddingLeft);
  const targetWidth = target.offsetWidth;

  if (immediate || motionReduced(win) || targetWidth === 0) {
    indicator.style.transform = `translateX(${targetX}px)`;
    indicator.style.width = `${targetWidth}px`;
    return;
  }

  animate(indicator, {
    translateX: targetX,
    width: targetWidth,
    duration: 340,
    ease: "outQuart",
  });
}

function syncColorModeControls(scope: ParentNode, mode: ColorMode, immediate: boolean, win: WindowLike): void {
  scope.querySelectorAll<HTMLElement>("[data-color-mode-toggle]").forEach((group) => {
    group.querySelectorAll<HTMLButtonElement>("[data-color-mode-value]").forEach((button) => {
      const active = button.dataset.colorModeValue === mode;
      button.setAttribute("aria-pressed", String(active));
      button.dataset.active = String(active);
    });

    syncGroupIndicator(group, mode, immediate, win);
  });
}

export function initColorMode(
  doc: Pick<Document, "documentElement" | "body"> = document,
  win: WindowLike = getRuntimeWindow(),
): ColorMode {
  const mode = resolveColorMode(win, win.localStorage);
  applyColorMode(mode, doc);
  return mode;
}

export function mountColorModeToggle(root: HTMLElement): () => void {
  const doc = root.ownerDocument;
  const win = doc.defaultView ?? window;
  const mediaQuery = win.matchMedia("(prefers-color-scheme: dark)");
  let activeMode = initColorMode(doc, win);
  dispatchColorModeChange(activeMode, doc);

  const onClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>("[data-color-mode-value]");
    const cycleButton = target?.closest<HTMLElement>("[data-color-mode-cycle]");

    if (button && root.contains(button)) {
      const nextMode = button.dataset.colorModeValue === "dark" ? "dark" : "light";
      if (nextMode === activeMode) return;

      activeMode = nextMode;
      applyColorMode(nextMode, doc);
      persistColorMode(nextMode, win.localStorage);
      syncColorModeControls(root, nextMode, false, win);
      dispatchColorModeChange(nextMode, doc);
      return;
    }

    if (!cycleButton || !root.contains(cycleButton)) return;

    activeMode = activeMode === "dark" ? "light" : "dark";
    applyColorMode(activeMode, doc);
    persistColorMode(activeMode, win.localStorage);
    dispatchColorModeChange(activeMode, doc);
  };

  const onToggleRequest = () => {
    activeMode = activeMode === "dark" ? "light" : "dark";
    applyColorMode(activeMode, doc);
    persistColorMode(activeMode, win.localStorage);
    dispatchColorModeChange(activeMode, doc);
  };

  const onSystemChange = (event: { matches: boolean }) => {
    if (readStoredColorMode(win.localStorage)) return;

    activeMode = event.matches ? "dark" : "light";
    applyColorMode(activeMode, doc);
    dispatchColorModeChange(activeMode, doc);
  };

  root.addEventListener("click", onClick);
  doc.addEventListener(COLOR_MODE_TOGGLE_EVENT, onToggleRequest as EventListener);

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", onSystemChange);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(onSystemChange);
  }

  return () => {
    root.removeEventListener("click", onClick);
    doc.removeEventListener(COLOR_MODE_TOGGLE_EVENT, onToggleRequest as EventListener);

    if (typeof mediaQuery.removeEventListener === "function") {
      mediaQuery.removeEventListener("change", onSystemChange);
    } else if (typeof mediaQuery.removeListener === "function") {
      mediaQuery.removeListener(onSystemChange);
    }
  };
}
