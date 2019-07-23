import * as t from 'io-ts';
import { Schema } from './neon';
import { DependencyType, ProvenanceNode, relationshipRules } from './schemas';

export const uniqueId = () => {
  // HTML IDs must begin with a non numeric character or something like that.
  // Thus, we prepend 'A'
  return 'A' + Math.random().toString().substr(2, 9);
};

export const keys = <T extends object>(arg: T) => Object.keys(arg) as Array<keyof T & string>;

export const tuple = <T extends any[]>(...args: T): T => args;

export const isValidRelationship = (
  a: ProvenanceNode, b: ProvenanceNode, type?: DependencyType,
) => {
  if (!type) {
    return false;
  }

  const rulesForA = relationshipRules[a.type];
  const rules = rulesForA[b.type];
  if (!rules) {
    return false;
  }

  return rules.some((rule) => {
    if (typeof rule === 'string') {
      return rule === type;
    } else {
      return rule.relationship === type;
    }
  });
};

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
  const r = toObject(keys(required).map((key) => tuple(key, required[key].type)));
  const o = toObject(keys(optional).map((key) => tuple(key, optional[key].type)));
  return t.exact(t.intersection([
    t.type(r),
    t.partial(o),
  ]));
};
