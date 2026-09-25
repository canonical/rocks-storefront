import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import CopyableCode from "./CopyableCode.svelte";

const LONG_VALUE = "rocks.pkg.store/ubuntu/valkey:9.1-26.04_edge";

describe("CopyableCode.svelte", () => {
  it("scrolls a command too long to fit instead of wrapping it", async () => {
    render(CopyableCode, { value: LONG_VALUE, style: "inline-size: 120px" });

    const code = page.getByText(LONG_VALUE).element();

    expect(getComputedStyle(code).whiteSpace).toBe("pre");
    expect(code.scrollWidth).toBeGreaterThan(code.clientWidth);
  });
});
