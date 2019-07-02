import * as d3 from 'd3';
import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

type SVG = d3.Selection<any, any, any, any>;

export type CB = (svg: SVG) => void;

interface MessageEvents {
  mounted: CB;
  destroyed: CB;
}

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
  onDidClick?: (e: MouseEvent, d3: ID3<this>) => void;
  onDidDblclick?: (e: MouseEvent, d3: ID3<this>) => void;
  onDidMousedown?: (e: MouseEvent, d3: ID3<this>) => void;
  onDidRightClick?: (e: MouseEvent, d3: ID3<this>) => void;
}

export type D3NodeCallbackKeys = 'onDidClick' | 'onDidMousedown' | 'onDidDblclick' | 'onDidRightClick';

export const emitter = new EventEmitter() as TypedEmitter<MessageEvents>;

export interface ID3<N extends D3Node> {
  isD3: true;
  addLink(link: D3Link): void;
  addNode(node: N): void;
  setStrokeColor(node: N, color: string): void;
}

export const isD3 = <N extends D3Node>(component: any): component is ID3<N> => {
  return component.isD3 === true;
};

export interface D3Hull {
  group: number;
  nodes: D3Node[];
  path: Array<[number, number]>;
}
