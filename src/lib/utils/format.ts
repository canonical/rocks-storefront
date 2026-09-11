const SIZE_UNITS = ["B", "kB", "MB", "GB", "TB"] as const;
const SIZE_STEP = 1000;
const DIGEST_CHARS = 12;

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "—";

  let value = bytes;
  let unit = 0;
  while (value >= SIZE_STEP && unit < SIZE_UNITS.length - 1) {
    value /= SIZE_STEP;
    unit += 1;
  }

  return `${unit === 0 ? value : value.toFixed(2)} ${SIZE_UNITS[unit]}`;
}

export function truncateDigest(digest: string): string {
  return digest.length > DIGEST_CHARS
    ? `${digest.slice(0, DIGEST_CHARS)}…`
    : digest;
}
