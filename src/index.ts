


type ExitCase = 'Success' | Error

class Resource<A>{
  readonly allocate: () => Promise<{value: A, shutdown: (exitCase: ExitCase) => Promise<void>}>

  constructor (allocate: () => Promise<{value: A, shutdown: (exitCase: ExitCase) => Promise<void>}>){
    this.allocate = allocate
  }

  public flatMap<B>(f: (a: A) => Resource<B>): Resource<B> {
    return flatMapI(this, f)
  }

  public evalMap<B>(f: (a: A) => Promise<B>): Resource<B> {
    return evalMapI(this, f)
  }

  public map<B>(f: (a: A) => B): Resource<B> {
    return this.flatMap((a: A) => pure(f(a)))
  }

  public use<B>(f: (a: A) => Promise<B>){
    return useI(this, f)
  }
}

function makeCase<A>(
  build: () => Promise<A>,
  onComplete: (a: A) => Promise<void>,
  onError: (a: A, err: Error) => Promise<void>
): Resource<A> {
  return new Resource(() => build().then(a => { return {
    value: a,
    shutdown: (exitCase: ExitCase) => {
      if (exitCase === 'Success') return onComplete(a)
      else return onError(a, exitCase)
    }
  }}))
}

function make<A>(
  build: () => Promise<A>,
  shutdown: (a: A) => Promise<void>
): Resource<A> {
  return makeCase(
    build,
    (a: A) => shutdown(a),
    (a: A, b) => shutdown(a)
  )
}

function pure<A>(a: A): Resource<A> {
  return make(async () => {return a}, async () => {})
}

function promise<A>(f: () => Promise<A>): Resource<A>{
  return make(f, async () => {})
}
function flatMapI<A, B>(resource: Resource<A>, f: (a: A) => Resource<B>): Resource<B> {
  const allocate: () => Promise<{value: B, shutdown: (exitCase: ExitCase) => Promise<void>}> = async () => {
    const allocated1 = await resource.allocate()
    const allocated2 = await f(allocated1.value).allocate()
    return {
      value: allocated2.value,
      shutdown:  async  (exitCase: ExitCase) => {
        await allocated2.shutdown(exitCase)
        await allocated1.shutdown(exitCase)
      }
    }
  }
  return new Resource(allocate)
}

function evalMapI<A, B>(resource: Resource<A>, f: (a: A) => Promise<B>): Resource<B> {
  const allocate: () => Promise<{value: B, shutdown: (exitCase: ExitCase) => Promise<void>}> = async () => {
    const {
      value,
      shutdown
    } = await resource.allocate()
    const b = await f(value)
    return {
      value: b,
      shutdown
    }
  }
  return new Resource(allocate)
}

// TODO: Stack Safety?
function useI<A, B> (resource: Resource<A>, f: (a: A) => Promise<B>): () => Promise<B>{
  return async () => {
    const {
      value,
      shutdown
    } = await resource.allocate()
    try {
      const x = await f(value)
      return x
    } catch(e) {
      await shutdown(e)
    } finally {
      await shutdown('Success')
    }
  }
}

// Move to tests
// const log = (s: string) => make(async () => {console.log("Starting " + s)}, async () => { console.log("Shutdown " + s)})

// log("1")
// .flatMap((_) => log("2"))
// .use(async (a: void) => { console.log("Using")})()


export default {
  Resource,
  make,
  makeCase,
  pure,
  promise,
}