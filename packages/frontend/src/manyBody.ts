import { quadtree } from 'd3-quadtree';
import { D3Node } from './d3';

function xGetter(d: any) {
  return d.x;
}

function yGetter(d: any) {
  return d.y;
}

function constant(x: any) {
  return function() {
    return x;
  };
}

function jiggle() {
  return (Math.random() - 0.5) * 1e-6;
}

export default function() {
  let nodes: D3Node[];
  let node: D3Node;
  let alpha: number;
  let strength = constant(-30);
  let strengths: number[];
  let distanceMin2 = 1;
  let distanceMax2 = Infinity;
  let theta2 = 0.81;

  function force(_: any) {
    let i;
    const n = nodes.length;
    const tree = quadtree(nodes, xGetter, yGetter).visitAfter(accumulate);
    for (alpha = _, i = 0; i < n; ++i) { node = nodes[i], tree.visit(apply); }
  }

  function initialize() {
    if (!nodes) { return; }
    let i;
    const n = nodes.length;
    let node;
    strengths = new Array(n);
    for (i = 0; i < n; ++i) {
      node = nodes[i];
      strengths[node.index] = +strength();
    }
  }

  function accumulate(quad: any) {
    let strength = 0;
    let q;
    let c;
    let weight = 0;
    let x;
    let y;
    let i;

    // For internal nodes, accumulate forces from child quadrants.
    if (quad.length) {
      for (x = y = i = 0; i < 4; ++i) {
        if ((q = quad[i]) && (c = Math.abs(q.value))) {
          strength += q.value, weight += c, x += c * q.x, y += c * q.y;
        }
      }
      quad.x = x / weight;
      quad.y = y / weight;
    } else {
      q = quad;
      q.x = q.data.x;
      q.y = q.data.y;
      do {
        strength += strengths[q.data.index];
        q = q.next;
      } while (q);
    }

    quad.value = strength;
  }

  function apply(quad: any, x1: any, _: any, x2: any) {
    if (!quad.value) { return true; }

    // The only this that is different from the d3-force implementation is the following line
    // We add node.width / 2 and node.height / 2 to get the force to happen from the center of the nodes
    let x = quad.x - node.x - node.width / 2;
    let y = quad.y - node.y - node.height / 2;
    let w = x2 - x1;
    let l = x * x + y * y;

    // Apply the Barnes-Hut approximation if possible.
    // Limit forces for very close nodes; randomize direction if coincident.
    if (w * w / theta2 < l) {
      if (l < distanceMax2) {
        if (x === 0) { x = jiggle(), l += x * x; }
        if (y === 0) { y = jiggle(), l += y * y; }
        if (l < distanceMin2) { l = Math.sqrt(distanceMin2 * l); }
        node.vx += x * quad.value * alpha / l;
        node.vy += y * quad.value * alpha / l;
      }
      return true;
    } else if (quad.length || l >= distanceMax2) { return; }

    // Limit forces for very close nodes; randomize direction if coincident.
    if (quad.data !== node || quad.next) {
      if (x === 0) { x = jiggle(), l += x * x; }
      if (y === 0) { y = jiggle(), l += y * y; }
      if (l < distanceMin2) { l = Math.sqrt(distanceMin2 * l); }
    }

    do {
      if (quad.data !== node) {
        w = strengths[quad.data.index] * alpha / l;
        node.vx += x * w;
        node.vy += y * w;
      }
      quad = quad.next;
    } while (quad);
  }

  force.initialize = (_: D3Node[]) => {
    nodes = _;
    initialize();
  };

  type Func<T> = () => T;

  force.strength = (_: number | string | Func<string | number> | undefined) => {
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
