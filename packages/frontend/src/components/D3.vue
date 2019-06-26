<template>
    <svg 
      ref="svg" 
      class="svg"
      :height="height"
      :width="width"
    ><slot></slot></svg>
</template>

<script lang="ts">
import * as d3 from 'd3';
import { CB, emitter, ID3, D3Link, D3Node, D3Hull, D3NodeCallbackKeys } from '@/d3';
import { Component, Vue, Prop } from 'vue-property-decorator';
import forceLink from '@/link';
import forceManyBody from '@/manyBody';
import { makeLookup, Lookup, Watch } from '@/utils';

interface MyLink extends D3Link {
  color: string;
}

const ordinalScale = d3.scaleOrdinal(d3.schemeCategory10);

// This id is used to ensure that the ID atttribute doesn't conflict with others
// Since id is global
let id = 0;
let factor = 10;

const hullForce = () => {
  interface Point {
    x: number;
    y: number;
  }

  interface PointWithCenter extends Point {
    count: number;
  }

  let nodes: D3Node[] = [];

  const force = () => {
    const centers: Lookup<PointWithCenter> = {};

    nodes.forEach(({ x, y, hullGroup }) => {
      if (hullGroup === undefined) {
        return;
      }

      if (!centers.hasOwnProperty(hullGroup)) {
        centers[hullGroup] = { x: 0, y: 0, count: 0 };
      }

      const center = centers[hullGroup];
      center.y += y;
      center.x += x;
      center.count++;
    });

    Object.values(centers).forEach((center) => {
      center.x /= center.count;
      center.y /= center.count;
    });


    const calcChangeInSpeed = (from: Point, to: Point) => {
      let x = to.x - from.x;
      let y = to.y - from.y;
      const distance = (x ** 2 + y ** 2) ** 0.5;
      if (distance !== 0) {
        x /= distance ** 2;
        y /= distance ** 2;
      }

      return {
        vx: x * factor,
        vy: y * factor,
      };
    };

    nodes.forEach((node, i) => {
      if (node.hullGroup === undefined) {
        return;
      }

      const v = calcChangeInSpeed(node, centers[node.hullGroup]);
      // node.vx += v.vx;
      // node.vy += v.vy;
    });
  };

  force.initialize = (_: D3Node[]) => {
    nodes = _;
  };

  force.factor = (_: number) => {
    factor = _;
  };


  return force;
};

@Component
export default class D3<N extends D3Node> extends Vue implements ID3<N> {
  @Prop({ type: String, default: '#000' }) public defaultStrokeColor!: string;
  @Prop({ type: Boolean, default: false }) public arrows!: boolean;
  @Prop({ type: Boolean, default: false }) public force!: boolean;
  @Prop({ type: Boolean, default: false }) public drag!: boolean;
  @Prop({ type: Boolean, default: false }) public hulls!: boolean;
  @Prop({ type: Number, default: 100 }) public height!: number;
  @Prop({ type: Number, default: 100 }) public width!: number;
  @Prop({ type: Number, default: 6 }) public arrowSize!: number;
  @Prop({ type: Number, default: 40 }) public hullOffset!: number;
  @Prop({ type: Array, default: () => [] }) public nodes!: D3Node[];
  @Prop({ type: Array, default: () => [] }) public links!: D3Link[];
  @Prop({ type: Function, required: false }) public hullClick?: (node: D3Hull) => void;
  @Prop({ type: Function, required: false }) public hullDblclick?: (node: D3Hull) => void;
  @Prop({ type: Function, required: false }) public nodeDblclick?: (node: D3Node) => void;
  @Prop({ type: Function, required: false }) public actionClick?: (node: D3Node) => void;

  public isD3: true = true;
  public addedLinks: MyLink[] = [];
  public addedNodes: D3Node[] = [];

  public selection: d3.Selection<any, D3Node, any, any> | null = null;

  public curve = d3.line().curve(d3.curveCardinalClosed.tension(0.85));

  get allNodes() {
    return [
      ...this.addedNodes,
      ...this.nodes,
    ];
  }

  get allLinks(): MyLink[] {
    const links = [...this.links, ...this.addedLinks];

    return links.map((link) => ({
      ...link,
      color: link.color ? link.color : this.defaultStrokeColor,
    }));
  }

  get nodeLookup() {
    return makeLookup(this.allNodes);
  }

  public fill(d: { group: number }) {
    return ordinalScale('' + d.group);
  }

