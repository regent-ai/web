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
  width: min(100%, 30rem);
}

.rtc-card {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 1.8rem;
  padding: 0.6rem;
  background:
    linear-gradient(180deg, color-mix(in oklch, var(--brand-paper, #fbf4de) 78%, white 22%), color-mix(in oklch, var(--brand-paper, #fbf4de) 92%, var(--brand-charcoal, #315569) 8%));
  border: 1px solid color-mix(in oklch, var(--brand-paper, #fbf4de) 46%, var(--brand-charcoal, #315569) 54%);
  box-shadow:
    0 28px 80px color-mix(in oklch, var(--brand-charcoal, #315569) 24%, transparent),
    inset 0 1px 0 rgba(255,255,255,0.55),
    inset 0 0 0 1px color-mix(in oklch, var(--brand-paper, #fbf4de) 22%, transparent);
  overflow: hidden;
  transform-style: preserve-3d;
  transform:
    perspective(1800px)
    rotateX(var(--rtc-tilt-x, 0deg))
    rotateY(var(--rtc-tilt-y, 0deg))
    translate3d(0, 0, 0);
  will-change: transform;
}

html[data-color-mode="dark"] .rtc-card {
  background:
    linear-gradient(180deg, color-mix(in oklch, var(--card, #19344b) 82%, var(--brand-charcoal, #315569) 18%), color-mix(in oklch, var(--card, #19344b) 92%, black 8%));
  border-color: color-mix(in oklch, var(--brand-paper, #fbf4de) 14%, var(--brand-ink, #034568) 86%);
  box-shadow:
    0 32px 90px color-mix(in oklch, black 42%, transparent),
    inset 0 1px 0 color-mix(in oklch, var(--brand-paper, #fbf4de) 12%, transparent),
    inset 0 0 0 1px color-mix(in oklch, var(--brand-paper, #fbf4de) 8%, transparent);
}

.rtc-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at var(--rtc-glare-x, 50%) var(--rtc-glare-y, 0%), rgba(255,255,255,0.22), transparent 24%),
    linear-gradient(135deg, rgba(255,255,255,0.08), transparent 38%);
  mix-blend-mode: screen;
  opacity: var(--rtc-glare-opacity, 0.72);
}

.rtc-card::after {
  content: "";
  position: absolute;
  inset: 0.4rem;
  border-radius: 1.35rem;
  border: 1px solid color-mix(in oklch, var(--brand-gold, #d4a756) 32%, transparent);
  pointer-events: none;
}

.rtc-frame {
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  width: 100%;
  height: 100%;
  border-radius: 1.3rem;
  overflow: hidden;
  background:
    linear-gradient(180deg, color-mix(in oklch, var(--brand-charcoal, #315569) 16%, var(--brand-ink, #034568) 84%), color-mix(in oklch, var(--brand-charcoal, #315569) 26%, black 74%));
}

.rtc-frame::before {
  content: "";
  position: absolute;
  inset: 0.8rem 0.8rem auto;
  height: 0.4rem;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, color-mix(in oklch, var(--brand-gold, #d4a756) 48%, white 52%), transparent);
  opacity: 0.7;
}

.rtc-chamber {
  position: relative;
  margin: 1rem;
  margin-bottom: 0;
  border-radius: 1.15rem;
  border: 1px solid color-mix(in oklch, var(--brand-paper, #fbf4de) 12%, transparent);
  background:
    radial-gradient(circle at 50% 18%, color-mix(in oklch, var(--brand-paper, #fbf4de) 6%, transparent), transparent 32%),
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
  transform: translate3d(var(--rtc-shift-x, 0px), var(--rtc-shift-y, 0px), 0);
  will-change: transform;
}

.rtc-chamber-orbit {
  position: absolute;
  inset: auto 1rem 1rem auto;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  border: 1px solid color-mix(in oklch, var(--brand-paper, #fbf4de) 28%, transparent);
  background:
    radial-gradient(circle at 32% 32%, rgba(255,255,255,0.92), rgba(255,255,255,0.18) 28%, transparent 64%),
    radial-gradient(circle at center, color-mix(in oklch, var(--brand-paper, #fbf4de) 18%, transparent), transparent 68%);
  box-shadow: 0 0 24px rgba(255,255,255,0.12);
  opacity: 0.9;
  pointer-events: none;
}

.rtc-plaque {
  position: relative;
  display: grid;
  gap: 0.45rem;
  padding: 1rem 1.05rem 1.1rem;
  border-top: 1px solid color-mix(in oklch, var(--brand-paper, #fbf4de) 10%, transparent);
  background:
    linear-gradient(180deg, color-mix(in oklch, var(--brand-charcoal, #315569) 14%, transparent), transparent),
    linear-gradient(180deg, color-mix(in oklch, var(--brand-paper, #fbf4de) 92%, var(--brand-charcoal, #315569) 8%), color-mix(in oklch, var(--brand-paper, #fbf4de) 82%, var(--brand-charcoal, #315569) 18%));
}

html[data-color-mode="dark"] .rtc-plaque {
  background:
    linear-gradient(180deg, color-mix(in oklch, var(--brand-paper, #fbf4de) 4%, transparent), transparent),
    linear-gradient(180deg, color-mix(in oklch, var(--card, #19344b) 94%, black 6%), color-mix(in oklch, var(--card, #19344b) 88%, black 12%));
}

.rtc-plaque::before {
  content: "";
  position: absolute;
  inset: 0.45rem 0.55rem auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in oklch, var(--brand-gold, #d4a756) 46%, transparent), transparent);
}

.rtc-title {
  margin: 0;
  font-family: "GeistPixel Circle", "GeistPixelSquare", serif;
  font-size: clamp(1.5rem, 3.1vw, 2.7rem);
  line-height: 0.96;
  color: var(--foreground, #102130);
  text-wrap: balance;
}

.rtc-token-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.8rem;
  min-width: 0;
  color: color-mix(in oklch, var(--brand-charcoal, #315569) 72%, var(--brand-paper, #fbf4de) 28%);
  font-family: "GeistPixel Square", sans-serif;
  font-size: clamp(0.92rem, 1.45vw, 1.22rem);
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

.rtc-token-mark {
  color: color-mix(in oklch, var(--brand-gold, #d4a756) 74%, var(--brand-charcoal, #315569) 26%);
}

.rtc-card-shell {
  position: relative;
}

@media (max-width: 640px) {
  .rtc-stage {
    width: min(100%, 24rem);
  }

  .rtc-card {
    border-radius: 1.45rem;
  }

  .rtc-frame {
    border-radius: 1.1rem;
  }

  .rtc-chamber {
    margin: 0.8rem;
    margin-bottom: 0;
    border-radius: 0.95rem;
  }

  .rtc-plaque {
    padding-inline: 0.9rem;
  }
}
`;

function initialReducedMotion() {
  if (typeof window === "undefined") return false;
  return prefersReducedMotion();
}

type CardPose = {
  tiltX: number;
  tiltY: number;
  shiftX: number;
  shiftY: number;
  glareX: number;
  glareY: number;
  glareOpacity: number;
};

const RESTING_POSE: CardPose = {
  tiltX: 0,
  tiltY: 0,
  shiftX: 0,
  shiftY: 0,
  glareX: 50,
  glareY: 8,
  glareOpacity: 0.72,
};

function tokenLabel(tokenId: number) {
  return `#${String(tokenId).padStart(4, "0")}`;
}

function applyPose(element: HTMLElement, pose: CardPose) {
  element.style.setProperty("--rtc-tilt-x", `${pose.tiltX.toFixed(2)}deg`);
  element.style.setProperty("--rtc-tilt-y", `${pose.tiltY.toFixed(2)}deg`);
  element.style.setProperty("--rtc-shift-x", `${pose.shiftX.toFixed(2)}px`);
  element.style.setProperty("--rtc-shift-y", `${pose.shiftY.toFixed(2)}px`);
  element.style.setProperty("--rtc-glare-x", `${pose.glareX.toFixed(2)}%`);
  element.style.setProperty("--rtc-glare-y", `${pose.glareY.toFixed(2)}%`);
  element.style.setProperty("--rtc-glare-opacity", `${pose.glareOpacity.toFixed(3)}`);
}

export function RegentTokenCard({
  entry,
  media,
  interactive = true,
  className,
}: {
  entry: TokenCardManifestEntry;
  media: React.ReactNode;
  interactive?: boolean;
  className?: string;
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
      tiltX: offsetY * -8,
      tiltY: offsetX * 8,
      shiftX: offsetX * 10,
      shiftY: offsetY * 10,
      glareX: 50 + offsetX * 44,
      glareY: 8 + offsetY * 28,
      glareOpacity: 0.86,
    };

    poseRef.current = nextPose;
    applyPose(element, nextPose);
  }

  function onPointerLeave() {
    const element = cardRef.current;
    if (!interactive || reducedMotion || !element) return;

    animate(poseRef.current, {
      tiltX: RESTING_POSE.tiltX,
      tiltY: RESTING_POSE.tiltY,
      shiftX: RESTING_POSE.shiftX,
      shiftY: RESTING_POSE.shiftY,
      glareX: RESTING_POSE.glareX,
      glareY: RESTING_POSE.glareY,
      glareOpacity: RESTING_POSE.glareOpacity,
      duration: 300,
      ease: "outExpo",
      onUpdate: () => applyPose(element, poseRef.current),
    });
  }

  return (
    <div className={classNames("rtc-card-shell", className)}>
      <style>{TOKEN_CARD_STYLE}</style>
      <div
        ref={cardRef}
        className="rtc-card"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <div className="rtc-frame">
          <div className="rtc-chamber">
            <div className="rtc-chamber-media">{media}</div>
            <div className="rtc-chamber-orbit" aria-hidden="true" />
          </div>

          <div className="rtc-plaque">
            <h1 className="rtc-title">{entry.name}</h1>
            <div className="rtc-token-line">
              <span className="rtc-token-id">{tokenLabel(entry.tokenId)}</span>
              <span className="rtc-token-mark">Regents Club</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
