import { expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { prometheusRock } from "$lib/data/mock-rock";
import RockHero from "./RockHero.svelte";

test("renders the rock name, publisher and category", async () => {
  const screen = render(RockHero, { props: { rock: prometheusRock } });
  await expect
    .element(screen.getByRole("heading", { level: 1, name: "Prometheus" }))
    .toBeInTheDocument();
  await expect.element(screen.getByText("Canonical")).toBeInTheDocument();
  await expect.element(screen.getByText("Observability")).toBeInTheDocument();
});

test("shows the verified badge for a verified publisher", async () => {
  const { container } = render(RockHero, { props: { rock: prometheusRock } });
  expect(container.querySelector(".p-icon--certification")).not.toBeNull();
});

test("falls back to the missing-icon asset when the rock has no iconUrl", async () => {
  const { container } = render(RockHero, {
    props: { rock: { ...prometheusRock, iconUrl: "" } },
  });
  const img = container.querySelector<HTMLImageElement>("img.rock-hero__icon");
  expect(img?.src).toContain("snapcraft-missing-icon.svg");
});
