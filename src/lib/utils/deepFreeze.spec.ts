import { describe, expect, it } from "vitest";
import { deepFreeze } from "./deepFreeze";

describe("deepFreeze", () => {
  it("returns the same object reference and freezes nested objects", () => {
    const value = {
      name: "rocks",
      nested: { count: 2 },
      list: [{ id: 1 }],
    };

    const frozen = deepFreeze(value);

    expect(frozen).toBe(value);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.nested)).toBe(true);
    expect(Object.isFrozen(value.list)).toBe(true);
    expect(Object.isFrozen(value.list[0])).toBe(true);
  });

  it("handles circular references without infinite recursion", () => {
    type Node = {
      name: string;
      self?: Node;
      peer?: Node;
    };

    const a: Node = { name: "a" };
    const b: Node = { name: "b" };

    a.self = a;
    a.peer = b;
    b.peer = a;

    expect(() => deepFreeze(a)).not.toThrow();

    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(b)).toBe(true);
    expect(Object.isFrozen(a.self as object)).toBe(true);
    expect(Object.isFrozen(a.peer as object)).toBe(true);
    expect(Object.isFrozen(b.peer as object)).toBe(true);
  });

  it("freezes symbol-keyed object properties", () => {
    const sym = Symbol("hidden");
    const value: { [key: symbol]: { inner: number } } = {
      [sym]: { inner: 1 },
    };

    deepFreeze(value);

    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value[sym])).toBe(true);
  });

  it("throws when mutating a frozen nested property", () => {
    const value = {
      nested: { count: 2 },
    };

    deepFreeze(value);

    expect(() => {
      value.nested.count = 3;
    }).toThrow(TypeError);
  });
});
