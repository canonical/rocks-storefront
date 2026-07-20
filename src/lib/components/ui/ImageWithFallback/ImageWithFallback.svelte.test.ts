import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import ImageWithFallback from "./ImageWithFallback.svelte";

const VALID =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const BROKEN = "data:image/gif;base64,!!!not-an-image";
const ALSO_BROKEN = "data:image/gif;base64,!!!also-not-an-image";

function imageIn(container: HTMLElement): HTMLImageElement {
  const img = container.querySelector("img");
  if (!img) throw new Error("no img rendered");
  return img;
}

describe("ImageWithFallback.svelte", () => {
  it("renders the given source and alt text", async () => {
    const { container } = render(ImageWithFallback, {
      src: VALID,
      fallback: VALID,
      alt: "a rock",
    });

    const img = imageIn(container);

    expect(img.getAttribute("src")).toBe(VALID);
    expect(img.getAttribute("alt")).toBe("a rock");
  });

  it("swaps to the fallback when the source fails to load", async () => {
    const { container } = render(ImageWithFallback, {
      src: BROKEN,
      fallback: VALID,
      alt: "a rock",
    });

    await vi.waitFor(() =>
      expect(imageIn(container).getAttribute("src")).toBe(VALID),
    );
  });

  it("forwards the caller's onerror handler", async () => {
    const onerror = vi.fn();
    render(ImageWithFallback, {
      src: BROKEN,
      fallback: VALID,
      alt: "a rock",
      onerror,
    });

    await vi.waitFor(() => expect(onerror).toHaveBeenCalled());
  });

  it("stops at the fallback when the fallback also fails", async () => {
    const onerror = vi.fn();
    const { container } = render(ImageWithFallback, {
      src: BROKEN,
      fallback: ALSO_BROKEN,
      alt: "a rock",
      onerror,
    });

    await vi.waitFor(() => expect(onerror).toHaveBeenCalledTimes(2));

    expect(imageIn(container).getAttribute("src")).toBe(ALSO_BROKEN);
  });

  it("returns to the new source when the src prop changes after a fallback", async () => {
    const { container, rerender } = render(ImageWithFallback, {
      src: BROKEN,
      fallback: VALID,
      alt: "a rock",
    });

    await vi.waitFor(() =>
      expect(imageIn(container).getAttribute("src")).toBe(VALID),
    );

    await rerender({ src: ALSO_BROKEN, fallback: VALID, alt: "a rock" });

    expect(imageIn(container).getAttribute("src")).toBe(ALSO_BROKEN);
  });

  it("passes through additional attributes", async () => {
    const { container } = render(ImageWithFallback, {
      src: VALID,
      fallback: VALID,
      alt: "a rock",
      title: "Rock logo",
    });

    expect(imageIn(container).getAttribute("title")).toBe("Rock logo");
  });
});
