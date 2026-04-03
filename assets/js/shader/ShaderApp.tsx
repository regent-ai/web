import { animate, stagger } from "animejs";
import * as React from "react";

import { ShaderAttribution } from "./ShaderAttribution.tsx";
import { ShaderCanvas } from "./ShaderCanvas.tsx";
import {
  createShaderDefaultsById,
  getSliderNumericValue,
  resolveShaderDefineValues,
  SHADER_SLIDER_COMMIT_DELAY_MS,
  validateShaderDefineInput,
} from "./editor.ts";
import {
  buildShaderFragmentSource,
  SHADER_CATALOG,
} from "./lib/catalog.ts";
import type {
  ShaderCatalogEntry,
  ShaderDefineControl,
  ShaderDefineValues,
  ShaderUsage,
} from "./lib/types.ts";
import { classNames, prefersReducedMotion } from "./utils.ts";

type DefineValueMap = Record<string, ShaderDefineValues>;
type DefineErrorMap = Record<string, Record<string, string>>;
type DefineApplyingMap = Record<string, Record<string, boolean>>;

type ResetState = {
  isOpen: boolean;
  shaderId: string | null;
  message: string;
};

const SHADER_DEFAULTS_BY_ID = createShaderDefaultsById(SHADER_CATALOG);
const TABLE_PREVIEW_DPR_CAP = 1.05;
const MODAL_PREVIEW_DPR_CAP = 1.6;

function usageTone(usage: ShaderUsage) {
  if (usage === "avatar") {
    return "border-[color:color-mix(in_oklch,var(--ring)_62%,transparent)] bg-[color:color-mix(in_oklch,var(--ring)_16%,transparent)] text-[color:var(--foreground)]";
  }

  if (usage === "background") {
    return "border-[color:color-mix(in_oklch,var(--brand-ink)_42%,transparent)] bg-[color:color-mix(in_oklch,var(--brand-ink)_10%,transparent)] text-[color:var(--foreground)]";
  }

  return "border-[color:color-mix(in_oklch,#a48f55_45%,transparent)] bg-[color:color-mix(in_oklch,#a48f55_14%,transparent)] text-[color:var(--foreground)]";
}

function usageLabel(usage: ShaderUsage) {
  if (usage === "creator-inert") return "creator-inert";
  return usage;
}

function sourceHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

function createEmptyResetState(): ResetState {
  return {
    isOpen: false,
    shaderId: null,
    message: "",
  };
}

function buildRenderableShader(
  shader: ShaderCatalogEntry,
  overrides: ShaderDefineValues | undefined,
  pending: ShaderDefineValues | undefined,
): ShaderCatalogEntry {
  const defineValues = resolveShaderDefineValues(shader, overrides, pending);

  return {
    ...shader,
    fragmentSource: buildShaderFragmentSource(shader, defineValues),
  };
}

function updateShaderValueMap(
  setter: React.Dispatch<React.SetStateAction<DefineValueMap>>,
  shaderId: string,
  key: string,
  value: string | null,
) {
  setter((previous) => {
    const nextShaderValues = { ...(previous[shaderId] ?? {}) };

    if (typeof value === "string") {
      nextShaderValues[key] = value;
    } else {
      delete nextShaderValues[key];
    }

    if (Object.keys(nextShaderValues).length === 0) {
      const { [shaderId]: _removed, ...rest } = previous;
      return rest;
    }

    return {
      ...previous,
      [shaderId]: nextShaderValues,
    };
  });
}

function updateShaderErrorMap(
  setter: React.Dispatch<React.SetStateAction<DefineErrorMap>>,
  shaderId: string,
  key: string,
  value: string | null,
) {
  setter((previous) => {
    const nextShaderValues = { ...(previous[shaderId] ?? {}) };

    if (typeof value === "string" && value.trim()) {
      nextShaderValues[key] = value;
    } else {
      delete nextShaderValues[key];
    }

    if (Object.keys(nextShaderValues).length === 0) {
      const { [shaderId]: _removed, ...rest } = previous;
      return rest;
    }

    return {
      ...previous,
      [shaderId]: nextShaderValues,
    };
  });
}

