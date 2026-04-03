import type { JSX } from "react";

import { classNames } from "./utils.ts";

export function ShaderAttribution({
  className,
  linkClassName,
}: {
  className?: string;
  linkClassName?: string;
}): JSX.Element {
  return (
    <p className={classNames("text-[10px] text-[color:var(--muted-foreground)]", className)}>
      Artwork by <span className="text-[color:var(--foreground)]/80">@xordev</span> ·{" "}
      <a
        href="https://xordev.com"
        target="_blank"
        rel="noreferrer"
        className={classNames(
          "underline decoration-[color:var(--border)] underline-offset-2 transition hover:text-[color:var(--foreground)]",
          linkClassName,
        )}
      >
        xordev.com
      </a>
    </p>
  );
}
