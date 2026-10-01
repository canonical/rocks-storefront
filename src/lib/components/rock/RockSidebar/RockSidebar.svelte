<script lang="ts">
  import { Button, Link } from "@canonical/svelte-ds-app-launchpad";
  import {
    BugIcon,
    CodeIcon,
    GithubIcon,
    LinkIcon,
    OpenTerminalIcon,
    UserProfileIcon,
  } from "@canonical/svelte-icons";
  import type { Component } from "svelte";
  import { SmallCaps } from "$lib/components/ui/SmallCaps";
  import { githubRepo } from "$lib/utils/github";
  import { launchpadBugUrl } from "$lib/utils/launchpad";
  import { getArchitectures, getBases } from "$lib/utils/rock";
  import type { RockSidebarProps } from "./types.js";
  import "./styles.css";

  const componentCssClassName = "ds rock-sidebar";

  const DISCOURSE_HREF = "https://discourse.ubuntu.com/c/project/rocks/117";

  const SOURCE_LABELS: Record<string, string> = {
    "upstream-source": "Upstream source",
    upstream: "Upstream source",
    source: "Rock source",
    "source-code": "Rock source",
    "rock-source": "Rock source",
    "rockcraft-yaml": "rockcraft.yaml",
    rockcraft: "rockcraft.yaml",
  };

  type LinkRow = {
    key: string;
    icon: Component;
    label: string;
    href: string | null;
  };

  let { rock, rockcraftUrl }: RockSidebarProps = $props();

  const meta = $derived(rock.metadata ?? {});
  const license = $derived(meta.license?.trim());

  const architectures = $derived(getArchitectures(rock));
  const bases = $derived(getBases(rock));

  function isGithub(url: string): boolean {
    return /(^|\/\/|\.)github\.com\//.test(url);
  }
  function displayUrl(value: string): string {
    return value
      .replace(/^(mailto|tel):/, "")
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
  }
  // A chat handle such as `@team:matrix.example.com` also contains an `@`, so
  // require something before it and no scheme separator anywhere.
  function isEmail(value: string): boolean {
    return /^[^\s:@]+@[^\s:@]+\.[^\s:@]+$/.test(value);
  }
  // Returns null for a value there is nowhere to send: a contact may be a
  // handle or a username, which reads fine but is not a destination.
  function hrefFor(value: string): string | null {
    const trimmed = value.trim();
    if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
    // Block dangerous/unknown schemes (javascript:, data:, …) before falling
    // through to bare-email handling, since metadata is untrusted.
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//"))
      return "#";
    if (isEmail(trimmed)) return `mailto:${trimmed}`;
    return null;
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
    if (key.includes("rockcraft")) return CodeIcon;
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
        key: url,
        icon: sourceIcon(key, url),
        label: SOURCE_LABELS[key] ?? displayUrl(url),
        href: hrefFor(url),
      });
    }

    if (rockcraftUrl && !seen.has(rockcraftUrl)) {
      out.push({
        key: rockcraftUrl,
        icon: CodeIcon,
        label: "rockcraft.yaml",
        href: rockcraftUrl,
      });
    }

    return out;
  });

  function contactLabel(value: string): string {
    return displayUrl(value).split("/").filter(Boolean).at(-1) ?? "";
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
      out.push({
        key: value,
        icon: UserProfileIcon,
        label: contactLabel(value),
        href: hrefFor(value),
      });
    }

    const published = pickLinks(["issues", "issue", "bug-tracker", "bugs"])
      .map((row) => hrefFor(row.url))
      .find((href) => href && href !== "#");
    const upstreams = pickLinks(["upstream", "upstream-source"]).map(
      (row) => row.url,
    );
    const repo = upstreams.map(githubRepo).find(Boolean);
    const inferred = repo
      ? `https://github.com/${repo}/issues/new`
      : upstreams.map(launchpadBugUrl).find(Boolean);
    const bugHref = published ?? inferred;

    if (bugHref && !out.some((row) => row.href === bugHref)) {
      out.push({
        key: "submit-a-bug",
        icon: BugIcon,
        label: "Submit a bug",
        href: bugHref,
      });
    }

    return out;
  });
</script>

{#snippet linkRow(item: LinkRow)}
  {@const Icon = item.icon}
  <li class="rock-sidebar__row">
    <Icon />
    {#if item.href}
      <Link href={item.href} target="_blank" rel="noopener">{item.label}</Link>
    {:else}
      <span>{item.label}</span>
    {/if}
  </li>
{/snippet}

<dl class={componentCssClassName}>
  {#if sourceCode.length}
    <div class="rock-sidebar__item">
      <dt><SmallCaps>Source code</SmallCaps></dt>
      <dd>
        <ul class="rock-sidebar__links">
          {#each sourceCode as item (item.key)}{@render linkRow(item)}{/each}
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

  {#if bases.length}
    <div class="rock-sidebar__item">
      <dt><SmallCaps>Base</SmallCaps></dt>
      <dd>{bases.join(", ")}</dd>
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
          {#each contacts as item (item.key)}{@render linkRow(item)}{/each}
        </ul>
      </dd>
    </div>
  {/if}

  <div class="rock-sidebar__item rock-sidebar__discourse">
    <p class="rock-sidebar__discourse-text">
      Share your thoughts on this rock with the community on Discourse.
    </p>
    <Button href={DISCOURSE_HREF} target="_blank" rel="noopener">
      Join the discussion
    </Button>
  </div>
</dl>
