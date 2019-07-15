import * as t from 'io-ts';
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
  source: A;
  target: B;
  properties: TypeOf<R>;
}

export const schema = <S extends Schema>(s: S) => {
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

export type TypeOf<T extends Schema> =
  Required<Defined<T['required']>> &
  Optional<Defined<T['optional']>>;
