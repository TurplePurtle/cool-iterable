type MapToIterable<T> = { [K in keyof T]: Iterable<T[K]> };
type Tuple = readonly unknown[];

export function from<T>(it: Iterable<T>) {
  return new DelegatingIterable<T>(it);
}

export function repeat<T>(value: T) {
  return new RepeatIterable(value);
}

export function generate() {
  return new GenerateIterable();
}

export function zip<T>(...iterables: Iterable<T>[]) {
  return new ZipIterable(iterables);
}

export function combine<T extends Tuple, R>(
  f: (...args: [...T]) => R,
  ...its: MapToIterable<T>
) {
  return new CombineIterable(f, its);
}

export abstract class CoolIterable<T> implements Iterable<T> {
  abstract [Symbol.iterator](): Iterator<T>;

  static from = from;
  static zip = zip;
  static combine = combine;

  toString(): string {
    let r = "";
    for (const val of this) r += val;
    return r;
  }

  toArray(): T[] {
    return [...this];
  }

  forEach(f: (x: T) => void) {
    for (const val of this) f(val);
  }

  map<R>(f: (x: T) => R): MapIterable<T, R> {
    return new MapIterable(this, f);
  }

  flatMap<R>(f: (x: T) => Iterable<R>): FlatMapIterable<T, R> {
    return new FlatMapIterable(this, f);
  }

  drop(n: number) {
    return new DropIterable(this, n);
  }

  take(n: number) {
    return new TakeIterable(this, n);
  }

  join(sep: T) {
    return zip(repeat(sep), this).drop(1);
  }
}

function iteratorOf<T>(it: Iterable<T>) {
  return it[Symbol.iterator]();
}

class DelegatingIterable<T> extends CoolIterable<T> {
  constructor(private iterable: Iterable<T>) {
    super();
  }
  *[Symbol.iterator]() {
    yield* this.iterable;
  }
}

class RepeatIterable<T> extends CoolIterable<T> {
  constructor(private value: T) {
    super();
  }
  *[Symbol.iterator]() {
    while (true) yield this.value;
  }
}

class GenerateIterable extends CoolIterable<number> {
  constructor() {
    super();
  }
  *[Symbol.iterator]() {
    let i = 0;
    while (true) yield i++;
  }
}

export function range(start: number, end: number, step = 1) {
  return new RangeIterable(start, end, step);
}

class RangeIterable extends CoolIterable<number> {
  constructor(
    readonly start: number,
    readonly end: number,
    readonly step: number,
  ) {
    super();
  }
  *[Symbol.iterator]() {
    for (let i = this.start; i < this.end; i += this.step) yield i;
  }
}

class MapIterable<T, R> extends CoolIterable<R> {
  constructor(private it: Iterable<T>, private f: (x: T) => R) {
    super();
  }
  *[Symbol.iterator]() {
    for (const val of this.it) yield this.f(val);
  }
}

class FlatMapIterable<T, R> extends CoolIterable<R> {
  constructor(private it: Iterable<T>, private f: (x: T) => Iterable<R>) {
    super();
  }
  *[Symbol.iterator]() {
    for (const val of this.it) yield* this.f(val);
  }
}

class ZipIterable<T> extends CoolIterable<T> {
  constructor(private its: Iterable<T>[]) {
    super();
  }
  *[Symbol.iterator]() {
    const iterators = this.its.map(iteratorOf);
    const values: T[] = [];
    while (true) {
      for (let i = 0; i < this.its.length; i++) {
        const item = iterators[i].next();
        if (item.done) return;
        values[i] = item.value;
      }
      yield* values;
    }
  }
}

class CombineIterable<T extends Tuple, R> extends CoolIterable<R> {
  constructor(
    private f: (...args: [...T]) => R,
    private its: MapToIterable<T>,
  ) {
    super();
  }
  *[Symbol.iterator]() {
    const iterators = this.its.map(iteratorOf);
    const values: [...T] = [] as unknown as [...T];
    while (true) {
      for (let i = 0; i < this.its.length; i++) {
        const item = iterators[i].next();
        if (item.done) return;
        values[i] = item.value;
      }
      yield this.f(...values);
    }
  }
}

class DropIterable<T> extends CoolIterable<T> {
  constructor(private it: Iterable<T>, private n: number) {
    super();
  }
  *[Symbol.iterator]() {
    let n = this.n;
    for (const val of this.it) if (n-- <= 0) yield val;
  }
}

class TakeIterable<T> extends CoolIterable<T> {
  constructor(private it: Iterable<T>, private n: number) {
    super();
  }
  *[Symbol.iterator]() {
    let n = this.n;
    for (const val of this.it) {
      if (n-- <= 0) break;
      yield val;
    }
  }
}

export function permute<T extends Tuple, R>(
  f: (...args: [...T]) => R,
  ...its: MapToIterable<T>
) {
  return new PermuteIterable(f, its);
}

class PermuteIterable<T extends Tuple, R> extends CoolIterable<R> {
  constructor(
    private f: (...args: [...T]) => R,
    private its: MapToIterable<T>,
  ) {
    super();
  }
  *[Symbol.iterator]() {
    const len = this.its.length;
    const iterators = this.its.map(iteratorOf);
    const done: boolean[] = [];
    const values: [...T] = [] as unknown as [...T];

    // Initialize first value
    for (let i = 0; i < len; i++) {
      const next = iterators[i].next();
      // One of the iterables was empty so there's nothing to do.
      if (next.done) return [];
      done[i] = false;
      values[i] = next.value;
    }

    yield this.f.apply(null, values);

    while (true) {
      const next = iterators[len - 1].next();
      done[len - 1] = next.done === true;
      values[len - 1] = next.value;
      for (let i = len - 1; done[i]; i--) {
        if (i === 0) return;
        iterators[i] = iteratorOf(this.its[i]);
        {
          const next = iterators[i].next();
          done[i] = next.done === true;
          values[i] = next.value;
        }
        {
          const next = iterators[i - 1].next();
          done[i - 1] = next.done === true;
          values[i - 1] = next.value;
        }
      }
      yield this.f.apply(null, values);
    }
  }
}
