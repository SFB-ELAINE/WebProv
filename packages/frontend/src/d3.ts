import Vue from 'vue';
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
  onDidClick?: (e: MouseEvent, node: D3Node, d3: ID3) => void;
  onDidDblclick?: (e: MouseEvent, node: D3Node, d3: ID3) => void;
  onDidMousedown?: (e: MouseEvent, node: D3Node, d3: ID3) => void;
  onDidRightClick?: (e: MouseEvent, node: D3Node, d3: ID3) => void;
}

export type D3NodeCallbackKeys = 'onDidClick' | 'onDidMousedown' | 'onDidDblclick' | 'onDidRightClick';

export const emitter = new EventEmitter() as TypedEmitter<MessageEvents>;

export interface ID3 {
  isD3: true;
  addLink(link: D3Link): void;
  addNode(node: D3Node): void;
  setStrokeColor(node: D3Node, color: string): void;
}

export const isD3 = (component: any): component is ID3 => {
  return component.isD3 === true;
};

export interface D3Hull {
  group: number;
  nodes: D3Node[];
  path: Array<[number, number]>;
}
