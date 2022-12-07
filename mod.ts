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
    private its: MapToIterable<T>
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
