import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { JSDOM } from "jsdom";

import {
  COLOR_MODE_STORAGE_KEY,
  applyColorMode,
  mountColorModeToggle,
  resolveColorMode,
} from "./color_mode.ts";

function createWindow({
  stored,
  prefersDark = false,
  reducedMotion = false,
}: {
  stored?: string | null;
  prefersDark?: boolean;
  reducedMotion?: boolean;
}) {
  const storage = new Map<string, string>();

  if (stored) {
    storage.set(COLOR_MODE_STORAGE_KEY, stored);
  }

  return {
    localStorage: {
      getItem(key: string) {
        return storage.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        storage.set(key, value);
      },
    },
    matchMedia(query: string) {
      return {
        matches: query.includes("prefers-color-scheme")
          ? prefersDark
          : reducedMotion,
      };
    },
  };
}

describe("resolveColorMode", () => {
  it("follows system preference when there is no saved value", () => {
    assert.equal(resolveColorMode(createWindow({ prefersDark: true })), "dark");
    assert.equal(resolveColorMode(createWindow({ prefersDark: false })), "light");
  });

  it("prefers saved mode over system preference", () => {
    assert.equal(
      resolveColorMode(createWindow({ stored: "light", prefersDark: true })),
      "light",
    );

    assert.equal(
      resolveColorMode(createWindow({ stored: "dark", prefersDark: false })),
      "dark",
    );
  });
});

describe("mountColorModeToggle", () => {
  it("updates the document attribute and local storage when the footer voxel toggle is pressed", () => {
    const dom = new JSDOM(
      `<div id="root">
        <button data-color-mode-cycle aria-pressed="false">Voxel</button>
      </div>`,
      { url: "https://regents.sh" },
    );

    const { window } = dom;
    Object.defineProperty(window, "matchMedia", {
      value: (query: string) => ({
        matches: query.includes("prefers-reduced-motion") ? true : false,
      }),
      configurable: true,
    });

    applyColorMode("light", window.document);

    const root = window.document.getElementById("root");
    assert.ok(root);

    const cleanup = mountColorModeToggle(root);
    const toggleButton = root.querySelector<HTMLButtonElement>("[data-color-mode-cycle]");
    assert.ok(toggleButton);

    toggleButton.click();

    assert.equal(window.document.documentElement.dataset.colorMode, "dark");
    assert.equal(window.document.body.dataset.colorMode, "dark");
    assert.equal(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY), "dark");

    cleanup();
  });
});
