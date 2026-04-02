export const REGENT_SIGILS = {

      gate: {
        semantics: "enter / open / navigate",
        motion: "carve",
        inner: `<path d="M18 14H46V50H36V42H28V50H18Z"/>
<path d="M18 26H46"/>`
      }
    ,
      eye: {
        semantics: "inspect / review / reveal",
        motion: "iris",
        inner: `<path d="M10 32C16 22 24 18 32 18C40 18 48 22 54 32C48 42 40 46 32 46C24 46 16 42 10 32Z"/>
<circle cx="32" cy="32" r="5"/>`
      }
    ,
      seed: {
        semantics: "create / initialize / unlock origin",
        motion: "grow",
        inner: `<rect x="27" y="27" width="10" height="10" rx="2"/>
<path d="M32 27V15"/>
<path d="M37 34L49 40"/>
<path d="M27 34L15 40"/>
<circle cx="32" cy="12" r="3"/>
<circle cx="52" cy="41" r="3"/>
<circle cx="12" cy="41" r="3"/>`
      }
    ,
      fuse: {
        semantics: "launch / ignite / commit motion",
        motion: "trace",
        inner: `<path d="M14 38H28"/>
<path d="M28 38H36"/>
<path d="M40 38H46"/>
<path d="M46 26L54 38L46 50"/>
<circle cx="38" cy="26" r="3"/>`
      }
    ,
      seal: {
        semantics: "approve / lock / finalize",
        motion: "compress",
        inner: `<rect x="18" y="18" width="28" height="28" rx="6"/>
<circle cx="32" cy="32" r="5"/>
<path d="M32 13V18"/>
<path d="M32 46V51"/>
<path d="M13 32H18"/>
<path d="M46 32H51"/>`
      }
    ,
      wedge: {
        semantics: "halt / stop / kill / override",
        motion: "collapse",
        inner: `<path d="M18 18H46"/>
<path d="M20 44L32 22L44 44Z"/>
<path d="M32 44V50"/>`
      }

} as const

export type RegentSigilName = keyof typeof REGENT_SIGILS

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function sigilInner(name: RegentSigilName | string | undefined): string {
  if (!name) return REGENT_SIGILS.gate.inner
  const key = String(name).toLowerCase() as RegentSigilName
  return REGENT_SIGILS[key]?.inner ?? REGENT_SIGILS.gate.inner
}

export function sigilSvg(name: RegentSigilName | string | undefined, title?: string): string {
  const inner = sigilInner(name)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="${title ? "false" : "true"}">${title ? `<title>${escapeText(title)}</title>` : ""}${inner}</svg>`
}

export function sigilVoxelMarkup(
  name: RegentSigilName | string | undefined,
  opts: {
    targetId: string
    label?: string
    actionLabel?: string
    color?: string
    interactive?: boolean
    hoverKey?: string
    innerTransform?: string
    intent?: string
    groupRole?: string | null
    clickTone?: string | null
    historyKey?: string | null
    backTargetId?: string | null
  },
): string {
  const inner = sigilInner(name)
  const label = opts.label ?? opts.targetId
  const accessibleLabel =
    opts.actionLabel && opts.actionLabel.trim().length > 0 ? `${opts.actionLabel}: ${label}` : label
  const color = opts.color ?? "var(--rg-sigil-color, currentColor)"
  const sigilName = String(name ?? "gate").toLowerCase()
  const hoverAttrs = opts.hoverKey
    ? ` data-regent-hover-key="${escapeAttr(opts.hoverKey)}" data-regent-hover-kind="marker"`
    : ""
  const intentAttrs = [
    opts.intent ? `data-intent="${escapeAttr(opts.intent)}"` : "",
    opts.groupRole ? `data-group-role="${escapeAttr(opts.groupRole)}"` : "",
    opts.clickTone ? `data-click-tone="${escapeAttr(opts.clickTone)}"` : "",
    opts.historyKey ? `data-history-key="${escapeAttr(opts.historyKey)}"` : "",
    opts.backTargetId ? `data-back-target-id="${escapeAttr(opts.backTargetId)}"` : "",
  ]
    .filter(Boolean)
    .join(" ")
  const innerTransform = opts.innerTransform ?? "translate(-12 -12) scale(0.375)"
  const interactive = opts.interactive !== false

  return `
  <g
    class="rg-sigil-marker rg-sigil-${escapeAttr(sigilName)}"
    data-regent-marker-id="${escapeAttr(opts.targetId)}"
    data-regent-target-id="${escapeAttr(opts.targetId)}"
    ${hoverAttrs}
    ${intentAttrs}
    ${interactive ? 'tabindex="0" role="button"' : 'aria-hidden="true"'}
    aria-label="${escapeAttr(accessibleLabel)}"
    style="color:${escapeAttr(color)}"
  >
    ${interactive ? '<rect x="-18" y="-18" width="36" height="36" fill="transparent" style="pointer-events:all" />' : ""}
    <g transform="${escapeAttr(innerTransform)}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      ${inner}
    </g>
    <title>${escapeText(accessibleLabel)}</title>
  </g>
  `
}
