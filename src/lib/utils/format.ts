const SIZE_UNITS = ["B", "kB", "MB", "GB", "TB"] as const;
const SIZE_STEP = 1000;

export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= SIZE_STEP && unit < SIZE_UNITS.length - 1) {
    value /= SIZE_STEP;
    unit += 1;
  }

  return `${unit === 0 ? value : value.toFixed(2)} ${SIZE_UNITS[unit]}`;
}

/** Category names arrive lower-cased, so give each word a capital. */
export function formatCategory(name: string): string {
  return name.replace(/(?<=^|[\s\-/])[a-z]/g, (letter) => letter.toUpperCase());
}
