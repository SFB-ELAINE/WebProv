export type TypeOf<C extends Type<any>> = C;

class Type<T> {
  readonly t!: T;
}

export class BooleanC extends Type<boolean> {
  public type = 'boolean';
}

export const boolean = new BooleanC();

export interface Mixed extends Type<any> {}

export interface Props {
  [key: string]: Mixed
}

export type TypeC<P extends Props> = {
  [K in keyof P]: P[K]['t'];
}