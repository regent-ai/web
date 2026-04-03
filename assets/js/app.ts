import "phoenix_html";
import { animate } from "animejs";
import { Socket } from "phoenix";
import { LiveSocket, type HooksOptions } from "phoenix_live_view";
import { Heerich } from "heerich";
import topbar from "../vendor/topbar.cjs";
import { mountDashboardRoot, unmountDashboardRoot } from "./dashboard/root";
import {
  hooks as regentHooks,
  installHeerich,
} from "../regent/js/regent";
import {
  mountBridgeReveal,
  mountDashboardReveal,
  mountDemoReveal,
  mountHomeReveal,
  revertAnimation,
} from "./animations";
import { FooterVoxelHook } from "./footer_voxel";
import { HomeRegentScene } from "./home_regent_scene";
import { mountProceduralHeerichDemo } from "./heerich_demo";
import { AnimatedHomeLogoSceneHook } from "./home_logo_scene";
import { LogoStudiesHook } from "./logos";
import { mountOverviewMode } from "./overview";
import { mountColorModeToggle } from "./color_mode";

type HookContext = {
  el: Element;
  __regentAnimation?: ReturnType<typeof mountHomeReveal>;
};

function resetReveal(context: HookContext): void {
  revertAnimation(context.__regentAnimation);
  context.__regentAnimation = undefined;
}

function createRevealHook(
  mountReveal: (root: HTMLElement) => ReturnType<typeof mountHomeReveal>,
) {
  return {
    mounted(this: HookContext) {
      resetReveal(this);
      this.__regentAnimation = mountReveal(this.el as HTMLElement);
    },
    destroyed(this: HookContext) {
      resetReveal(this);
    },
  };
}

const DashboardRootHook = {
  mounted(this: HookContext) {
    mountDashboardRoot(this.el);
  },
  updated(this: HookContext) {
    mountDashboardRoot(this.el);
  },
  destroyed(this: HookContext) {
    unmountDashboardRoot(this.el);
  },
};
const HomeRevealHook = createRevealHook(mountHomeReveal);
const BridgeRevealHook = createRevealHook(mountBridgeReveal);
const DashboardRevealHook = createRevealHook(mountDashboardReveal);
const BugReportRevealHook = createRevealHook(mountBridgeReveal);
const DemoRevealHook = createRevealHook(mountDemoReveal);
const HeerichProceduralDemoHook = {
  mounted(this: HookContext) {
    mountProceduralHeerichDemo(this.el as HTMLElement);
  },
  updated(this: HookContext) {
    mountProceduralHeerichDemo(this.el as HTMLElement);
  },
};
const ClipboardCopyHook = {
  mounted(this: HookContext & { __copyReset?: number }) {
    const button = this.el as HTMLButtonElement;
    const copyText = button.dataset.copyText ?? "";

    const resetCopied = () => {
      button.dataset.copied = "false";
      delete this.__copyReset;
    };

    button.addEventListener("click", () => {
      if (!copyText) return;

      void navigator.clipboard.writeText(copyText).then(() => {
        if (this.__copyReset) window.clearTimeout(this.__copyReset);
        button.dataset.copied = "true";
        this.__copyReset = window.setTimeout(resetCopied, 1400);
      });
    });
  },
  destroyed(this: HookContext & { __copyReset?: number }) {
    if (this.__copyReset) window.clearTimeout(this.__copyReset);
  },
};

