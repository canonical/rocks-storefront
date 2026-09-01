export type Debounced<T> = {
  (): T;
  readonly pending: () => boolean;
};

export default function debounced<T>(
  getter: () => T,
  delay: number,
): Debounced<T> {
  let value = $state<T>(getter());
  const pending = $derived(getter() !== value);
  let timer: ReturnType<typeof setTimeout>;

  $effect(() => {
    const newValue = getter(); // read here to subscribe to it
    clearTimeout(timer);
    timer = setTimeout(() => (value = newValue), delay);
    return () => clearTimeout(timer);
  });

  return new Proxy((() => value) as Debounced<T>, {
    get(target, prop, receiver) {
      if (prop === "pending") return () => pending;
      return Reflect.get(target, prop, receiver);
    },
  });
}
