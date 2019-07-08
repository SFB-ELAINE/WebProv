import { Watch as W } from 'vue-property-decorator';
import Vue, { WatchOptions, ComponentOptions } from 'vue';
import {
  ProvenanceNode,
  ProvenanceNodeType,
  relationshipRules,
  ProvenanceNodeRelationships,
  ModelInformation,
  ProvenanceNodeLookup,
  provenanceNodeTypes,
} from '@/specification';
import { PropsDefinition } from 'vue/types/options';
import { Context } from 'vue-function-api/dist/types/vue';
import { NotificationProgrammatic } from 'buefy/dist/components/notification';
import * as backend from '@/backend';

export const makeLookup = <T extends { id: string | number }>(array: Iterable<T>) => {
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

interface ModelInformationLookup {
  [modelId: number]: ModelInformation | undefined;
}

export function getText(n: ProvenanceNode, lookup: ModelInformationLookup): string {
  switch (n.type) {
    case 'wet-lab-data':
      return n.name || 'None';
    case 'model-building-activity':
      return 'MBA';
    case 'simulation-data':
      return n.name || 'None';
    case 'model-exploration-activity':
      return 'MEA';
    case 'model':
      if (n.modelId === undefined) {
        return 'None';
      }

      let text = `M${n.modelId}`;

      if (n.version === undefined || n.version === 1) {
        // Do nothing is the version is 1
      } else if (n.version === 2) {
        // Just add an apostrophe if the version is 2
        text += `'`;
      } else {
        // Add an explicit version number if > 2
        text += `v${n.version}`;
      }

      const modelInformation = lookup[n.modelId];
      if (!modelInformation) {
        return text;
      }

      return text + ` (${modelInformation.bibInformation})`;
  }
}

export const notNull = <T>(t: T | null): t is T => {
  return t !== null;
};

export function getInformationFields(node: ProvenanceNode, title: string) {
  const fields: Array<[string, string]> = [['Title', title], ['Model', '' + node.modelId]];

  switch (node.type) {
    case 'model-building-activity':
      break;
    case 'model-exploration-activity':
      break;
    case 'model':
      fields.push(['Version', '' + node.version]);
      break;
    case 'wet-lab-data':
      fields.push(...(node.information || []));
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
    Vue.set(a, 'connections', []);
  }

  const rulesForA = relationshipRules[a.type];
  const rules = rulesForA[b.type];
  if (!rules) {
    return false;
  }

  if (!opts.type) {
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
    a.connections!.push({
      id: uniqueId(),
      type: opts.type,
      targetId: b.id,
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


export const uniqueId = () => {
  // HTML IDs must begin with a non numeric character or something like that.
  // Thus, we prepend 'A'
  return 'A' + Math.random().toString().substr(2, 9);
};

export interface FieldInformation<T extends string> {
  name: T;
  type: 'string' | 'number';
  multiple?: boolean;
  options?: Array<string | number>;
}

type NodeFields = { [T in ProvenanceNodeType]: Array<FieldInformation<keyof ProvenanceNodeLookup[T] & string>> };

const typeSelect: FieldInformation<'type'> = { name: 'type', type: 'string', options: provenanceNodeTypes };
const modelSelect: FieldInformation<'modelId'> = { name: 'modelId', type: 'number' };

// TODO Remove this and use io-ts instead!
// We can infer this information from there instead!
export const nodeFields: NodeFields = {
  'model': [typeSelect, modelSelect, { name: 'version', type: 'number' }],
  'model-building-activity': [typeSelect, modelSelect],
  'model-exploration-activity': [typeSelect, modelSelect],
  'simulation-data': [typeSelect, modelSelect, { name: 'name', type: 'string' }],
  'wet-lab-data': [
    typeSelect,
    modelSelect,
    { name: 'name', type: 'string' },
    { name: 'information', type: 'string', multiple: true },
  ],
};

export function uppercase(s: string) {
  return s.charAt(0).toUpperCase() + s.substring(1);
}

/**
 * Convert a string to word case. ie. "helloHowAreYou" to "Hello How Are You".
 *
 * @param s The string to convert.
 */
export function wordCase(s: string) {
  return uppercase(
    s.replace(/([A-Z]+)/g, ' $1').replace(/([A-Z][a-z])/g, ' $1'),
  );
}

export function get<T>(o: { [k: string]: T }, key: keyof typeof o): T | undefined;
export function get<T>(o: { [k: string]: T }, key: keyof typeof o, defaultValue: T): T;
export function get<T>(o: { [k: string]: T }, key: keyof typeof o, defaultValue?: T) {
  const value: T | undefined = o[key];
  return value || defaultValue;
}

export const setVue = <T extends object>(o: T, k: keyof T & string, v: T[typeof k]) => {
  Vue.set(o, k, v);
};

// FIXME Remove when https://github.com/vuejs/vue-function-api/issues/15 is resolved
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type ComponentOptionsWithSetup<Props> = Omit<ComponentOptions<Vue>, 'props' | 'setup'> & {
  props?: PropsDefinition<Props>;
  setup?: (
    this: undefined,
    props: Readonly<Props>,
    context: Context,
  ) => object | null | undefined | void;
};

// when props is an object
export function createComponent<Props>(
  compOptions: ComponentOptionsWithSetup<Props>,
): ComponentOptions<Vue>;
// when props is an array
export function createComponent<Props extends string = never>(
  compOptions: ComponentOptionsWithSetup<Record<Props, any>>,
): ComponentOptions<Vue>;

export function createComponent<Props>(
  compOptions: ComponentOptionsWithSetup<Props>,
): ComponentOptions<Vue> {
  return (compOptions as any) as ComponentOptions<Vue>;
}

// Remove until here

export async function makeRequest<T extends { result: 'success' }>(
  f: () => Promise<T | backend.BackendError | backend.BackendNotFound>, cb?: (result: T) => void,
) {
  const result = await f();

  if (result.result === 'error') {
    NotificationProgrammatic.open({
      duration: 10000,
      message: result.message,
      position: 'is-bottom-right',
      type: 'is-danger',
    });
  } else if (result.result === 'not-found') {
    NotificationProgrammatic.open({
      duration: 10000,
      message: 'Item not found in database',
      position: 'is-bottom-right',
      type: 'is-danger',
    });
  } else {
    if (cb) {
      cb(result);
    }
  }
}

interface Point {
  x: number;
  y: number;
}

export function intersection(l1Start: Point, l1End: Point, l2Start: Point, l2End: Point) {
  // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and
  // booleans for whether line segment 1 or line segment 2 contain the point
  const denominator =
    ((l2End.y - l2Start.y) * (l1End.x - l1Start.x)) -
    ((l2End.x - l2Start.x) * (l1End.y - l1Start.y));

  if (denominator === 0) {
    return null;
  }

  let a = l1Start.y - l2Start.y;
  let b = l1Start.x - l2Start.x;
  const numerator1 = ((l2End.x - l2Start.x) * a) - ((l2End.y - l2Start.y) * b);
  const numerator2 = ((l1End.x - l1Start.x) * a) - ((l1End.y - l1Start.y) * b);
  a = numerator1 / denominator;
  b = numerator2 / denominator;

  // It is worth noting that this should be the same as:
  // x = l2Start.x + (b * (l2End.x - l2Start.x));
  // y = l2Start.x + (b * (l2End.y - l2Start.y));
  // if we cast these lines infinitely in both directions, they intersect here:
  return {
    x: l1Start.x + (a * (l1End.x - l1Start.x)),
    y: l1Start.y + (a * (l1End.y - l1Start.y)),
    // if line2 is a segment and line1 is infinite, they intersect if:
    onLine1: a > 0 && a < 1,

    // if line1 is a segment and line2 is infinite, they intersect if:
    onLine2: b > 0 && b < 1,

    // if line1 and line2 are segments, they intersect if both of the above are true
  };
}
