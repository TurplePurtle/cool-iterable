# Cool Iterable

Type-safe, lazy Iterable library.

## Usage

```ts
import { from } from "https://deno.land/x/cool_iterable/mod.ts";

from([1, 2, 3, 4])
  .map(x => x * x)
  .drop(1)
  .take(2)
  .toArray(); // => [4, 9]
```

## Functions

- `drop`
- `combine` (similar to zip, but takes a mapping function to combine each tuple)
- `flatMap`
- `forEach` (evaluates the iterable, looping through each value)
- `from` (creates a new lazy iterable)
- `generate` (generates number starting from 0)
- `map`
- `repeat` (creates an iterable that repeatedly outputs the given value)
- `take`
- `toArray` (evaluates the iterable, putting the values in a new Array)
- `zip`
