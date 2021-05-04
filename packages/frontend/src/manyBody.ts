// This code was pulled from a source online

import { quadtree } from 'd3-quadtree';
import { D3Node } from './d3';

const xGetter = (d: D3Node) => d.x;
const yGetter = (d: D3Node) => d.y;
const constant = (x: number) => () => x;
const jiggle = () => (Math.random() - 0.5) * 1e-6;
const byUndefined = <T>(group: T | undefined): group is T => group !== undefined;
const FACTOR = 25;

interface ExtraData {
  x: number;
  y: number;
  value: number;
  groups: { [group: string]: number };
}

interface QuadNode extends ExtraData {
  data: D3Node;
  next: QuadNode;
}

type QuadNodes = QuadNode[] & ExtraData;

export default function() {
  let nodes: D3Node[];
  let node: D3Node;
  let groups: string[] = [];
  let alpha: number;
  let strength: () => number = constant(-30);
  let strengths: number[];
  let distanceMin2 = 1;
  let distanceMax2 = Infinity;
  let theta2 = 0.81;
  let strengthGroups: Array<{ [group: string]: number }> = [];

  function force(_: any) {
    alpha = _;
    const tree = quadtree(nodes, xGetter, yGetter).visitAfter((quad: any) => accumulate(quad));
    nodes.forEach(((n) => {
      node = n;
      tree.visit((quad: any, x1: number, y1: number, x2: number) => apply(quad, x1, y1, x2));
    }));
  }

  function initialize() {
    if (!nodes) { return; }
    strengths = new Array(nodes.length);
    strengthGroups = new Array(nodes.length);
    nodes.forEach((n) => {
      strengths[n.index] = strength();
      strengthGroups[n.index] = {};
      groups.forEach((group) => {
        strengthGroups[n.index][group] = strengths[n.index] + (group === n.hullId ? FACTOR : -FACTOR);
      });
    });
  }

  function accumulate(quad: QuadNode | QuadNodes) {
    let nodeStrength = 0;
    let weight = 0;
    const groupCounts: { [group: string]: number } = {};

    // For internal nodes, accumulate forces from child quadrants.
    if (Array.isArray(quad)) {
      let x = 0;
      let y = 0;
      for (const q of quad) {
        if (!q) {
          continue;
        }

        const c = Math.abs(q.value);
        if (!c) {
          continue;
        }

        nodeStrength += q.value;
        weight += c;
        x += c * q.x;
        y += c * q.y;

        Object.keys(q.groups).map((group) => {
          if (groupCounts[group] === undefined) {
            groupCounts[group] = 0;
          }

          groupCounts[group] += q.groups[group];
        });
      }
      quad.x = x / weight;
      quad.y = y / weight;
    } else {
      let q = quad;
      q.x = q.data.x;
      q.y = q.data.y;
      do {
        nodeStrength += strengths[q.data.index];

        if (q.data.hullId !== undefined) {
          if (groupCounts[q.data.hullId] === undefined) {
            groupCounts[q.data.hullId] = 0;
          }

          groupCounts[q.data.hullId]++;
        }

        q = q.next;
      } while (q);
    }

    quad.value = nodeStrength;
    quad.groups = groupCounts;
  }

  function apply(quad: QuadNode, x1: number, _: number, x2: number) {
    if (!quad.value) { return true; }
    const data = quad.data;

    // The only this that is different from the d3-force implementation is the following line
    // We add node.width / 2 and node.height / 2 to get the force to happen from the center of the nodes
    let x = quad.x - (node.x + node.width / 2);
    let y = quad.y - (node.y + node.height / 2);
    let w = x2 - x1;
    let l = x * x + y * y;

    // Apply the Barnes-Hut approximation if possible.
    // Limit forces for very close nodes; randomize direction if coincident.
    if (w * w / l < theta2) {
      if (l < distanceMax2) {
        if (x === 0) {
          x = jiggle();
          l += x * x;
        }

        if (y === 0) {
          y = jiggle();
          l += y * y;
        }

        if (l < distanceMin2) {
          l = Math.sqrt(distanceMin2 * l);
        }

        let value: number = quad.value;
        if (node.hullId !== undefined) {
          const groupCounts = quad.groups;
          Object.keys(groupCounts).forEach((group) => {
            const count = groupCounts[group];
            if (node.hullId === group) {
              value = Math.min(0, value + FACTOR * count);
            } else {
              value -= FACTOR * count;
            }
          });
        }

        // OK I added this to add a slight attraction force as nodes move away from each other
        // See an example graph here: https://www.desmos.com/calculator/u1nhry5ozb
        // The key this is that the nodes will start attracting after a distance of 800 (pixels I think)
        // The tanh makes it slightly gradual; however, I think think this does much given the scale.
        // Also 700 was kinda arbitrary. We could make it something the user could set and then set it
        // automatically based on the size of the users screen.
        // The 0.00005 if useful for making a slow transition between repulsion and attraction
        value = value * -Math.tanh(0.000005 * (l - 700 ** 2));

        node.vx += x * value * alpha / l;
        node.vy += y * value * alpha / l;
      }

      return true;
    } else if (Array.isArray(quad) || l >= distanceMax2) {
      return;
    }

    // Limit forces for very close nodes; randomize direction if coincident.
    if (data !== node || quad.next) {
      if (x === 0) {
        x = jiggle();
        l += x * x;
      }

      if (y === 0) {
        y = jiggle();
        l += y * y;
      }

      if (l < distanceMin2) {
        l = Math.sqrt(distanceMin2 * l);
      }
    }

    do {
      if (data !== node) {
        if (node.hullId !== undefined) {
          w = strengthGroups[data.index][node.hullId] * alpha / l;
        } else {
          w = strengths[data.index] * alpha / l;
        }
        node.vx += x * w;
        node.vy += y * w;
      }
      quad = quad.next;
    } while (quad);
  }

  force.initialize = (_: D3Node[]) => {
    nodes = _;
    groups = Array.from(new Set(nodes.map((n) => n.hullId))).filter(byUndefined);
    initialize();
  };

  type Func<T> = () => T;

  force.strength = (_: number | Func<number> | undefined) => {
    if (_ === undefined) {
      return strength;
    }

    if (typeof _ !== 'function') {
      _ = constant(+_);
    }

    strength = _;
    initialize();

    return force;
  };

  force.distanceMin = (_: number | undefined) => {
    if (_ === undefined) {
      return Math.sqrt(distanceMin2);
    }

    distanceMin2 = _ * _;
    return force;
  };

  force.distanceMax = (_?: number) => {
    if (_ === undefined) {
      return Math.sqrt(distanceMax2);
    }

    distanceMax2 = _ * _;
    return force;
  };

  force.theta = (_?: number) => {
    if (_ === undefined) {
      return Math.sqrt(theta2);
    }

    theta2 = _ * _;
    return force;
  };

  return force;
}
