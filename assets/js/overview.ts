import { createLayout } from "animejs";

function overviewMotionReduced(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function syncOverviewButtons(root: HTMLElement, mode: "human" | "agent"): void {
  root.querySelectorAll<HTMLButtonElement>("[data-overview-mode]").forEach((button) => {
    const active = button.dataset.overviewMode === mode;
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.dataset.active = active ? "true" : "false";
  });
}

export function mountOverviewMode(root: HTMLElement): () => void {
  const stack = root.querySelector<HTMLElement>("#platform-overview-stack");
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-overview-mode]"));

  if (!stack || buttons.length === 0) return () => undefined;

  const layout = createLayout(stack);
  let activeMode: "human" | "agent" =
    stack.dataset.mode === "agent" ? "agent" : "human";

  syncOverviewButtons(root, activeMode);

  const setMode = (nextMode: "human" | "agent") => {
    if (nextMode === activeMode) return;

    activeMode = nextMode;

    if (overviewMotionReduced()) {
      stack.dataset.mode = nextMode;
      syncOverviewButtons(root, nextMode);
      return;
    }

    layout.update(() => {
      stack.dataset.mode = nextMode;
      syncOverviewButtons(root, nextMode);
    }, {
      duration: 500,
      ease: "outQuart",
    });
  };

  const cleanups = buttons.map((button) => {
    const onClick = () => {
      const requestedMode = button.dataset.overviewMode === "agent" ? "agent" : "human";
      setMode(requestedMode);
    };

    button.addEventListener("click", onClick);
    return () => button.removeEventListener("click", onClick);
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    layout.revert?.();
  };
}
