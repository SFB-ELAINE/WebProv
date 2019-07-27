import * as t from 'io-ts';
export { boolean, string, number, union, literal } from 'io-ts';

// neon is just a random name
// It's based on neo4j

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

export interface RelationshipInformation<T> {
  source: string;
  target: string;
  properties: T;
}

export const schemas: Schema[] = [];
export const indexes: Index<Schema>[] = [];

export const relationships: Array<RelationshipSchema<Schema, Schema>> = [];

export const schema = <S extends Schema>(s: S): S => {
  schemas.push(s);
  return s;
};

export interface Index<S extends Schema> {
  name: string;
  schema: S;
  keys: Array<Keys<S>>;
}

export const index = <S extends Schema, I extends Index<S>>(schema: S, i: I): I => {
  indexes.push(i as any);
  return i;
};

export const relationship = <
  A extends Schema, B extends Schema, R extends RelationshipSchema<A, B>
>(r: R) => {
  relationships.push(r);
  return r;
};

type GetTypes<F extends Fields> = { [K in keyof F]: F[K]['type'] };

type Required<F extends Fields> = t.TypeOf<t.TypeC<GetTypes<F>>>;

type Optional<F extends Fields> = t.TypeOf<t.PartialC<GetTypes<F>>>;

type Keys<S extends Schema> = keyof TypeOf<S> & string;

type Defined<T> = Exclude<T, undefined>;

export interface RelationshipBasics<T> {
  source: string;
  target: string;
  properties: T;
}

export type TypeOf<T extends Schema> =
  Required<Defined<T['required']>> &
  Optional<Defined<T['optional']>>;
