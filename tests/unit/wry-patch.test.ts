import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// Guardrail: the macOS window.open OAuth popup fix ships as a wry [patch] in
// src-tauri/Cargo.toml. A [patch] only applies when the patched crate's version
// matches the version the dependency tree resolves to; a `cargo update` that
// bumps wry silently drops the patch (the crate falls back to crates.io) and
// the fix disappears with no error -- and worse, the macOS Allow path then hits
// the #1194 duplicate-handler crash. This test fails loudly when that happens.
describe("wry patch stays applied", () => {
  const cargoLock = fs.readFileSync(
    path.join(process.cwd(), "src-tauri/Cargo.lock"),
    "utf-8",
  );

  const block = cargoLock
    .split("[[package]]")
    .find((b) => /^\s*name = "wry"\s*$/m.test(b));

  it("has a wry entry in Cargo.lock", () => {
    expect(block).toBeDefined();
  });

  it("resolves wry to the patch, not crates.io", () => {
    // A registry-sourced crate has a `source = "registry+..."` line; the git
    // patch has a `source = "git+..."` line. If wry regains a *registry*
    // source, the patch stopped applying -- re-align the fork's wry version
    // with the one Cargo.lock resolves to.
    expect(block).not.toMatch(/source = "registry\+/);
  });
});
