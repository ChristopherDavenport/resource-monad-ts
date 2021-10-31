import resource from "../src/"

describe("Resource Spec",
  () => {
    it("Should Startup and Shutdown", async () => {
      let started = 0
      let shutdown = 0
      let effected = -1
      await resource.make(
        async () => {
          started += 1
          effected = 1
        },
        async () => {
          shutdown +=1
          effected -= 1
        }
      ).use(async (_)=> {})()

      expect(started).toEqual(1)
      expect(shutdown).toEqual(1)
      expect(effected).toEqual(0)
    }),

    it("Should Shutdown on use failure", async() => {
      let started1 = 0
      let shutdown1 = 0
      let effected1 = -1
      try {
        await resource.make(
          async () => {
            started1 += 1
            effected1 = 1
          },
          async () => {
            shutdown1 +=1
            effected1 -= 1
          }
        ).use(async (_)=> { throw new Error("Boom!")})()
      } catch (e) {

      }
      

      expect(started1).toEqual(1)
      expect(shutdown1).toEqual(1)
      expect(effected1).toEqual(0)
    })

    it("Should Shutdown on flatMap monad build failure", async() => {
      let started2 = 0
      let shutdown2 = 0
      let effected2 = -1
      try {
        await resource.make(
          async () => {
            started2 += 1
            effected2 = 1
          },
          async () => {
            shutdown2 +=1
            effected2 -= 1
          }
        ).flatMap(() => 
          resource.promise(async () => {throw new Error("Boom!")})
        ).use(async (_)=> {})()
      } catch (e) {

      }
      

      expect(started2).toEqual(1)
      expect(shutdown2).toEqual(1)
      expect(effected2).toEqual(0)
    })
  }

)