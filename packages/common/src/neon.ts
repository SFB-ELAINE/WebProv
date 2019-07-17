import * as t from 'io-ts';
import { keys, tuple } from './utils';
export { boolean, string, number, union, literal } from 'io-ts';

export type Primitive =
  t.BooleanC |
  t.StringC |
  t.NumberC |
  t.LiteralC<any> |
  t.UnionC<[t.LiteralC<any>, t.LiteralC<any>, ...Array<t.LiteralC<any>>]>;

export type PrimitiveArray =
  t.ArrayC<t.BooleanC> |
  t.ArrayC<t.NumberC> |
  t.ArrayC<t.StringC>;

export interface SchemaField {
  primary?: boolean;
  unique?: boolean;
  type: Primitive | PrimitiveArray;
}

interface Fields {
  [name: string]: SchemaField;
}

export interface Schema {
  name: string;
  required: {
    id: {
      primary: true;
      type: t.StringC;
    };
    [name: string]: SchemaField;
  };
  optional?: Fields;
}

export interface RelationshipSchema<A extends Schema, B extends Schema> extends Schema {
  source: A;
  target: B;
}

export interface Relationship<A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>> {
  schema: R;
  source: TypeOf<A>;
  target: TypeOf<B>;
  properties: TypeOf<R>;
}

export const schema = <S extends Schema>(s: S): S => {
  return s;
};

export const relationship = <
  A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>
>(r: R) => {
  return r;
};

type GetTypes<F extends Fields> = { [K in keyof F]: F[K]['type'] };

type Required<F extends Fields> = t.TypeOf<t.TypeC<GetTypes<F>>>;

type Optional<F extends Fields> = t.TypeOf<t.PartialC<GetTypes<F>>>;

type Defined<T> = Exclude<T, undefined>;

export interface RelationshipBasics<T> { 
  source: string, 
  target: string, 
  properties: T,
}

export type TypeOf<T extends Schema> =
  Required<Defined<T['required']>> &
  Optional<Defined<T['optional']>>;

const toObject = <T>(arg: Array<[string, T]>) => {
  const obj: { [k: string]: T } = {};
  arg.forEach(([key, value]) => {
    obj[key] = value;
  });

  return obj;
};

export const getType = <S extends Schema>(schema: S) => {
  const required = schema.required;
  const optional = schema.optional || {};
  const r = toObject(keys(required).map((key) => tuple(key, required[key].type)))
  const o = toObject(keys(optional).map((key) => tuple(key, optional[key].type)))
  return t.exact(t.intersection([
    t.type(r),
    t.partial(o),
  ]));
}
