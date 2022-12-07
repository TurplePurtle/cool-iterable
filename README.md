# Cool Iterable

## Usage

```ts
import { from } from "https://deno.land/x/cool_iterable/mod.ts";

from([1, 2, 3, 4])
  .map(x => x * x)
  .drop(1)
  .take(2)
  .toArray(); // => [4, 9]
```
