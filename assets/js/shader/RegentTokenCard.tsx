import { animate } from "animejs";
import * as React from "react";

import type { TokenCardManifestEntry } from "./token_card_types.ts";
import { classNames, prefersReducedMotion } from "./utils.ts";

const TOKEN_CARD_STYLE = `
.rtc-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: clamp(1rem, 3vw, 2rem);
  background:
    radial-gradient(circle at top left, color-mix(in oklch, var(--brand-paper, #fbf4de) 18%, transparent), transparent 32%),
    radial-gradient(circle at 84% 12%, color-mix(in oklch, var(--brand-gold, #d4a756) 14%, transparent), transparent 26%),
    linear-gradient(180deg, color-mix(in oklch, var(--background, #fbf4de) 84%, var(--brand-paper, #fbf4de) 16%), var(--background, #fbf4de));
}

html[data-color-mode="dark"] .rtc-page {
  background:
    radial-gradient(circle at top left, color-mix(in oklch, var(--brand-paper, #fbf4de) 10%, transparent), transparent 30%),
    radial-gradient(circle at 84% 12%, color-mix(in oklch, var(--brand-gold, #d4a756) 10%, transparent), transparent 24%),
    linear-gradient(180deg, color-mix(in oklch, var(--background, #034568) 92%, var(--brand-charcoal, #315569) 8%), var(--background, #034568));
}

.rtc-stage {
  width: 24rem;
  max-width: 24rem;
  flex: 0 0 auto;
}

.rtc-card {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 1.45rem;
  padding: 0.6rem;
  background: linear-gradient(180deg, #14181b, #0d1013);
  border: 1px solid #0a0d10;
  box-shadow:
    0 28px 80px color-mix(in oklch, var(--brand-charcoal, #315569) 24%, transparent),
    inset 0 1px 0 rgba(255,255,255,0.05),
    inset 0 0 0 1px rgba(255,255,255,0.04);
  overflow: hidden;
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

html[data-color-mode="dark"] .rtc-card {
  background: linear-gradient(180deg, #111417, #080b0e);
  border-color: #06080a;
  box-shadow:
    0 32px 90px color-mix(in oklch, black 42%, transparent),
    inset 0 1px 0 rgba(255,255,255,0.04),
    inset 0 0 0 1px rgba(255,255,255,0.04);
}

.rtc-card::before {
  content: "";
  position: absolute;
  inset: 0.12rem;
  border-radius: 1.62rem;
  border: 1px solid #353c42;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  pointer-events: none;
}

.rtc-card::after {
  content: "";
  position: absolute;
  inset: 0.28rem;
  border-radius: 1.48rem;
  border: 1px solid color-mix(in oklch, var(--brand-gold, #d4a756) 78%, transparent);
  pointer-events: none;
}

.rtc-frame {
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto auto;
  width: 100%;
  height: 100%;
  border-radius: 1.1rem;
  overflow: hidden;
  border: 1px solid #353c42;
  background: linear-gradient(180deg, #181d21, #111519);
}

.rtc-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  opacity: var(--rtc-overlay-opacity, 0.64);
  transform: translate3d(var(--rtc-overlay-shift-x, 0px), var(--rtc-overlay-shift-y, 0px), 0);
  will-change: transform, opacity;
}

.rtc-overlay::before {
  content: "";
  position: absolute;
  inset: 0.72rem;
  border-radius: 1rem;
  background:
    radial-gradient(circle at var(--rtc-glare-x, 50%) var(--rtc-glare-y, 10%), rgba(255,255,255,0.15), transparent 24%),
    linear-gradient(118deg, transparent 20%, rgba(255,255,255,0.06) 36%, rgba(212,167,86,0.14) 50%, transparent 70%);
  mix-blend-mode: screen;
}

.rtc-chamber {
  position: relative;
  z-index: 1;
  margin: 0.8rem;
  margin-bottom: 0;
  border-radius: 0.95rem 0.95rem 0 0;
  border: 1px solid rgba(255,255,255,0.06);
  border-bottom: none;
  background:
    radial-gradient(circle at 50% 18%, rgba(255,255,255,0.04), transparent 32%),
    radial-gradient(circle at 50% 80%, rgba(255,255,255,0.04), transparent 44%),
    linear-gradient(180deg, #040607, #0b0f13);
  overflow: hidden;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,0.03),
    inset 0 -18px 30px rgba(0,0,0,0.28);
}

.rtc-chamber-media {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.rtc-plaque {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: start;
  gap: 0.34rem;
  min-height: 7.1rem;
  padding: 0.78rem 0.82rem 0.88rem;
  background:
    linear-gradient(180deg, color-mix(in oklch, var(--brand-charcoal, #315569) 14%, transparent), transparent),
    linear-gradient(180deg, color-mix(in oklch, var(--brand-paper, #fbf4de) 92%, var(--brand-charcoal, #315569) 8%), color-mix(in oklch, var(--brand-paper, #fbf4de) 82%, var(--brand-charcoal, #315569) 18%));
}

html[data-color-mode="dark"] .rtc-plaque {
  background:
    linear-gradient(180deg, color-mix(in oklch, var(--brand-paper, #fbf4de) 4%, transparent), transparent),
    linear-gradient(180deg, color-mix(in oklch, var(--card, #19344b) 94%, black 6%), color-mix(in oklch, var(--card, #19344b) 88%, black 12%));
}

.rtc-separator {
  position: relative;
  z-index: 1;
  margin: 0 0.8rem;
  height: 0.62rem;
  background: linear-gradient(180deg, #181d21, #111519);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.04),
    inset 0 -1px 0 rgba(0,0,0,0.32);
}

.rtc-title {
  margin: 0;
  font-family: "GeistPixel Circle", "GeistPixel Square", serif;
  font-size: 28.8px;
  line-height: 27.648px;
  color: oklch(0.377227 0.0814366 239.751);
  white-space: nowrap;
  text-wrap: nowrap;
  overflow: hidden;
}

.rtc-token-line {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 0.8rem;
  min-width: 0;
  color: oklch(0.581071 0.0465964 194.46);
  font-family: "GeistPixel Square", sans-serif;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

html[data-color-mode="dark"] .rtc-title {
  color: var(--foreground, #fbf4de);
}

html[data-color-mode="dark"] .rtc-token-line {
  color: color-mix(in oklch, var(--brand-paper, #fbf4de) 72%, var(--brand-gold, #d4a756) 28%);
}

.rtc-token-id {
  white-space: nowrap;
}

.rtc-card-shell {
  position: relative;
}

.rtc-card-shell[data-rtc-variant="static-image"] .rtc-token-id {
  letter-spacing: 0.02em;
}
`;

