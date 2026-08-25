function _deepFreeze<T extends object>(object: T, _refs: WeakSet<object>): T {
  if (_refs.has(object)) return object;
  _refs.add(object);

  // Retrieve the property names defined on object
  const propNames = Reflect.ownKeys(object);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name as keyof typeof object];

    if ((value && typeof value === "object") || typeof value === "function") {
      _deepFreeze(value, _refs);
    }
  }

  return Object.freeze(object);
}

/**
 * Recursively runs Object.freeze on an object and its non-primitive
 * properties.
 *
 * @param object - The object to deep-freeze
 * @returns The deep-frozen object
 */
export function deepFreeze<T extends object>(object: T): T {
  return _deepFreeze(object, new WeakSet());
}
