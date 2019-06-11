import { Watch as W } from 'vue-property-decorator';
import { WatchOptions } from 'vue';

export const makeLookup = <T extends { id: string }>(array: Iterable<T>) => {
  const lookup: Lookup<T> = {};
  for (const item of array) {
    lookup[item.id] = item;
  }
  return lookup;
};

export interface Lookup<T> { [k: string]: T; }



export function Watch<T>(path: keyof T & string, options?: WatchOptions) {
  return W(path, options);
}