function updateShaderApplyingMap(
  setter: React.Dispatch<React.SetStateAction<DefineApplyingMap>>,
  shaderId: string,
  key: string,
  value: boolean,
) {
  setter((previous) => {
    const nextShaderValues = { ...(previous[shaderId] ?? {}) };

    if (value) {
      nextShaderValues[key] = true;
    } else {
      delete nextShaderValues[key];
    }

    if (Object.keys(nextShaderValues).length === 0) {
      const { [shaderId]: _removed, ...rest } = previous;
      return rest;
    }

    return {
      ...previous,
      [shaderId]: nextShaderValues,
    };
  });
}

function removeShaderFromRecord<T extends Record<string, unknown>>(
  setter: React.Dispatch<React.SetStateAction<Record<string, T>>>,
  shaderId: string,
) {
  setter((previous) => {
    if (!(shaderId in previous)) return previous;
    const { [shaderId]: _removed, ...rest } = previous;
    return rest;
  });
}

function OverlayModal({
  title,
  description,
  children,
  onClose,
  dismissable = true,
  maxWidthClassName = "max-w-6xl",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  dismissable?: boolean;
  maxWidthClassName?: string;
}) {
  const backdropRef = React.useRef<HTMLDivElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!backdropRef.current || !cardRef.current || prefersReducedMotion()) return;

    backdropRef.current.style.opacity = "0";
    cardRef.current.style.opacity = "0";
    cardRef.current.style.transform = "translateY(18px) scale(0.985)";

    animate(backdropRef.current, {
      opacity: [0, 1],
      duration: 180,
      ease: "outQuad",
    });

    animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [18, 0],
      scale: [0.985, 1],
      duration: 260,
      ease: "outExpo",
    });
  }, []);

  React.useEffect(() => {
    if (!dismissable) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismissable, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-5 sm:py-6"
      onClick={dismissable ? onClose : undefined}
    >
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-[color:color-mix(in_oklch,var(--background)_22%,transparent)] backdrop-blur-[2px]"
        aria-hidden="true"
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className={classNames(
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[1.9rem] border border-[color:color-mix(in_oklch,var(--border)_74%,var(--brand-ink)_26%)] bg-[color:color-mix(in_oklch,var(--card)_97%,var(--background)_3%)] shadow-[0_36px_100px_-52px_color-mix(in_oklch,var(--brand-ink)_62%,transparent)]",
          maxWidthClassName,
        )}
      >
        <div className="border-b border-[color:var(--border)] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                Shader detail
              </p>
              <h2 id={titleId} className="font-display text-2xl text-[color:var(--foreground)]">
                {title}
              </h2>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted-foreground)]">
                  {description}
                </p>
              ) : null}
            </div>

            {dismissable ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_88%,var(--card)_12%)] text-lg text-[color:var(--foreground)] transition hover:border-[color:var(--ring)]"
                aria-label="Close shader detail"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function UsageBadges({ usage }: { usage: readonly ShaderUsage[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {usage.map((entry) => (
        <span
          key={entry}
          className={classNames(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]",
            usageTone(entry),
          )}
        >
          {usageLabel(entry)}
        </span>
      ))}
    </div>
  );
}

