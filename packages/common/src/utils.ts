import * as t from 'io-ts';
import { Schema, Defined, GetTypes } from './neon';
import {
  DependencyRelationshipSchema,
  InformationFieldSchema,
  InformationRelationshipSchema,
  ProvenanceNodeSchema,
  StudySchema,
} from './schemas';

export const uniqueId = () => {
  // HTML IDs must begin with a non numeric character or something like that.
  // Thus, we prepend 'A'
  return 'A' + Math.random().toString().substr(2, 9);
};

export const keys = <T extends object>(arg: T) =>
  Object.keys(arg) as Array<keyof T & string>;

export const tuple = <T extends any[]>(...args: T): T => args;

const toObject = <T>(arg: Array<[string, T]>) => {
  const obj: { [k: string]: T } = {};
  arg.forEach(([key, value]) => {
    obj[key] = value;
  });

  return obj;
};

type IntersectionHelper<S extends Schema> = t.IntersectionC<
  [
    t.TypeC<GetTypes<S['required']>>,
    t.PartialC<
      GetTypes<Defined<undefined extends S['optional'] ? any : S['optional']>>
    >,
  ]
>;

export const getType = <S extends Schema>(schema: S): IntersectionHelper<S> => {
  const required = schema.required;
  const optional = schema.optional || {};
  const r = toObject(
    keys(required).map((key) => tuple(key, required[key].type)),
  );
  const o = toObject(
    keys(optional).map((key) => tuple(key, optional[key].type)),
  );

  // I am making the following casts because I know that what I am returning complies with the signature.
  // It's not worth it to try and get TypeScript to agree with me.
  return t.intersection([t.type(r) as any, t.partial(o) as any]);
};

export const relationshipInformationType = <S extends Schema>(schema: S) => {
  return t.type({
    source: t.string,
    target: t.string,
    properties: getType(schema),
  });
};

/**
 * Filters and transforms the type to type T.
 *
 * @param o Anything.
 */
export const isDefined = <T>(o: T | undefined): o is T => {
  return o !== undefined;
};

/**
 * Turns a list of lists into a list.
 *
 * @param lists The lists.
 */
export const flat = <T>(lists: T[][]): T[] => {
  const list: T[] = [];
  lists.forEach((subList) => list.push(...subList));
  return list;
};

// The following methods are useful for making lookups.
export const makeLookup = <T extends { id: string | number }>(
  array: Iterable<T>,
) => {
  const lookup: Lookup<T> = {};
  for (const item of array) {
    lookup[item.id] = item;
  }
  return lookup;
};

export const makeLookupBy = <T, F extends (t: T) => string | number>(
  array: Iterable<T>,
  f: F,
) => {
  const lookup: Lookup<T> = {};
  for (const item of array) {
    lookup[f(item)] = item;
  }
  return lookup;
};

export const makeArrayLookupBy = <T, F extends (t: T) => string | number>(
  array: Iterable<T>,
  f: F,
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

export interface Lookup<T> {
  [k: string]: T;
}

// Duplicate code from frontend/src/utils.ts
const getRelationshipInformationType = <S extends Schema>(schema: S) => {
  return t.type({
    source: t.string,
    target: t.string,
    properties: getType(schema),
  });
};

export const ExportInterfaceType = t.type({
  provenanceNodes: t.array(getType(ProvenanceNodeSchema)),
  informationFields: t.array(getType(InformationFieldSchema)),
  informationRelationships: t.array(
    getRelationshipInformationType(InformationRelationshipSchema),
  ),
  dependencyRelationships: t.array(
    getRelationshipInformationType(DependencyRelationshipSchema),
  ),
  studies: t.array(getType(StudySchema)),
});

export type ExportInterface = t.TypeOf<typeof ExportInterfaceType>;
// End duplicate
