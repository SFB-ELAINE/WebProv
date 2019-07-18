export interface D3Link {
  source: string;
  target: string;
  color?: string;
  onDidClick?: (e: MouseEvent) => void;
}

export interface D3Node {
  id: string;
  rx: number;
  height: number;
  width: number;
  stroke: string;
  text?: string;
  index: number;
  vx: number;
  vy: number;
  actionText?: string;
  x: number;
  y: number;
  hullGroup?: number;
  onDidClick?: (e: MouseEvent) => void;
  onDidActionClick?: (e: MouseEvent) => void;
  onDidDblclick?: (e: MouseEvent) => void;
  onDidMousedown?: (e: MouseEvent) => void;
  onDidRightClick?: (e: MouseEvent) => void;
}

export interface D3NodeColorCombo {
  node: D3Node;
  color: string;
}

// tslint:disable-next-line: ban-types
type FunctionPropertyNames<T> = { [K in keyof T]: Exclude<T[K], undefined> extends Function ? K : never }[keyof T];

export type D3NodeCallbackKeys = Exclude<FunctionPropertyNames<D3Node>, undefined>;

export interface ID3<N extends D3Node> {
  isD3: true;
  addLink(link: D3Link): void;
  addNode(node: N): void;
}

export const isD3 = <N extends D3Node>(component: any): component is ID3<N> => {
  return component.addLink !== undefined && component.addNode !== undefined;
};

export interface D3Hull {
  group: number;
  nodes: D3Node[];
  path: Array<[number, number]>;
}