function bugReportMotionReduced(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setDisclosureButtonState(
  button: HTMLButtonElement,
  expanded: boolean,
  collapsedLabel = "Show details",
  expandedLabel = "Hide details",
): void {
  button.setAttribute("aria-expanded", expanded ? "true" : "false");
  const [label, icon] = button.querySelectorAll("span");
  if (label) label.textContent = expanded ? expandedLabel : collapsedLabel;
  if (icon) icon.textContent = expanded ? "↑" : "↓";
}

function mountDisclosurePanels(
  root: HTMLElement,
  selector: string,
  collapsedLabel = "Show details",
  expandedLabel = "Hide details",
): () => void {
  const cleanups: Array<() => void> = [];

  root.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => {
    const panelId = button.dataset.targetId;
    if (!panelId) return;

    const panel = document.getElementById(panelId) as HTMLDivElement | null;
    if (!panel) return;

    setDisclosureButtonState(button, false, collapsedLabel, expandedLabel);
    panel.hidden = true;
    panel.style.height = "0px";
    panel.style.opacity = "0";
    panel.style.overflow = "hidden";

    const toggle = () => {
      const expanded = button.getAttribute("aria-expanded") === "true";

      if (expanded) {
        setDisclosureButtonState(button, false, collapsedLabel, expandedLabel);

        if (bugReportMotionReduced()) {
          panel.hidden = true;
          panel.style.height = "0px";
          panel.style.opacity = "0";
          return;
        }

        const currentHeight = panel.getBoundingClientRect().height || panel.scrollHeight;
        animate(panel, {
          height: [`${currentHeight}px`, "0px"],
          opacity: [1, 0],
          duration: 220,
          ease: "outQuad",
          complete: () => {
            panel.hidden = true;
            panel.style.height = "0px";
            panel.style.opacity = "0";
          },
        });

        return;
      }

      setDisclosureButtonState(button, true, collapsedLabel, expandedLabel);
      panel.hidden = false;

      if (bugReportMotionReduced()) {
        panel.style.height = "auto";
        panel.style.opacity = "1";
        return;
      }

      panel.style.height = "0px";
      panel.style.opacity = "0";
      const targetHeight = panel.scrollHeight;

      animate(panel, {
        height: ["0px", `${targetHeight}px`],
        opacity: [0, 1],
        duration: 280,
        ease: "outQuart",
        complete: () => {
          panel.style.height = "auto";
          panel.style.opacity = "1";
        },
      });
    };

    button.addEventListener("click", toggle);
    cleanups.push(() => button.removeEventListener("click", toggle));
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

function mountBugReportLedger(root: HTMLElement, pushEvent?: (event: string, payload: object) => void): () => void {
  const disclosureCleanup = mountDisclosurePanels(root, "[data-bug-report-toggle]");
  const sentinel = root.querySelector<HTMLElement>("[data-bug-report-sentinel]");

  if (!sentinel || typeof pushEvent !== "function") return disclosureCleanup;

  let loadLocked = false;
  const observer = new IntersectionObserver(
    (entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting);
      if (!isVisible || loadLocked) return;
      loadLocked = true;
      pushEvent("load-more", {});
      window.setTimeout(() => {
        loadLocked = false;
      }, 250);
    },
    {
      rootMargin: "0px 0px 320px 0px",
      threshold: 0.05,
    },
  );

  observer.observe(sentinel);

  return () => {
    observer.disconnect();
    disclosureCleanup();
  };
}

const BugReportLedgerHook = {
  mounted(this: HookContext & { __bugReportCleanup?: () => void; pushEvent?: (event: string, payload: object) => void }) {
    this.__bugReportCleanup = mountBugReportLedger(this.el as HTMLElement, this.pushEvent?.bind(this));
  },
  updated(this: HookContext & { __bugReportCleanup?: () => void; pushEvent?: (event: string, payload: object) => void }) {
    this.__bugReportCleanup?.();
    this.__bugReportCleanup = mountBugReportLedger(this.el as HTMLElement, this.pushEvent?.bind(this));
  },
  destroyed(this: HookContext & { __bugReportCleanup?: () => void }) {
    this.__bugReportCleanup?.();
  },
};

function mountRegentCliAtlas(root: HTMLElement): () => void {
  return mountDisclosurePanels(root, "[data-cli-command-toggle]", "Show details", "Hide details");
}

const RegentCliAtlasHook = {
  mounted(this: HookContext & { __regentCliCleanup?: () => void }) {
    this.__regentCliCleanup = mountRegentCliAtlas(this.el as HTMLElement);
  },
  updated(this: HookContext & { __regentCliCleanup?: () => void }) {
    this.__regentCliCleanup?.();
    this.__regentCliCleanup = mountRegentCliAtlas(this.el as HTMLElement);
  },
  destroyed(this: HookContext & { __regentCliCleanup?: () => void }) {
    this.__regentCliCleanup?.();
  },
};

function mountSidebarCommunity(root: HTMLElement): () => void {
  const button = root.querySelector<HTMLButtonElement>("[data-community-toggle]");
  const panel = root.querySelector<HTMLDivElement>("[data-community-panel]");
  const icon = root.querySelector<HTMLElement>("[data-community-icon]");
  const items = Array.from(root.querySelectorAll<HTMLElement>(".pp-sidebar-community-link"));
  let animationToken = 0;

  if (!button || !panel) return () => undefined;

  const motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const syncExpanded = (expanded: boolean) => {
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
    if (icon) icon.textContent = expanded ? "↑" : "↓";
  };

  const resetClosed = () => {
    panel.hidden = true;
    panel.style.height = "0px";
    panel.style.opacity = "0";
    panel.style.overflow = "hidden";
    items.forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = "translateY(8px)";
    });
  };

  syncExpanded(false);
  resetClosed();

  const open = () => {
    animationToken += 1;
    const token = animationToken;
    syncExpanded(true);
    panel.hidden = false;

    if (motionReduced) {
      panel.style.height = "auto";
      panel.style.opacity = "1";
      items.forEach((item) => {
        item.style.opacity = "1";
        item.style.transform = "translateY(0)";
      });
      return;
    }

    panel.style.height = "0px";
    panel.style.opacity = "0";
    const targetHeight = panel.scrollHeight;

    animate(panel, {
      height: ["0px", `${targetHeight}px`],
      opacity: [0, 1],
      duration: 280,
      ease: "outQuad",
      onComplete: () => {
        if (token !== animationToken) return;
        panel.style.height = "auto";
        panel.style.opacity = "1";
      },
    });

    animate(items, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 220,
      delay: (_element, index) => 40 + index * 35,
      ease: "outQuad",
    });
  };

  const close = () => {
    animationToken += 1;
    const token = animationToken;
    syncExpanded(false);

    if (motionReduced) {
      resetClosed();
      return;
    }

    const currentHeight = panel.getBoundingClientRect().height || panel.scrollHeight;

    animate(items, {
      opacity: [1, 0],
      translateY: [0, 8],
      duration: 220,
      delay: (_element, index) => 40 + (items.length - index - 1) * 35,
      ease: "inQuad",
    });

    animate(panel, {
      height: [`${currentHeight}px`, "0px"],
      opacity: [1, 0],
      duration: 280,
      ease: "inQuad",
      onComplete: () => {
        if (token !== animationToken) return;
        resetClosed();
      },
    });
  };

  const toggle = () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    if (expanded) {
      close();
      return;
    }

    open();
  };

  button.addEventListener("click", toggle);

  return () => {
    button.removeEventListener("click", toggle);
  };
}

