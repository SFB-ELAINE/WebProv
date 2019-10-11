import * as t from 'io-ts';
import { Schema, Defined, GetTypes } from './neon';

export const uniqueId = () => {
  // HTML IDs must begin with a non numeric character or something like that.
  // Thus, we prepend 'A'
  return 'A' + Math.random().toString().substr(2, 9);
};

export const keys = <T extends object>(arg: T) => Object.keys(arg) as Array<keyof T & string>;

export const tuple = <T extends any[]>(...args: T): T => args;

const toObject = <T>(arg: Array<[string, T]>) => {
  const obj: { [k: string]: T } = {};
  arg.forEach(([key, value]) => {
    obj[key] = value;
  });

  return obj;
};

// Required<Defined<S['required']>>, t.TypeC<S['optional']>

type IntersectionHelper<S extends Schema> = t.IntersectionC<
  [t.TypeC<GetTypes<S['required']>>, t.PartialC<GetTypes<Defined<S['optional']>>>]
>

export const getType = <S extends Schema>(schema: S): IntersectionHelper<S> => {
  const required = schema.required;
  const optional = schema.optional || {};
  const r = toObject(keys(required).map((key) => tuple(key, required[key].type)));
  const o = toObject(keys(optional).map((key) => tuple(key, optional[key].type)));

  // I am making the following casts because I know that what I am returning complies with the signature.
  // It's not worth it to try and get TypeScript to agree with me.
  return t.intersection([
    t.type(r) as any,
    t.partial(o) as any,
  ]);
};


export const relationshipInformationType = <S extends Schema>(schema: S) => {
  return t.type({
    source: t.string,
    target: t.string,
    properties: getType(schema),
  })
}