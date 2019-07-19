import Vue, { ComponentOptions } from 'vue';
import {
  ProvenanceNode,
  ProvenanceNodeType,
  relationshipRules,
  DependencyType,
  SimulationStudy,
  uniqueId,
  BackendError,
  BackendNotFound,
  isValidRelationship,
} from 'common';
import { PropsDefinition } from 'vue/types/options';
import { Context } from 'vue-function-api/dist/types/vue';
import { NotificationProgrammatic } from 'buefy/dist/components/notification';
import { DependencyRelationship } from 'common/dist/schemas';

// The following methods are useful for making lookups.

export const makeLookup = <T extends { id: string | number }>(array: Iterable<T>) => {
  const lookup: Lookup<T> = {};
  for (const item of array) {
    lookup[item.id] = item;
  }
  return lookup;
};

export const makeLookupBy = <T, F extends (t: T) => string | number>(
  array: Iterable<T>, f: F,
) => {
  const lookup: Lookup<T> = {};
  for (const item of array) {
    lookup[f(item)] = item;
  }
  return lookup;
};

export const makeArrayLookupBy = <T, F extends (t: T) => string | number>(
  array: Iterable<T>, f: F,
) => {
  const lookup: Lookup<T[]> = {};
  for (const item of array) {
    const key = f(item);
    if (!lookup[key]) {
      lookup[key] = [];
    }

    lookup[key].push(item);
  }
  return lookup;
};

export interface Lookup<T> { [k: string]: T; }

interface SimulationStudyLookup {
  [studyId: number]: SimulationStudy | undefined;
}

/**
 * Determine the label for the provenance node. If a label is defined, that is used.
 *
 * @param n The node.
 * @param lookup The simulation study lookup. We need this to determine the default label for the model node.
 */
export function getLabel(n: ProvenanceNode, lookup: SimulationStudyLookup): string {
  if (n.label) {
    return n.label;
  }

  switch (n.type) {
    case 'WetLabData':
      return 'No Label';
    case 'ModelBuildingActivity':
      return 'MBA';
    case 'SimulationData':
      return 'No Label';
    case 'ModelExplorationActivity':
      return 'MEA';
    case 'TheoreticalKnowledge':
      return 'TK';
    case 'Model':
      if (n.label) {
        return n.label;
      }

      if (n.studyId === undefined) {
        return 'None';
      }

      const text = `M${n.studyId}`;
      const simulationStudy = lookup[n.studyId];
      if (!simulationStudy) {
        return text;
      }

      return text + ` (${simulationStudy.source})`;
  }
}

interface Can {
  can: true;
  connection: {
    source: string;
    target: string;
    properties: DependencyRelationship;
  };
}

interface Cant {
  can: false;
}

export const createRelationship = (
  a: ProvenanceNode, b: ProvenanceNode, type?: DependencyType,
): Can | Cant => {
  if (!type) {
    return {
      can: false,
    };
  }

  const isValid = isValidRelationship(a, b, type);
  if (!isValid) {
    return {
      can: false,
    };
  }

  return {
    can: true,
    connection: {
      source: a.id,
      target: b.id,
      properties: {
        id: uniqueId(),
        type,
      },
    },
  };
};

type Events = keyof WindowEventMap;

type EventListener<K extends Events> = (ev: WindowEventMap[K]) => any;

/**
 * Add an event listener and remove it when the event occurs.
 * @param type
 * @param listener
 * @param options
 */
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

/**
 * Add an event listener (like normal) but return an object with a dispose method to remove the same listener.
 *
 * @param type The event.
 * @param ev The listener.
 * @param options The options.
 */
export const addEventListener = <K extends Events>(
  type: K,
  ev: EventListener<K>,
  options?: boolean | AddEventListenerOptions,
) => {
  window.addEventListener(type, ev, options);

  return {
    dispose: () => {
      window.removeEventListener(type, ev);
    },
  };
};

type EventListeners = {
  [P in keyof WindowEventMap]?: EventListener<P> | 'remove';
};

/**
 * Add 0 or more event listeners and return an object with a dispose method to remove the listeners.
 *
 * @param events The events.
 * @param options The options.
 */
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


  return {
    dispose: remove,
  };
};

/**
 * Determines the default relationship between two nodes based on the valid relationship types. If none exist, nothing
 * is returned.
 *
 * @param a The source node.
 * @param b The target node.
 * @returns The default relationship (the first in the list) or nothing if the list of valid relationships is empty.
 */
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

/**
 * Uppercase the first character of the string.
 *
 * @param s The string to uppercase.
 */
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

// A getter function with defaults
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
  f: () => Promise<T | BackendError | BackendNotFound>, cb?: (result: T) => void,
) {
  const result = await f();

  if (result.result === 'error') {
    NotificationProgrammatic.open({
      indefinite: true,
      message: result.message,
      position: 'is-bottom-right',
      type: 'is-danger',
    });
  } else if (result.result === 'not-found') {
    NotificationProgrammatic.open({
      indefinite: true,
      message: 'Item not found in database',
      position: 'is-bottom-right',
      type: 'is-danger',
    });
  } else {
    if (cb) {
      cb(result);
    }
  }

  return result;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Find the intersection between two lines defined by four points.
 *
 * @param l1Start The start of the first line.
 * @param l1End The end of the first line.
 * @param l2Start The start of the second line.
 * @param l2End The end of the second line.
 * @returns The position of their intersection and information on whether the intersection actually occurred or whether
 * the intersection would have only occurred if the lines extended to infinite.
 */
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

export const isDefined = <T>(o: T | undefined): o is T => {
  return o !== undefined;
};

// This seems weird, but I'm just doing it to avoid tslint warnings.
// Also, we can easily modify this method to return other objects rather than console
export const getLogger = () => {
  return console;
};


export function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
