import * as React from "react";

import { RegentTokenCard } from "./RegentTokenCard.tsx";
import { ShaderCanvas } from "./ShaderCanvas.tsx";
import { buildShaderFragmentSource, getShaderById } from "./lib/catalog.ts";
import type { TokenCardManifestEntry } from "./token_card_types.ts";

export function TokenCardPage({
  entry,
}: {
  entry: TokenCardManifestEntry;
}) {
  const shader = getShaderById(entry.shaderId);

  if (!shader) {
    return (
      <main className="rtc-page">
        <section className="rtc-stage" aria-label="Regents Club token card">
          <RegentTokenCard
            entry={entry}
            interactive={false}
            media={
              <div className="flex h-full items-center justify-center bg-black text-center text-xs uppercase tracking-[0.24em] text-white/70">
                Unknown shader
              </div>
            }
          />
        </section>
      </main>
    );
  }

  const renderableShader = {
    ...shader,
    fragmentSource: buildShaderFragmentSource(shader, entry.defineValues),
  };

  return (
    <main className="rtc-page">
      <section className="rtc-stage" aria-label={entry.name}>
        <RegentTokenCard
          entry={entry}
          media={
            <ShaderCanvas
              shader={renderableShader}
              className="h-full w-full"
              ariaLabel={`${entry.name} animated shader card`}
              devicePixelRatioCap={1.2}
              runtimeMode="always"
            />
          }
        />
      </section>
    </main>
  );
}
