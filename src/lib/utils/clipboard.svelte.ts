const CONFIRMATION_MS = 2000;

export function copier(confirmationMs = CONFIRMATION_MS) {
  let copied = $state(false);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  return {
    get copied() {
      return copied;
    },
    async copy(value: string) {
      try {
        await navigator.clipboard.writeText(value);
        copied = true;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => (copied = false), confirmationMs);
      } catch {
        // Clipboard unavailable
      }
    },
    destroy() {
      clearTimeout(resetTimer);
    },
  };
}
