# Resource-Monad

Resource Monad is a simple implementation of a monadic style to resource handling.

```ts
import resource from "resource-monad"

const log: resource.Resource<void> = (s: string) => {
  return resource.make(
    async () => {console.log("Starting " + s)},
    async () => { console.log("Shutdown " + s)}
  )
}

const display = log("1")
  .flatMap((_) => log("2"))
  .use(async (a: void) => { console.log("Using")})

display()
// Starting 1
// Starting 2
// Using
// Shutdown 2
// Shutdown 1
```

As you can see from the above. First resource are used, then using acts as an anchor point, and finally resources are cleaned up in the reverse order that they are required.