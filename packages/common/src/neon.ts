export {
  boolean,
  string,
  number,
  union,
  intersection,
  literal,
  array,
  type,
  TypeOf as IoTypeOf,
  Any,
  Type,
} from "io-ts";

export { PathReporter } from "io-ts/lib/PathReporter";

export { right, left, either, isLeft, isRight } from "fp-ts/lib/Either";

import * as t from "io-ts";

// neon is just a random name
// It's based on neo4j

export type Primitive = t.BooleanC | t.StringC | t.NumberC | t.UnionC<any>;

export type PrimitiveArray =
  | t.ArrayC<t.UnionC<any>>
  | t.ArrayC<t.BooleanC>
  | t.ArrayC<t.NumberC>
  | t.ArrayC<t.StringC>;

export interface SchemaField {
  primary?: boolean;
  unique?: boolean;
  type: PrimitiveArray | Primitive;
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

export interface RelationshipSchema<A extends Schema, B extends Schema>
  extends Schema {
  source: A;
  target: B;
}

export interface RelationshipInformation<T> {
  source: string;
  target: string;
  properties: T;
}

export const schemas: Schema[] = [];

export const relationships: Array<RelationshipSchema<Schema, Schema>> = [];

export const schema = <S extends Schema>(s: S): S => {
  schemas.push(s);
  return s;
};

export const relationship = <
  A extends Schema,
  B extends Schema,
  R extends RelationshipSchema<A, B>
>(
  r: R
) => {
  relationships.push(r);
  return r;
};

export type GetTypes<F extends Fields> = { [K in keyof F]: F[K]["type"] };

export type Required<F extends Fields> = t.TypeOf<t.TypeC<GetTypes<F>>>;

export type Optional<F extends Fields> = t.TypeOf<t.PartialC<GetTypes<F>>>;

export type Defined<T> = Exclude<T, undefined>;

/**
 * Enough information about the relationship so we can identity the source node
 * and the target node.
 */
export interface RelationshipBasics<T> {
  /**
   * The source node ID.
   */
  source: string;

  /**
   * The target node ID.
   */
  target: string;

  /**
   * The properties of the relationship.
   */
  properties: T;
}

export type TypeOf<T extends Schema> = Required<Defined<T["required"]>> &
  Optional<Defined<T["optional"]>>;