const SidebarCommunityHook = {
  mounted(this: HookContext & { __sidebarCommunityCleanup?: () => void }) {
    this.__sidebarCommunityCleanup = mountSidebarCommunity(this.el as HTMLElement);
  },
  updated(this: HookContext & { __sidebarCommunityCleanup?: () => void }) {
    this.__sidebarCommunityCleanup?.();
    this.__sidebarCommunityCleanup = mountSidebarCommunity(this.el as HTMLElement);
  },
  destroyed(this: HookContext & { __sidebarCommunityCleanup?: () => void }) {
    this.__sidebarCommunityCleanup?.();
  },
};

const OverviewModeHook = {
  mounted(this: HookContext & { __overviewModeCleanup?: () => void }) {
    this.__overviewModeCleanup = mountOverviewMode(this.el as HTMLElement);
  },
  updated(this: HookContext & { __overviewModeCleanup?: () => void }) {
    this.__overviewModeCleanup?.();
    this.__overviewModeCleanup = mountOverviewMode(this.el as HTMLElement);
  },
  destroyed(this: HookContext & { __overviewModeCleanup?: () => void }) {
    this.__overviewModeCleanup?.();
  },
};

const ColorModeToggleHook = {
  mounted(this: HookContext & { __colorModeCleanup?: () => void }) {
    this.__colorModeCleanup = mountColorModeToggle(this.el as HTMLElement);
  },
  updated(this: HookContext & { __colorModeCleanup?: () => void }) {
    this.__colorModeCleanup?.();
    this.__colorModeCleanup = mountColorModeToggle(this.el as HTMLElement);
  },
  destroyed(this: HookContext & { __colorModeCleanup?: () => void }) {
    this.__colorModeCleanup?.();
  },
};

const csrfToken =
  document.querySelector("meta[name='csrf-token']")?.getAttribute("content") ?? "";

installHeerich(Heerich);

const hooks: HooksOptions = {
  ...regentHooks,
  DashboardRoot: DashboardRootHook,
  AnimatedHomeLogoScene: AnimatedHomeLogoSceneHook,
  HomeRegentScene,
  HomeReveal: HomeRevealHook,
  BridgeReveal: BridgeRevealHook,
  BugReportReveal: BugReportRevealHook,
  AutolaunchReveal: BridgeRevealHook,
  BugReportLedger: BugReportLedgerHook,
  RegentCliAtlas: RegentCliAtlasHook,
  SidebarCommunity: SidebarCommunityHook,
  DashboardReveal: DashboardRevealHook,
  DemoReveal: DemoRevealHook,
  HeerichProceduralDemo: HeerichProceduralDemoHook,
  FooterVoxel: FooterVoxelHook,
  LogoStudies: LogoStudiesHook,
  ClipboardCopy: ClipboardCopyHook,
  OverviewMode: OverviewModeHook,
  ColorModeToggle: ColorModeToggleHook,
};

const liveSocket = new LiveSocket("/live", Socket, {
  longPollFallbackMs: 2500,
  params: { _csrf_token: csrfToken },
  hooks,
});

topbar.config({ barColors: { 0: "#034568" }, shadowColor: "rgba(0, 0, 0, .18)" });
window.addEventListener("phx:page-loading-start", () => topbar.show(200));
window.addEventListener("phx:page-loading-stop", () => topbar.hide());

liveSocket.connect();

declare global {
  interface Window {
    liveSocket: typeof liveSocket;
  }
}

window.liveSocket = liveSocket;
