import { assertEquals } from "https://deno.land/std@0.166.0/testing/asserts.ts";
import * as cool from "./cool-iterable.ts";

function assertIterableEquals(a: Iterable<unknown>, b: Iterable<unknown>) {
  const iterA = a[Symbol.iterator]();
  const iterB = b[Symbol.iterator]();
  for (let i = 0;; i++) {
    const itemA = iterA.next();
    const itemB = iterB.next();
    itemA.done = !!itemA.done;
    itemB.done = !!itemB.done;
    try {
      assertEquals(itemA, itemB);
    } catch (e) {
      if (typeof e.message === "string") {
        e.message += `(at index ${i})\n`;
      }
      throw e;
    }
    if (itemA.done || itemB.done) break;
  }
}

Deno.test("from", () => {
  const it = cool.from([1, 2, 3]);
  assertIterableEquals(it, [1, 2, 3]);
});

Deno.test("repeat", () => {
  const it = cool.repeat(42).take(3);
  assertIterableEquals(it, [42, 42, 42]);
});

Deno.test("generate", () => {
  const it = cool.generate().take(3);
  assertIterableEquals(it, [0, 1, 2]);
});

Deno.test("map", () => {
  const it = cool.from([1, 2, 3]).map((x) => x * x);
  assertIterableEquals(it, [1, 4, 9]);
});

Deno.test("flatMap", () => {
  const it = cool.from([1, 2, 3]).flatMap((x) => [x, x]);
  assertIterableEquals(it, [1, 1, 2, 2, 3, 3]);
});

Deno.test("zip", () => {
  const it = cool.zip([1, 2, 3], [4, 5], [6, 7, 8, 9]);
  assertIterableEquals(it, [1, 4, 6, 2, 5, 7]);
});

Deno.test("combine", () => {
  const it = cool.combine(
    (key, value) => `${key}: ${value}`,
    ["a", "b", "c"],
    [1, 2],
  );
  assertIterableEquals(it, ["a: 1", "b: 2"]);
});

Deno.test("drop", () => {
  const it = cool.from([1, 2, 3, 4, 5]).drop(3);
  assertIterableEquals(it, [4, 5]);
});

Deno.test("take", () => {
  const it = cool.from([1, 2, 3]).take(2);
  assertIterableEquals(it, [1, 2]);
});

Deno.test("join", () => {
  const it = cool.from([1, 2, 3]).join(0);
  assertIterableEquals(it, [1, 0, 2, 0, 3]);
});
