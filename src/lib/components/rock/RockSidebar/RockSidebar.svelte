<script lang="ts">
  import { Button, Link } from "@canonical/svelte-ds-app-launchpad";
  import {
    FileIcon,
    GithubIcon,
    LinkIcon,
    OpenTerminalIcon,
    UserProfileIcon,
  } from "@canonical/svelte-icons";
  import type { Component } from "svelte";
  import { SmallCaps } from "$lib/components/ui/SmallCaps";
  import { getArchitectures } from "$lib/utils/rock";
  import type { RockSidebarProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds rock-sidebar";

  const DISCOURSE_HREF = "https://discourse.ubuntu.com/";

  const SOURCE_LABELS: Record<string, string> = {
    "upstream-source": "Upstream source",
    upstream: "Upstream source",
    source: "Rock source",
    "source-code": "Rock source",
    "rock-source": "Rock source",
    "rockcraft-yaml": "rockcraft.yaml",
    rockcraft: "rockcraft.yaml",
  };

  type LinkRow = { icon: Component; label: string; href: string };

  let { rock }: RockSidebarProps = $props();

  const meta = $derived(rock.metadata ?? {});
  const license = $derived(meta.license?.trim());

  const architectures = $derived(getArchitectures(rock));

  function isGithub(url: string): boolean {
    return /(^|\/\/|\.)github\.com\//.test(url);
  }
  function displayUrl(value: string): string {
    return value
      .replace(/^mailto:/, "")
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
  }
  function isEmail(value: string): boolean {
    return value.includes("@") && !value.includes("//");
  }
  function hrefFor(value: string): string {
    if (/^https?:\/\//.test(value) || value.startsWith("mailto:")) return value;
    if (isEmail(value)) return `mailto:${value}`;
    return value;
  }

  function pickLinks(keys: string[]): { key: string; url: string }[] {
    const links = meta.links ?? {};
    const out: { key: string; url: string }[] = [];
    for (const key of Object.keys(links)) {
      const normalized = key.toLowerCase().replace(/[\s_]+/g, "-");
      if (keys.includes(normalized)) {
        for (const url of links[key] ?? [])
          if (url) out.push({ key: normalized, url });
      }
    }
    return out;
  }

  function sourceIcon(key: string, url: string): Component {
    if (key.includes("rockcraft")) return FileIcon;
    if (key.includes("upstream")) return isGithub(url) ? GithubIcon : LinkIcon;
    return isGithub(url) ? GithubIcon : OpenTerminalIcon;
  }

  const sourceCode = $derived.by<LinkRow[]>(() => {
    const seen = new Set<string>();
    const out: LinkRow[] = [];
    for (const { key, url } of pickLinks(Object.keys(SOURCE_LABELS))) {
      if (seen.has(url)) continue;
      seen.add(url);
      out.push({
        icon: sourceIcon(key, url),
        label: SOURCE_LABELS[key] ?? displayUrl(url),
        href: url,
      });
    }
    return out;
  });

  function contactIcon(value: string, email: boolean): Component {
    if (email) return UserProfileIcon;
    return isGithub(value) ? GithubIcon : LinkIcon;
  }
  function contactLabel(value: string, email: boolean): string {
    if (email) return value;
    const segments = displayUrl(value).split("/").filter(Boolean);
    return segments.at(-1) ?? displayUrl(value);
  }

  const contacts = $derived.by<LinkRow[]>(() => {
    const values = [
      ...(meta.contact ? [meta.contact] : []),
      ...pickLinks(["contact"]).map((row) => row.url),
    ];
    const seen = new Set<string>();
    const out: LinkRow[] = [];
    for (const value of values) {
      if (seen.has(value)) continue;
      seen.add(value);
      const email = isEmail(value);
      out.push({
        icon: contactIcon(value, email),
        label: contactLabel(value, email),
        href: hrefFor(value),
      });
    }
    return out;
  });
</script>

{#snippet linkRow(item: LinkRow)}
  {@const Icon = item.icon}
  <li class="rock-sidebar__row">
    <Icon />
    <Link href={item.href} target="_blank" rel="noopener">{item.label}</Link>
  </li>
{/snippet}

<dl class={componentCssClassName}>
  {#if sourceCode.length}
    <div class="rock-sidebar__item">
      <dt><SmallCaps>Source code</SmallCaps></dt>
      <dd>
        <ul class="rock-sidebar__links">
          {#each sourceCode as item (item.href)}{@render linkRow(item)}{/each}
        </ul>
      </dd>
    </div>
  {/if}

  {#if architectures.length}
    <div class="rock-sidebar__item">
      <dt><SmallCaps>Architectures</SmallCaps></dt>
      <dd>{architectures.map((arch) => arch.toUpperCase()).join(", ")}</dd>
    </div>
  {/if}

  {#if license}
    <div class="rock-sidebar__item">
      <dt><SmallCaps>License</SmallCaps></dt>
      <dd>{license}</dd>
    </div>
  {/if}

  {#if contacts.length}
    <div class="rock-sidebar__item">
      <dt><SmallCaps>Contacts</SmallCaps></dt>
      <dd>
        <ul class="rock-sidebar__links">
          {#each contacts as item (item.href)}{@render linkRow(item)}{/each}
        </ul>
      </dd>
    </div>
  {/if}

  <div class="rock-sidebar__item rock-sidebar__discourse">
    <p class="rock-sidebar__discourse-text">
      Share your thoughts on this rock with the community on discourse.
    </p>
    <Button href={DISCOURSE_HREF} target="_blank" rel="noopener">
      Join the discussion
    </Button>
  </div>
</dl>
