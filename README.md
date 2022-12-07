# Cool Iterable

## Usage

```ts
import { from } from "./cool-iterable.ts";

from([1, 2, 3, 4])
  .map(x => x * x)
  .drop(1)
  .take(2)
  .toArray(); // => [4, 9]
```
