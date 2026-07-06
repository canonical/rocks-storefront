const RELATIVE_TIME_FORMAT = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

export function formatRelativeTime(
  iso: string,
  now: Date = new Date(),
): string {
  const diffSec = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);

  for (const [unit, secondsInUnit] of UNITS) {
    if (Math.abs(diffSec) >= secondsInUnit) {
      return RELATIVE_TIME_FORMAT.format(
        -Math.round(diffSec / secondsInUnit),
        unit,
      );
    }
  }
  return "just now";
}
