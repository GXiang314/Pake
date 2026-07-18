import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const windowRs = path.join(process.cwd(), "src-tauri/src/app/window.rs");

describe("macOS new-window handling (window.open OAuth popups)", () => {
  it("returns Allow on macOS so WebKit wires window.opener, Create elsewhere", () => {
    const source = fs.readFileSync(windowRs, "utf-8");

    const blockStart = source.indexOf("if window_config.new_window");
    const blockEnd = source.indexOf("// Add initialization scripts", blockStart);
    expect(blockStart).toBeGreaterThan(-1);
    expect(blockEnd).toBeGreaterThan(blockStart);
    const block = source.slice(blockStart, blockEnd);

    // macOS must return Allow: only a WebKit-created popup gets a live
    // window.opener, which OAuth postMessage logins require. A Create popup
    // has window.opener == null and white-screens. The #1194 duplicate-handler
    // crash Allow would otherwise cause is prevented in the wry patch, which
    // strips the opener config's handlers before creating the popup.
    expect(block).toMatch(
      /#\[cfg\(target_os = "macos"\)\][\s\S]*NewWindowResponse::Allow/,
    );
    // Other platforms keep the fully integrated Create window.
    expect(block).toMatch(
      /#\[cfg\(not\(target_os = "macos"\)\)\][\s\S]*NewWindowResponse::Create/,
    );
  });
});
