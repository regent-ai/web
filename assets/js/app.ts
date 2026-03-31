import "phoenix_html";
import { Socket } from "phoenix";
import { LiveSocket, type HooksOptions } from "phoenix_live_view";
import { Heerich } from "heerich";
import topbar from "../vendor/topbar.cjs";
import { mountDashboardRoot, unmountDashboardRoot } from "./dashboard/root";
import {
  hooks as regentHooks,
  installHeerich,
} from "../../../../packages/regent_ui/assets/js/regent";
import {
  mountBridgeReveal,
  mountDashboardReveal,
  mountDemoReveal,
  mountHomeReveal,
  revertAnimation,
} from "./animations";
import { mountProceduralHeerichDemo } from "./heerich_demo";

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
const DemoRevealHook = createRevealHook(mountDemoReveal);
const HeerichProceduralDemoHook = {
  mounted(this: HookContext) {
    mountProceduralHeerichDemo(this.el as HTMLElement);
  },
  updated(this: HookContext) {
    mountProceduralHeerichDemo(this.el as HTMLElement);
  },
};

const csrfToken =
  document.querySelector("meta[name='csrf-token']")?.getAttribute("content") ?? "";

installHeerich(Heerich);

const hooks: HooksOptions = {
  ...regentHooks,
  DashboardRoot: DashboardRootHook,
  HomeReveal: HomeRevealHook,
  BridgeReveal: BridgeRevealHook,
  AutolaunchReveal: BridgeRevealHook,
  DashboardReveal: DashboardRevealHook,
  DemoReveal: DemoRevealHook,
  HeerichProceduralDemo: HeerichProceduralDemoHook,
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
