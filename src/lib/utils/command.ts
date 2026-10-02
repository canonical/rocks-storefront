import type { RockInfoResponse } from "$lib/server/api/types";
import { findChannel, getChannelCombinations, getRisks } from "./rock";

export interface Tool {
  id: string;
  label: string;
  command: string;
  referencePrefix: string;
  platformFlag: (architecture: string) => string;
}

export const TOOLS: Tool[] = [
  {
    id: "docker",
    label: "Docker",
    command: "docker pull",
    referencePrefix: "",
    platformFlag: (architecture) => `--platform linux/${architecture}`,
  },
  {
    id: "podman",
    label: "Podman",
    command: "podman pull",
    referencePrefix: "",
    platformFlag: (architecture) => `--platform linux/${architecture}`,
  },
  {
    id: "skopeo",
    label: "Skopeo",
    command: "skopeo inspect",
    referencePrefix: "docker://",
    platformFlag: (architecture) => `--override-arch ${architecture}`,
  },
];

export const ANY = "Any";

/**
 * The store API names architectures the Debian way, the registry the OCI way.
 * The only disagreement among the architectures rocks are published for is
 * ppc64el, which the registry calls ppc64le.
 */
const OCI_ARCHITECTURES: Record<string, string> = {
  ppc64el: "ppc64le",
};

export function ociArchitecture(architecture: string): string {
  return OCI_ARCHITECTURES[architecture] ?? architecture;
}

export interface CommandSelection {
  tool: string;
  version: string;
  architecture: string;
  risk: string;
}

/** The channel tag a selection points at, as the channel map names it. */
export function getChannelTag(
  rock: RockInfoResponse,
  version: string,
  risk: string,
): string {
  return risk ? (findChannel(rock, version, risk)?.name ?? "") : "";
}

/**
 * Builds the command that fetches a rock.
 */
export function buildCommand(
  rock: RockInfoResponse,
  registry: string,
  selection: CommandSelection,
): string {
  const tool = TOOLS.find((candidate) => candidate.id === selection.tool);
  if (!tool || !registry) return "";

  const track = findChannel(rock, selection.version, selection.risk)?.track;
  const reference =
    track && selection.risk
      ? `${registry}:${track}_${selection.risk}`
      : registry;

  const flag =
    selection.architecture && selection.architecture !== ANY
      ? tool.platformFlag(ociArchitecture(selection.architecture))
      : "";

  return [tool.command, flag, tool.referencePrefix + reference]
    .filter(Boolean)
    .join(" ");
}

export interface CommandOptions {
  versions: string[];
  architectures: string[];
  risks: string[];
}

function distinct(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

/**
 * What each dropdown may offer, given the other choices.
 *
 * Every option comes from a channel the store actually publishes, and each
 * field ignores its own value when narrowing, so picking a version still leaves
 * every other version reachable.
 */
export function getCommandOptions(
  rock: RockInfoResponse,
  selection: Pick<CommandSelection, "version" | "architecture" | "risk">,
): CommandOptions {
  const combinations = getChannelCombinations(rock);
  const matches = (
    combination: (typeof combinations)[number],
    ignore: keyof CommandOptions,
  ) =>
    (ignore === "versions" ||
      !selection.version ||
      combination.version === selection.version) &&
    (ignore === "architectures" ||
      selection.architecture === ANY ||
      !selection.architecture ||
      combination.architecture === selection.architecture) &&
    (ignore === "risks" ||
      !selection.risk ||
      combination.risk === selection.risk);

  return {
    versions: distinct(
      combinations.filter((c) => matches(c, "versions")).map((c) => c.version),
    ),
    architectures: distinct(
      combinations
        .filter((c) => matches(c, "architectures"))
        .map((c) => c.architecture),
    ),
    risks: getRisks(rock).filter((risk) =>
      combinations.some((c) => c.risk === risk && matches(c, "risks")),
    ),
  };
}
