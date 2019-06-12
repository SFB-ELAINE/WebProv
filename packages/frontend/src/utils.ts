import { Watch as W } from 'vue-property-decorator';
import { WatchOptions } from 'vue';
import { Nodes } from 'specification';

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


export function getText(n: Nodes): string {
  switch (n.type) {
    case 'wet-lab data':
      return n.name;
    case 'model-building-activity':
      return 'MBA';
    case 'simulation data':
      return n.name;
    case 'model exploration activity':
      return 'MEA';
    case 'model':
      if (n.version < 1) {
        throw Error(`Bad model version number: ${n.version}. Expected value >= 1`);
      }

      let text = `M${n.modelInformation.modelNumber}`;

      if (n.version === 1) {
        // Do nothing is the version is 1
      } else if (n.version === 2) {
        // Just add an apostrophe if the version is 2
        text += `'`;
      } else {
        // Add an explicit version number if > 2
        text += `v${n.version}`;
      }

      return text + ` (${n.modelInformation.bibInformation})`;
  }
}