  public addLink(link: D3Link) {
    this.addedLinks.push({
      ...link,
      color: link.color ? link.color : this.defaultStrokeColor,
    });
  }

  public addNode(node: D3Node) {
    this.allNodes.push(node);
  }

  public calcWidth(text?: string) {
    // 8 just kinda works well (10 is the padding)
    return (text === undefined ? 0 : text.length * 8) + 10;
  }

  public convexHulls() {
    const hulls: { [group: string]: { points: Array<[number, number]>, nodes: D3Node[] } } = {};
    const offset = this.hullOffset;
    // create point sets
    this.allNodes.forEach((n) => {
      if (n.hullGroup === undefined) {
        // Skip allNodes that aren't in a group
        return;
      }

      // eslint-disable-next-line
      const i = n.hullGroup;
      const l = hulls[i] || (hulls[i] = { points: [], nodes: [] });

      interface Point {
        x: number;
        y: number;
      }

      l.nodes.push(n);

      // There are 4 corners and each needs to be checked
      // We add/subtract an offset to each corner depending on which corner it is
      // For example, for the top left corner, we subtract the offset from the x AND y
      l.points.push([n.x - offset, n.y - offset]);
      l.points.push([n.x + n.width + offset, n.y - offset]);
      l.points.push([n.x + n.width + offset, n.y + n.height + offset]);
      l.points.push([n.x - offset, n.y + n.height + offset]);
    });
    // create convex hulls
    const hullset: D3Hull[] = [];
    for (const i of Object.keys(hulls)) {
      const path = d3.polygonHull(hulls[i].points);
      if (!path) {
        continue;
      }

      hullset.push({
        group: Number.parseInt(i, 10),
        nodes: hulls[i].nodes,
        path,
      });
    }
    return hullset;
  }

