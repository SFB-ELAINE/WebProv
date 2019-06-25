import { Watch as W } from 'vue-property-decorator';
import { WatchOptions } from 'vue';
import {
  ProvenanceNode,
  ProvenanceNodeType,
  relationshipRules,
  ProvenanceNodeRelationships,
} from 'specification';

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

export function getText(n: ProvenanceNode): string {
  switch (n.type) {
    case 'wet-lab-data':
      return n.name;
    case 'model-building-activity':
      return 'MBA';
    case 'simulation-data':
      return n.name;
    case 'model-exploration-activity':
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

export const notNull = <T>(t: T | null): t is T => {
  return t !== null;
};

export function getInformationFields(node: ProvenanceNode, title: string) {
  const fields: Array<[string, string]> = [['Title', title]];

  switch (node.type) {
    case 'model-building-activity':
      break;
    case 'model-exploration-activity':
      break;
    case 'model':
      fields.push(['Source', node.modelInformation.bibInformation]);
      fields.push(['Model Number', '' + node.modelInformation.modelNumber]);
      fields.push(['Version', '' + node.version]);
      break;
    case 'wet-lab-data':
      const information = node.information ? node.information : {};
      Object.keys(information).forEach((key) => {
        fields.push([key, information[key]]);
      });
      break;
    case 'simulation-data':
      break;
  }

  return fields;
}

interface ConnectionOptions { type: ProvenanceNodeRelationships | undefined; doConnection?: boolean; }

export const makeConnection = (a: ProvenanceNode, b: ProvenanceNode, opts: ConnectionOptions ): boolean => {
  const { doConnection = true } = opts;
  if (!a.connections) {
    a.connections = [];
  }

  const rulesForA = relationshipRules[a.type];
  const rules = rulesForA[b.type];
  if (!rules) {
    return false;
  }

  const isValid = rules.some((rule) => {
    if (typeof rule === 'string') {
      return rule === opts.type;
    } else {
      return rule.relationship === opts.type;
    }
  });

  if (!isValid) {
    return false;
  }

  if (doConnection) {
    a.connections.push({
      id: Math.round(Math.random() * 10000), // TODO JACOB
      type: 'used',
      target: b,
    });
  }

  return true;
};

export const isValidConnection = (
  a: ProvenanceNode, b: ProvenanceNode, type: ProvenanceNodeRelationships | undefined,
) => {
  return makeConnection(a, b, { doConnection: false, type });
};

type Events = keyof WindowEventMap;

type EventListener<K extends Events> = (ev: WindowEventMap[K]) => any;

export const once = <K extends Events>(
  type: K,
  listener: EventListener<K>,
  options?: boolean | AddEventListenerOptions,
) => {
  function callAndRemove(ev: WindowEventMap[K]) {
    listener(ev);
    window.removeEventListener(type, listener);
  }

  window.addEventListener(type, callAndRemove, options);
};

export const addEventListener = <K extends Events>(
  type: K,
  ev: EventListener<K>,
  options?: boolean | AddEventListenerOptions,
) => {
  window.addEventListener(type, ev, options);

  return () => {
    window.removeEventListener(type, ev);
  };
};

type EventListeners = {
  [P in keyof WindowEventMap]?: EventListener<P> | 'remove';
};

export const addEventListeners = (
  events: EventListeners,
  options?: boolean | AddEventListenerOptions,
) => {
  const types = Object.keys(events) as Events[];

  const remove = () => {
    for (const type of types) {
      const ev = events[type];
      if (ev === 'remove') {
        continue;
      }

      window.removeEventListener(type, ev as any);
    }
  };

  for (const type of types) {
    const ev = events[type];
    if (ev === 'remove') {
      // @ts-ignore
      // There is a weird error with union types
      // Going to just ignore this
      events[type] = remove;
    }
    window.addEventListener(type, ev as any, options);
  }


  return remove;
};

export const getDefaultRelationshipType = (a: ProvenanceNodeType, b: ProvenanceNodeType) => {
  const aRules = relationshipRules[a];

  const rules = aRules[b];
  if (!rules) {
    return;
  }

  const first = rules[0];
  if (typeof first === 'string') {
    return first;
  } else {
    return first.relationship;
  }
};
