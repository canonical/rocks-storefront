export default function debounced<T>(getter: () => T, delay: number): () => T {
  let value = $state<T>(getter());
  let timer: ReturnType<typeof setTimeout>;

  $effect(() => {
    const newValue = getter(); // read here to subscribe to it
    clearTimeout(timer);
    timer = setTimeout(() => (value = newValue), delay);
    return () => clearTimeout(timer);
  });

  return () => value;
}