  public doRender() {
    const svg = d3.select(this.$refs.svg as Element);
    svg.selectAll('*').remove();

    const checkAndCall = <V>(f?: (v: V) => void) => (v: V) => {
      if (f) {
        f(v);
      }
    };

    let hull: d3.Selection<any, any, any, any> | null = null;
    if (this.hulls) {
      hull = svg.append('g')
        .attr('class', 'hulls')
        .selectAll('path')
        .data(this.convexHulls())
        .enter().append('path')
        .attr('class', 'hull')
        .attr('d', (d) => this.curve(d.path))
        .style('fill', this.fill)
        .style('opacity', 0.5);

      hull.on('click', checkAndCall(this.hullClick));
      hull.on('dblclick', checkAndCall(this.hullDblclick));
    }

    let simulation: null | d3.Simulation<D3Node, undefined> = null;
    if (this.force) {
      simulation = d3.forceSimulation(this.allNodes)
        .force('link', forceLink<D3Node, D3Link>(this.allLinks).id((d) => d.id).strength(0.3))
        .velocityDecay(0.5)
        .force('charge', forceManyBody().strength(-1000))
        // .force('group', hullForce())
        .force('center', d3.forceCenter(this.width / 2, this.height / 2));
    }

    const data = this.allLinks.map(({ color }) => color);

    if (this.arrows) {
      svg.append('svg:defs').selectAll('marker')
        .data(data)  // Different link/path types can be defined here
        .enter().append('svg:marker')  // This section adds in the arrows
        .attr('id', (d) => `${id}-${d}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10)
        .attr('refY', 0)
        .attr('markerWidth', this.arrowSize)
        .attr('markerHeight', this.arrowSize)
        .attr('orient', 'auto')
        .append('svg:path')
        .style('fill', (d) => d)
        .attr('d', 'M0,-5L10,0L0,5');
    }

    const link = svg.append('g')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(this.allLinks)
      .join('line')
      .attr('stroke-width', (d) => 3)
      .attr('stroke', (d) => d.color);

    link.on('click', (d) => {
      if (d.onDidClick) {
        d.onDidClick(d3.event);
      }
    });

    if (!simulation) {
      const calcPosition = (xy: 'x' | 'y', st: 'source' | 'target') => (d: D3Link) => {
        const node = this.nodeLookup[d[st]];
        const toAdd = xy === 'y' ? node.height / 2 : st === 'source' ? node.width : 0;
        return node[xy] + toAdd;
      };

      link
        .attr('x1', calcPosition('x', 'source'))
        .attr('y1', calcPosition('y', 'source'))
        .attr('x2', calcPosition('x', 'target'))
        .attr('y2', calcPosition('y', 'target'));
    }

    if (this.arrows) {
      // This, along with the defs above, adds the arrows
      link.attr('marker-end', (d) => `url(#${id}-${d.color})`);
    }

    const g = this.selection = svg.append('g')
      .attr('stroke', '#fff')
      .selectAll('.node')
      .data(this.allNodes)
      .join('g')
      .attr('class', 'node');

    g
      .append('rect')
      .attr('id', (d) => d.id)
      .attr('width', (d) => d.width)
      .attr('height', (d) => d.height)
      .attr('fill', (d) => 'white')
      .style('stroke-width', 3)
      .attr('rx', (d) => d.rx)
      // If there is a force, then the position will be set by the force
      // If this check didn't happen, we would set the position twice which causes issues
      .attr('x', (d) => this.force ? 0 : d.x)
      .attr('y', (d) => this.force ? 0 : d.y)
      .style('stroke', (d) => d.stroke);

    const checkAndCallV2 = (key: D3NodeCallbackKeys) => (d: D3Node) => {
      const cb = d[key];
      if (cb) {
        cb(d3.event, this);
      }
    };

    g.on('click', checkAndCallV2('onDidClick'));
    g.on('dblclick', checkAndCallV2('onDidDblclick'));
    g.on('mousedown', checkAndCallV2('onDidMousedown'));
    g.on('contextmenu', checkAndCallV2('onDidRightClick'));
    g.on('dblclick', checkAndCall(this.nodeDblclick)); // TODO FIX THIS

    if (this.drag) {
      // I can't get the types to work out for some reason, this definitely works though
      // you can see that I cast as `any` at the end
      const drag = d3.drag()
        .on('start', (d: d3.SimulationNodeDatum) => {
          if (simulation && !d3.event.active) { simulation.alphaTarget(0.3).restart(); }
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (d: d3.SimulationNodeDatum) => {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        })
        .on('end', (d: d3.SimulationNodeDatum) => {
          if (simulation && !d3.event.active) { simulation.alphaTarget(0); }
          d.fx = null;
          d.fy = null;
        });
      g.call(drag as any);
    }

    g.append('text')
      .filter((d) => d.text !== undefined)
      .attr('x', (d) => d.text!.length * 4 + 5)
      .attr('y', (d) => d.height / 2 + 5) // the extra 5 is just random
      .style('stroke-width', 0)
      .style('font-family', 'monospace')
      .style('pointer-events', 'none')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text((d) => {
        return d.text!;
      });

    g.append('text')
      .filter((d) => d.actionText !== undefined)
      .attr('x', (d) => d.actionText!.length * 3 - 2)
      .attr('y', (d) => d.height + 12)
      .style('stroke-width', 0)
      .style('font-family', 'monospace')
      .style('text-anchor', 'middle')
      .attr('class', 'action')
      .style('font-size', '10px')
      .text((d) => {
        return d.actionText!;
      })
      .on('click', checkAndCall(this.actionClick));

    if (simulation) {
      simulation.on('tick', () => {
        if (hull && !hull.empty()) {
            hull
              .data(this.convexHulls())
              .attr('d', (d) => this.curve(d.path));
          }

        // Unfortunently, it seems like I need to add these weird type –cast statements here
        // The following code is perfectly fine so the d3 typings must be wrong
        link
          .attr('x1', (d) => {
            const source = d.source as any as D3Node;
            return source.x;
          })
          .attr('y1', (d) => {
            const source = d.source as any as D3Node;
            return source.y + source.height / 2;
          })
          .attr('x2', (d) => {
            const target = d.target as any as D3Node;
            return target.x + this.calcWidth(target.text);
          })
          .attr('y2', (d) => {
            const target = d.target as any as D3Node;
            return target.y + target.height / 2;
          });

        g
          .attr('transform', (d) => `translate(${d.x}, ${d.y})`);
      });
    }

    // make sure we increase the id for next time render of this component
    id++;
  }

  public setStrokeColor(node: D3Node, color: string) {
    node.stroke = color;
    if (this.selection) {
      this.selection.select(`#${node.id}`)
        .style('stroke', (d) => d.stroke);
    }
  }

  public mounted() {
    this.doRender();
  }

  @Watch<D3<any>>('nodes')
  public reRenderNodes() {
    this.doRender();
  }

  @Watch<D3<any>>('links')
  public reRenderLinks() {
    this.doRender();
  }
}
</script>

<style lang="scss" scoped>
.svg {
  overflow: visible;
}

.svg ::v-deep .action:hover {
  text-decoration: underline;
  cursor: pointer;
}
</style>