function EditorField({
  shader,
  control,
  currentValue,
  liveValue,
  inputError,
  isApplying,
  onSliderChange,
  onSliderCommit,
  onInputChange,
  onInputCommit,
  onInputReset,
  onDefault,
}: {
  shader: ShaderCatalogEntry;
  control: ShaderDefineControl;
  currentValue: string;
  liveValue: string;
  inputError?: string;
  isApplying: boolean;
  onSliderChange: (control: ShaderDefineControl, nextValue: string) => void;
  onSliderCommit: (control: ShaderDefineControl, explicitValue?: string) => void;
  onInputChange: (control: ShaderDefineControl, nextValue: string) => void;
  onInputCommit: (control: ShaderDefineControl, nextValue?: string) => void;
  onInputReset: (shaderId: string, key: string) => void;
  onDefault: (control: ShaderDefineControl) => void;
}) {
  const sliderValue = getSliderNumericValue(
    liveValue,
    getSliderNumericValue(control.defaultValue, 0),
  );

  return (
    <div className="rounded-[1.4rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_90%,var(--card)_10%)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-lg text-[color:var(--foreground)]">
            {control.label}
          </div>
          {control.description ? (
            <p className="mt-1 text-xs leading-5 text-[color:var(--muted-foreground)]">
              {control.description}
            </p>
          ) : null}
        </div>
        <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
          {control.kind}
        </span>
      </div>

      {(control.kind === "float" || control.kind === "int") &&
      typeof control.min === "number" &&
      typeof control.max === "number" ? (
        <div className="mt-4">
          <input
            type="range"
            min={control.min}
            max={control.max}
            step={control.step ?? (control.kind === "int" ? 1 : 0.01)}
            value={sliderValue}
            onChange={(event) => {
              const rawValue = Number(event.target.value);
              const nextValue =
                control.kind === "int" ? String(Math.round(rawValue)) : String(rawValue);
              onSliderChange(control, nextValue);
            }}
            onPointerUp={(event) => onSliderCommit(control, event.currentTarget.value)}
            onMouseUp={(event) => onSliderCommit(control, event.currentTarget.value)}
            onTouchEnd={(event) => onSliderCommit(control, event.currentTarget.value)}
            onKeyUp={(event) => onSliderCommit(control, event.currentTarget.value)}
            className="w-full accent-[color:var(--ring)]"
          />
          <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
            <span>{control.min}</span>
            <span>{control.max}</span>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={currentValue}
          onChange={(event) => onInputChange(control, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onInputCommit(control, event.currentTarget.value);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onInputReset(shader.id, control.key);
            }
          }}
          className={classNames(
            "min-h-11 w-full rounded-2xl border bg-[color:color-mix(in_oklch,var(--background)_86%,var(--card)_14%)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--ring)]",
            inputError
              ? "border-[color:#a6574f]"
              : "border-[color:var(--border)]",
          )}
        />
        <button
          type="button"
          onClick={() => onDefault(control)}
          className="inline-flex h-11 shrink-0 items-center rounded-2xl border border-[color:var(--border)] px-3 text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)] transition hover:border-[color:var(--ring)]"
        >
          Default
        </button>
      </div>

      {inputError ? (
        <p className="mt-2 text-[11px] leading-5 text-[color:#a6574f]">{inputError}</p>
      ) : isApplying ? (
        <p className="mt-2 text-[11px] leading-5 text-[color:var(--foreground)]">
          Applying shader update...
        </p>
      ) : (
        <p className="mt-2 text-[11px] leading-5 text-[color:var(--muted-foreground)]">
          Press Enter to apply.
        </p>
      )}
    </div>
  );
}

export function ShaderApp() {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const shaderTimeoutsRef = React.useRef<Record<string, number>>({});
  const shaderErrorLockRef = React.useRef(false);

  const [openShaderId, setOpenShaderId] = React.useState<string | null>(null);
  const [interactivePreviewShaderId, setInteractivePreviewShaderId] =
    React.useState<string | null>(null);
  const [shaderCanvasResetNonce, setShaderCanvasResetNonce] = React.useState(0);
  const [shaderDefineValues, setShaderDefineValues] = React.useState<DefineValueMap>({});
  const [pendingSliderDefineValues, setPendingSliderDefineValues] =
    React.useState<DefineValueMap>({});
  const [shaderInputDraftValues, setShaderInputDraftValues] =
    React.useState<DefineValueMap>({});
  const [shaderInputErrors, setShaderInputErrors] = React.useState<DefineErrorMap>({});
  const [sliderDefineApplying, setSliderDefineApplying] =
    React.useState<DefineApplyingMap>({});
  const [shaderResetState, setShaderResetState] =
    React.useState<ResetState>(createEmptyResetState);

  const selectedShader = openShaderId
    ? SHADER_CATALOG.find((entry) => entry.id === openShaderId) ?? null
    : null;

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const targets = root.querySelectorAll<HTMLElement>("[data-shader-reveal]");
    if (targets.length === 0) return;

    animate(targets, {
      opacity: [0, 1],
      translateY: [18, 0],
      delay: stagger(70),
      duration: 520,
      ease: "outExpo",
    });
  }, []);

  React.useEffect(() => {
    return () => {
      for (const timeoutId of Object.values(shaderTimeoutsRef.current)) {
        window.clearTimeout(timeoutId);
      }
      shaderTimeoutsRef.current = {};
    };
  }, []);

  React.useEffect(() => {
    shaderErrorLockRef.current = false;
  }, [openShaderId]);

  function clearScheduledSliderUpdate(
    shaderId: string,
    key: string,
    options?: {
      preservePending?: boolean;
      preserveApplying?: boolean;
    },
  ) {
    const timeoutKey = `${shaderId}:${key}`;
    const timeoutId = shaderTimeoutsRef.current[timeoutKey];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete shaderTimeoutsRef.current[timeoutKey];
    }

    if (!options?.preservePending) {
      updateShaderValueMap(setPendingSliderDefineValues, shaderId, key, null);
    }

    if (!options?.preserveApplying) {
      updateShaderApplyingMap(setSliderDefineApplying, shaderId, key, false);
    }
  }

  function clearScheduledSliderUpdatesForShader(shaderId: string) {
    for (const timeoutKey of Object.keys(shaderTimeoutsRef.current)) {
      if (!timeoutKey.startsWith(`${shaderId}:`)) continue;
      window.clearTimeout(shaderTimeoutsRef.current[timeoutKey]);
      delete shaderTimeoutsRef.current[timeoutKey];
    }
  }

  function clearShaderInputStateForShader(shaderId: string) {
    removeShaderFromRecord(setShaderInputDraftValues, shaderId);
    removeShaderFromRecord(setShaderInputErrors, shaderId);
    removeShaderFromRecord(setPendingSliderDefineValues, shaderId);
    removeShaderFromRecord(setSliderDefineApplying, shaderId);
  }

  function clearShaderInputDraftValue(shaderId: string, key: string) {
    updateShaderValueMap(setShaderInputDraftValues, shaderId, key, null);
  }

  function clearShaderInputError(shaderId: string, key: string) {
    updateShaderErrorMap(setShaderInputErrors, shaderId, key, null);
  }

  function setShaderInputDraftValue(shaderId: string, key: string, value: string) {
    updateShaderValueMap(setShaderInputDraftValues, shaderId, key, value);
  }

  function setShaderInputError(shaderId: string, key: string, value: string) {
    updateShaderErrorMap(setShaderInputErrors, shaderId, key, value);
  }

  function setSliderApplying(shaderId: string, key: string, value: boolean) {
    updateShaderApplyingMap(setSliderDefineApplying, shaderId, key, value);
  }

  function upsertShaderDefineValue(
    shaderId: string,
    key: string,
    rawValue: string,
    control: ShaderDefineControl,
  ) {
    const validation = validateShaderDefineInput(control, rawValue);
    if (!validation.isValid || !validation.normalizedValue) return false;

    const defaultValue =
      SHADER_DEFAULTS_BY_ID.get(shaderId)?.[key] ?? control.defaultValue;
    const normalizedValue = validation.normalizedValue;

    updateShaderValueMap(
      setShaderDefineValues,
      shaderId,
      key,
      normalizedValue === defaultValue ? null : normalizedValue,
    );

    return true;
  }

  function setPendingSliderDefineValue(control: ShaderDefineControl, value: string) {
    if (!selectedShader) return;
    const shaderId = selectedShader.id;
    const validation = validateShaderDefineInput(control, value);
    const normalizedValue = validation.normalizedValue ?? control.defaultValue;

    clearScheduledSliderUpdate(shaderId, control.key, {
      preservePending: true,
      preserveApplying: false,
    });
    clearShaderInputDraftValue(shaderId, control.key);
    clearShaderInputError(shaderId, control.key);
    setSliderApplying(shaderId, control.key, false);
    updateShaderValueMap(
      setPendingSliderDefineValues,
      shaderId,
      control.key,
      normalizedValue,
    );
  }

  function schedulePendingSliderCommit(
    control: ShaderDefineControl,
    explicitValue?: string,
  ) {
    if (!selectedShader) return;

    const shaderId = selectedShader.id;
    const defaults = SHADER_DEFAULTS_BY_ID.get(shaderId) ?? {};
    const liveValue =
      explicitValue ??
      pendingSliderDefineValues[shaderId]?.[control.key] ??
      shaderDefineValues[shaderId]?.[control.key] ??
      defaults[control.key] ??
      control.defaultValue;
    const validation = validateShaderDefineInput(control, liveValue);

    if (!validation.isValid || !validation.normalizedValue) {
      setShaderInputError(
        shaderId,
        control.key,
        validation.errorMessage ?? "Invalid slider value.",
      );
      setSliderApplying(shaderId, control.key, false);
      return;
    }

    clearScheduledSliderUpdate(shaderId, control.key, {
      preservePending: true,
      preserveApplying: true,
    });
    setSliderApplying(shaderId, control.key, true);

    const timeoutKey = `${shaderId}:${control.key}`;
    shaderTimeoutsRef.current[timeoutKey] = window.setTimeout(() => {
      upsertShaderDefineValue(shaderId, control.key, validation.normalizedValue!, control);
      updateShaderValueMap(setPendingSliderDefineValues, shaderId, control.key, null);
      setSliderApplying(shaderId, control.key, false);
      delete shaderTimeoutsRef.current[timeoutKey];
    }, SHADER_SLIDER_COMMIT_DELAY_MS);
  }

  function setShaderDefineValueImmediately(
    control: ShaderDefineControl,
    value: string,
  ) {
    if (!selectedShader) return;
    const shaderId = selectedShader.id;

    clearScheduledSliderUpdate(shaderId, control.key);
    clearShaderInputDraftValue(shaderId, control.key);
    clearShaderInputError(shaderId, control.key);
    upsertShaderDefineValue(shaderId, control.key, value, control);
  }

  function handleShaderDefineInputChange(
    control: ShaderDefineControl,
    nextValue: string,
  ) {
    if (!selectedShader) return;
    const shaderId = selectedShader.id;

    setShaderInputDraftValue(shaderId, control.key, nextValue);

    const validation = validateShaderDefineInput(control, nextValue);
    if (!validation.isValid && validation.errorMessage) {
      setShaderInputError(shaderId, control.key, validation.errorMessage);
      return;
    }

    clearShaderInputError(shaderId, control.key);
  }

  function commitShaderDefineInput(control: ShaderDefineControl, explicitValue?: string) {
    if (!selectedShader) return;

    const shaderId = selectedShader.id;
    const defaults = SHADER_DEFAULTS_BY_ID.get(shaderId) ?? {};
    const nextRawValue =
      explicitValue ??
      shaderInputDraftValues[shaderId]?.[control.key] ??
      pendingSliderDefineValues[shaderId]?.[control.key] ??
      shaderDefineValues[shaderId]?.[control.key] ??
      defaults[control.key] ??
      control.defaultValue;
    const validation = validateShaderDefineInput(control, nextRawValue);

    if (!validation.isValid || !validation.normalizedValue) {
      setShaderInputError(
        shaderId,
        control.key,
        validation.errorMessage ?? "Invalid value.",
      );
      return;
    }

    clearScheduledSliderUpdate(shaderId, control.key);
    upsertShaderDefineValue(shaderId, control.key, validation.normalizedValue, control);
    clearShaderInputDraftValue(shaderId, control.key);
    clearShaderInputError(shaderId, control.key);
  }

  function resetInputField(shaderId: string, key: string) {
    clearShaderInputDraftValue(shaderId, key);
    clearShaderInputError(shaderId, key);
  }

  function clearShaderOverrides(shaderId: string) {
    clearScheduledSliderUpdatesForShader(shaderId);
    clearShaderInputStateForShader(shaderId);
    removeShaderFromRecord(setShaderDefineValues, shaderId);
  }

  function continueAfterShaderReset() {
    const shaderId = shaderResetState.shaderId;
    if (shaderId) {
      clearShaderOverrides(shaderId);
      setShaderCanvasResetNonce((previous) => previous + 1);
    }

    setShaderResetState(createEmptyResetState());
    shaderErrorLockRef.current = false;
  }

  function handleShaderError(shaderId: string, message: string) {
    if (shaderErrorLockRef.current) return;
    shaderErrorLockRef.current = true;
    setOpenShaderId(null);
    setShaderResetState({
      isOpen: true,
      shaderId,
      message,
    });
  }

  const avatarCount = SHADER_CATALOG.filter((entry) => entry.usage.includes("avatar")).length;
  const backgroundCount = SHADER_CATALOG.filter((entry) =>
    entry.usage.includes("background"),
  ).length;
  const inertCount = SHADER_CATALOG.filter((entry) =>
    entry.usage.includes("creator-inert"),
  ).length;
  const persistentPreviewIds = React.useMemo(
    () => new Set(Object.keys(shaderDefineValues)),
    [shaderDefineValues],
  );

  function previewIsActive(shaderId: string) {
    return (
      interactivePreviewShaderId === shaderId ||
      openShaderId === shaderId ||
      persistentPreviewIds.has(shaderId)
    );
  }

  function activatePreview(shaderId: string) {
    setInteractivePreviewShaderId(shaderId);
  }

  function deactivatePreview(shaderId: string) {
    setInteractivePreviewShaderId((current) => (current === shaderId ? null : current));
  }

  return (
    <div ref={rootRef} className="space-y-5 sm:space-y-6">
      <section
        data-shader-reveal
        className="overflow-hidden rounded-[1.9rem] border border-[color:var(--border)] bg-[linear-gradient(135deg,color-mix(in_oklch,var(--card)_92%,transparent),color-mix(in_oklch,var(--background)_78%,var(--brand-ink)_22%))] shadow-[0_30px_90px_-54px_color-mix(in_oklch,var(--brand-ink)_58%,transparent)]"
      >
        <div className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_76%,var(--card)_24%)] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
              Local shader registry
            </div>
            <div className="max-w-3xl">
              <h2 className="font-display text-3xl leading-tight text-[color:var(--foreground)] sm:text-4xl">
                Full shader catalog, rebuilt inside this Phoenix app.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted-foreground)] sm:text-[15px]">
                Every Regent shader is listed here with a live preview, source link, and the
                same direct define editor that used to live in Creator. Edits stay local to
                this page until refresh.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_88%,var(--card)_12%)] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                Total shaders
              </p>
              <p className="font-display mt-2 text-4xl text-[color:var(--foreground)]">
                {SHADER_CATALOG.length}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_88%,var(--card)_12%)] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                Avatar / background
              </p>
              <p className="font-display mt-2 text-4xl text-[color:var(--foreground)]">
                {avatarCount}/{backgroundCount}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_88%,var(--card)_12%)] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                Creator inert
              </p>
              <p className="font-display mt-2 text-4xl text-[color:var(--foreground)]">
                {inertCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        data-shader-reveal
        className="overflow-hidden rounded-[1.9rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_94%,var(--card)_6%)] shadow-[0_24px_60px_-50px_color-mix(in_oklch,var(--brand-ink)_54%,transparent)]"
      >
        <div className="border-b border-[color:var(--border)] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                Registry table
              </p>
              <h3 className="font-display text-2xl text-[color:var(--foreground)]">
                Catalog and editor
              </h3>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[color:var(--muted-foreground)]">
              Open any row to edit defines, recover from bad shader values, and compare how
              each piece is used across avatar, background, and inert states.
            </p>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                  <th className="border-b border-[color:var(--border)] px-6 py-4">Preview</th>
                  <th className="border-b border-[color:var(--border)] px-6 py-4">Title</th>
                  <th className="border-b border-[color:var(--border)] px-6 py-4">Id</th>
                  <th className="border-b border-[color:var(--border)] px-6 py-4">Usage</th>
                  <th className="border-b border-[color:var(--border)] px-6 py-4">
                    Editable controls
                  </th>
                  <th className="border-b border-[color:var(--border)] px-6 py-4">Source</th>
                  <th className="border-b border-[color:var(--border)] px-6 py-4 text-right">
                    Edit
                  </th>
                </tr>
              </thead>
              <tbody>
                {SHADER_CATALOG.map((shader) => {
                  const renderableShader = buildRenderableShader(
                    shader,
                    shaderDefineValues[shader.id],
                    shader.id === openShaderId ? pendingSliderDefineValues[shader.id] : undefined,
                  );
                  const isActive = openShaderId === shader.id;

                  return (
                    <tr
                      key={shader.id}
                      className={classNames(
                        "align-top",
                        isActive &&
                          "bg-[color:color-mix(in_oklch,var(--ring)_7%,transparent)]",
                      )}
                    >
                      <td className="border-b border-[color:var(--border)] px-6 py-5">
                        <div
                          className="h-20 w-28 overflow-hidden rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--card)]"
                          onMouseEnter={() => activatePreview(shader.id)}
                          onMouseLeave={() => deactivatePreview(shader.id)}
                          onFocusCapture={() => activatePreview(shader.id)}
                          onBlurCapture={() => deactivatePreview(shader.id)}
                        >
                          <ShaderCanvas
                            key={`table:${shader.id}:${shaderCanvasResetNonce}`}
                            shader={renderableShader}
                            className="h-full w-full"
                            devicePixelRatioCap={TABLE_PREVIEW_DPR_CAP}
                            paused={!previewIsActive(shader.id)}
                            runtimeMode="when-active"
                            onError={(message) => handleShaderError(shader.id, message)}
                          />
                        </div>
                      </td>
                      <td className="border-b border-[color:var(--border)] px-6 py-5">
                        <div className="max-w-sm">
                          <div className="font-display text-lg text-[color:var(--foreground)]">
                            {shader.title}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                            {shader.description}
                          </p>
                        </div>
                      </td>
                      <td className="border-b border-[color:var(--border)] px-6 py-5 text-sm text-[color:var(--foreground)]">
                        {shader.id}
                      </td>
                      <td className="border-b border-[color:var(--border)] px-6 py-5">
                        <UsageBadges usage={shader.usage} />
                      </td>
                      <td className="border-b border-[color:var(--border)] px-6 py-5">
                        <span className="inline-flex min-w-14 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_86%,var(--card)_14%)] px-3 py-2 text-sm text-[color:var(--foreground)]">
                          {shader.defineControls.length}
                        </span>
                      </td>
                      <td className="border-b border-[color:var(--border)] px-6 py-5">
                        <a
                          href={shader.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-[color:var(--foreground)] underline decoration-[color:var(--border)] underline-offset-4 transition hover:decoration-[color:var(--ring)]"
                        >
                          <span>{sourceHost(shader.sourceUrl)}</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      </td>
                      <td className="border-b border-[color:var(--border)] px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => setOpenShaderId(shader.id)}
                          className="inline-flex h-11 items-center rounded-2xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_84%,var(--card)_16%)] px-4 text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)] transition hover:border-[color:var(--ring)]"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 lg:hidden">
          {SHADER_CATALOG.map((shader) => {
            const renderableShader = buildRenderableShader(
              shader,
              shaderDefineValues[shader.id],
              shader.id === openShaderId ? pendingSliderDefineValues[shader.id] : undefined,
            );

            return (
              <article
                key={shader.id}
                className="overflow-hidden rounded-[1.55rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_90%,var(--card)_10%)]"
              >
                <div className="relative h-44 overflow-hidden border-b border-[color:var(--border)] bg-[color:var(--card)]">
                  <div
                    className="h-full w-full"
                    onMouseEnter={() => activatePreview(shader.id)}
                    onMouseLeave={() => deactivatePreview(shader.id)}
                    onFocusCapture={() => activatePreview(shader.id)}
                    onBlurCapture={() => deactivatePreview(shader.id)}
                  >
                    <ShaderCanvas
                      key={`card:${shader.id}:${shaderCanvasResetNonce}`}
                      shader={renderableShader}
                      className="h-full w-full"
                      devicePixelRatioCap={TABLE_PREVIEW_DPR_CAP}
                      paused={!previewIsActive(shader.id)}
                      runtimeMode="when-active"
                      onError={(message) => handleShaderError(shader.id, message)}
                    />
                  </div>
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <div className="font-display text-2xl text-[color:var(--foreground)]">
                      {shader.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                      {shader.description}
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-[1.2rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_84%,var(--card)_16%)] p-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                        Id
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--foreground)]">{shader.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                        Usage
                      </p>
                      <div className="mt-2">
                        <UsageBadges usage={shader.usage} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                        Editable controls
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--foreground)]">
                        {shader.defineControls.length}
                      </p>
                    </div>
                    <div>
                      <a
                        href={shader.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[color:var(--foreground)] underline decoration-[color:var(--border)] underline-offset-4"
                      >
                        <span>Open {sourceHost(shader.sourceUrl)}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenShaderId(shader.id)}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_82%,var(--card)_18%)] px-4 text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)] transition hover:border-[color:var(--ring)]"
                  >
                    Edit shader
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedShader ? (
        <OverlayModal
          title={`${selectedShader.title} (${selectedShader.id})`}
          description="Edit shader defines directly. Slider updates are applied after release with a short delay, and text fields apply on Enter."
          onClose={() => setOpenShaderId(null)}
        >
          <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
            <div className="space-y-4 xl:sticky xl:top-0">
              <div className="overflow-hidden rounded-[1.6rem] border border-[color:var(--border)] bg-[color:var(--card)]">
                <div className="aspect-square w-full">
                  <ShaderCanvas
                    key={`detail:${selectedShader.id}:${shaderCanvasResetNonce}`}
                    shader={buildRenderableShader(
                      selectedShader,
                      shaderDefineValues[selectedShader.id],
                      pendingSliderDefineValues[selectedShader.id],
                    )}
                    className="h-full w-full"
                    devicePixelRatioCap={MODAL_PREVIEW_DPR_CAP}
                    runtimeMode="always"
                    onError={(message) => handleShaderError(selectedShader.id, message)}
                  />
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_88%,var(--card)_12%)] p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                      Shader usage
                    </p>
                    <div className="mt-2">
                      <UsageBadges usage={selectedShader.usage} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                        Editable controls
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--foreground)]">
                        {selectedShader.defineControls.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                        Source
                      </p>
                      <a
                        href={selectedShader.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-2 text-sm text-[color:var(--foreground)] underline decoration-[color:var(--border)] underline-offset-4"
                      >
                        <span>{sourceHost(selectedShader.sourceUrl)}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => clearShaderOverrides(selectedShader.id)}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_82%,var(--card)_18%)] px-4 text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)] transition hover:border-[color:var(--ring)]"
                  >
                    Reset to Defaults
                  </button>

                  <ShaderAttribution className="pt-1" />
                </div>
              </div>
            </div>

            <div className="min-h-0 space-y-4">
              {selectedShader.defineControls.map((control) => {
                const defaults = SHADER_DEFAULTS_BY_ID.get(selectedShader.id) ?? {};
                const liveValues = resolveShaderDefineValues(
                  selectedShader,
                  shaderDefineValues[selectedShader.id],
                  pendingSliderDefineValues[selectedShader.id],
                );
                const liveValue = liveValues[control.key] ?? defaults[control.key] ?? control.defaultValue;
                const currentValue =
                  shaderInputDraftValues[selectedShader.id]?.[control.key] ?? liveValue;
                const inputError = shaderInputErrors[selectedShader.id]?.[control.key];
                const isApplying = Boolean(
                  sliderDefineApplying[selectedShader.id]?.[control.key],
                );

                return (
                  <EditorField
                    key={`${selectedShader.id}:${control.key}`}
                    shader={selectedShader}
                    control={control}
                    currentValue={currentValue}
                    liveValue={liveValue}
                    inputError={inputError}
                    isApplying={isApplying}
                    onSliderChange={setPendingSliderDefineValue}
                    onSliderCommit={schedulePendingSliderCommit}
                    onInputChange={handleShaderDefineInputChange}
                    onInputCommit={commitShaderDefineInput}
                    onInputReset={resetInputField}
                    onDefault={(nextControl) =>
                      setShaderDefineValueImmediately(nextControl, nextControl.defaultValue)
                    }
                  />
                );
              })}
            </div>
          </div>
        </OverlayModal>
      ) : null}

      {shaderResetState.isOpen ? (
        <OverlayModal
          title="Shader error. Resetting to default."
          description="Continue to reset this shader back to its default variables."
          onClose={continueAfterShaderReset}
          dismissable={false}
          maxWidthClassName="max-w-lg"
        >
          <div className="space-y-4">
            {shaderResetState.message ? (
              <div className="rounded-[1.3rem] border border-[color:#a48f55] bg-[color:color-mix(in_oklch,#a48f55_14%,transparent)] p-4 text-sm leading-6 text-[color:var(--foreground)]">
                {shaderResetState.message}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={continueAfterShaderReset}
                className="inline-flex h-11 items-center rounded-2xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_82%,var(--card)_18%)] px-4 text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)] transition hover:border-[color:var(--ring)]"
              >
                Continue
              </button>
            </div>
          </div>
        </OverlayModal>
      ) : null}
    </div>
  );
}
