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

export interface Link {
  source: string;
  target: string;
  color?: string;
}

export interface Node {
  id: string;
  rx: number;
  height: number;
  width: number;
  stroke: string;
  text?: string;
  actionText?: string;
  x: number;
  y: number;
  hullGroup?: number;
}

export const emitter = new EventEmitter() as TypedEmitter<MessageEvents>;

export interface ID3 extends Vue {
  isD3: true;
  addLink(link: Link): void;
  addNode(node: Node): void;
}

export const isD3 = (component: any): component is ID3 => {
  return component.isD3 === true;
};

export interface Hull {
  group: number;
  path: Array<[number, number]>;
}