function initialReducedMotion() {
  if (typeof window === "undefined") return false;
  return prefersReducedMotion();
}

type CardPose = {
  overlayShiftX: number;
  overlayShiftY: number;
  glareX: number;
  glareY: number;
  overlayOpacity: number;
};

const RESTING_POSE: CardPose = {
  overlayShiftX: 0,
  overlayShiftY: 0,
  glareX: 50,
  glareY: 8,
  overlayOpacity: 0.64,
};

function tokenLabel(tokenId: number) {
  return `#${String(tokenId).padStart(4, "0")}`;
}

function applyPose(element: HTMLElement, pose: CardPose) {
  element.style.setProperty("--rtc-overlay-shift-x", `${pose.overlayShiftX.toFixed(2)}px`);
  element.style.setProperty("--rtc-overlay-shift-y", `${pose.overlayShiftY.toFixed(2)}px`);
  element.style.setProperty("--rtc-glare-x", `${pose.glareX.toFixed(2)}%`);
  element.style.setProperty("--rtc-glare-y", `${pose.glareY.toFixed(2)}%`);
  element.style.setProperty("--rtc-overlay-opacity", `${pose.overlayOpacity.toFixed(3)}`);
}

export function RegentTokenCard({
  entry,
  media,
  interactive = true,
  className,
  renderVariant = "live",
}: {
  entry: TokenCardManifestEntry;
  media: React.ReactNode;
  interactive?: boolean;
  className?: string;
  renderVariant?: "live" | "static-image";
}) {
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const poseRef = React.useRef<CardPose>({ ...RESTING_POSE });
  const reducedMotion = React.useRef(initialReducedMotion()).current;

  React.useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    applyPose(element, RESTING_POSE);

    if (reducedMotion) return;

    element.style.opacity = "0";
    element.style.transform = `${element.style.transform || ""} translateY(18px)`;

    animate(element, {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 420,
      ease: "outExpo",
    });
  }, [reducedMotion]);

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!interactive || reducedMotion) return;
    const element = cardRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
    const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
    const nextPose: CardPose = {
      overlayShiftX: offsetX * 12,
      overlayShiftY: offsetY * 10,
      glareX: 50 + offsetX * 36,
      glareY: 10 + offsetY * 22,
      overlayOpacity: 0.88,
    };

    poseRef.current = nextPose;
    applyPose(element, nextPose);
  }

  function onPointerLeave() {
    const element = cardRef.current;
    if (!interactive || reducedMotion || !element) return;

    animate(poseRef.current, {
      overlayShiftX: RESTING_POSE.overlayShiftX,
      overlayShiftY: RESTING_POSE.overlayShiftY,
      glareX: RESTING_POSE.glareX,
      glareY: RESTING_POSE.glareY,
      overlayOpacity: RESTING_POSE.overlayOpacity,
      duration: 300,
      ease: "outExpo",
      onUpdate: () => applyPose(element, poseRef.current),
    });
  }

  return (
    <div
      className={classNames("rtc-card-shell", className)}
      data-rtc-variant={renderVariant}
    >
      <style>{TOKEN_CARD_STYLE}</style>
      <div
        ref={cardRef}
        className="rtc-card"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <div className="rtc-frame">
          <div className="rtc-overlay" aria-hidden="true" />
          <div className="rtc-chamber">
            <div className="rtc-chamber-media">{media}</div>
          </div>
          <div className="rtc-separator" aria-hidden="true" />

          <div className="rtc-plaque">
            <h1 className="rtc-title">{entry.name}</h1>
            <div className="rtc-token-line">
              <span className="rtc-token-id">{tokenLabel(entry.tokenId)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
