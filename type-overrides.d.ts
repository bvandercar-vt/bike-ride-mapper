import { Entries } from 'type-fest'

declare global {
  interface ObjectConstructor {
    entries<T extends object>(o: T): Entries<T>
    fromEntries<T extends object>(e: Entries<T>): T
  }
}
