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
import { ID3, D3Link, D3Node, D3Hull, D3NodeCallbackKeys, D3NodeColorCombo } from '@/d3';
import forceLink from '@/link';
import forceManyBody from '@/manyBody';
import { makeLookup, Lookup, intersection, createComponent, getRandomColor } from '@/utils';
import { computed, watch, onMounted, value } from 'vue-function-api';

type HullListener = (node: D3Hull) => void;
type NodeListener = (node: D3Node) => void;

interface MyLink extends D3Link {
  color: string;
}

// This id is used to ensure that the ID atttribute doesn't conflict with others
// Since id is global
let id = 0;

export default createComponent({
  name: 'D3',
  props: {
    defaultStrokeColor: { type: String, default: '#000' },
    arrows: { type: Boolean, default: false },
    force: { type: Boolean, default: false },
    drag: { type: Boolean, default: false },
    hulls: { type: Boolean, default: false },
    height: { type: Number, default: 100 },
    width: { type: Number, default: 100 },
    arrowSize: { type: Number, default: 6 },
    hullOffset: { type: Number, default: 40 },
    nodes: { type: Array as () => D3Node[], default: () => [] },
    links: { type: Array as () => D3Link[], default: () => [] },
    hullClick: { type: Function as any as  () => HullListener | undefined, required: false },
    hullDblclick: { type: Function as any as () => HullListener | undefined, required: false },
    nodeDblclick: { type: Function as any as () => NodeListener | undefined, required: false },
    actionClick: { type: Function as any as () => NodeListener | undefined, required: false },
    colorChanges: { type: Array as () => D3NodeColorCombo[], default: () => [] },
  },
  setup(props, context) {
    const addedLinks = value<MyLink[]>([]);
    const addedNodes = value<D3Node[]>([]);
    let selection: d3.Selection<any, D3Node, any, any> | null = null;
    const curve = d3.line().curve(d3.curveCardinalClosed.tension(0.85));

    let colorIndex = 0;
    const colorLookup: Lookup<string> = {};
    const colors = [
      '#1f77b4',
      '#ff7f0e',
      '#2ca02c',
      '#d62728',
      '#9467bd',
      '#8c564b',
      '#e377c2',
      '#7f7f7f',
      '#bcbd22',
      '#17becf',
    ];

    const allNodes = computed(() => {
      return [
        ...addedNodes.value,
        ...props.nodes,
      ];
    });

    const allLinks = computed((): MyLink[] => {
      const links = [...props.links, ...addedLinks.value];

      return links.map((link) => ({
        ...link,
        color: link.color ? link.color : props.defaultStrokeColor,
      }));
    });

    const nodeLookup = computed(() => {
      return makeLookup(allNodes.value);
    });

    function fill(d: { group: number }) {
      if (!colorLookup[d.group]) {
        if (colorIndex < colors.length) {
          colorLookup[d.group] = colors[colorIndex];
          colorIndex++;
        } else {
          colorLookup[d.group] = getRandomColor();
        }
      }

      return colorLookup[d.group];
    }

    function addLink(link: D3Link) {
      addedLinks.value.push({
        ...link,
        color: link.color ? link.color : props.defaultStrokeColor,
      });
    }

    function addNode(node: D3Node) {
      addedNodes.value.push(node);
    }

    function convexHulls() {
      const hulls: { [group: string]: { points: Array<[number, number]>, nodes: D3Node[] } } = {};
      const offset = props.hullOffset;
      // create point sets
      allNodes.value.forEach((n) => {
        if (n.hullGroup === undefined) {
          // Skip allNodes that aren't in a group
          return;
        }

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

    function applyNode(s: d3.Selection<any, D3Node, any, any>) {
      s
        .attr('id', (d) => d.id)
        .attr('width', (d) => d.width)
        .attr('height', (d) => d.height)
        .attr('fill', (d) => 'white')
        .style('stroke-width', 3)
        .attr('rx', (d) => d.rx)
        // If there is a force, then the position will be set by the force
        // If this check didn't happen, we would set the position twice which causes issues
        .attr('x', (d) => props.force ? 0 : d.x)
        .attr('y', (d) => props.force ? 0 : d.y)
        .style('stroke', (d) => d.stroke);
    }

    function applyText(s: d3.Selection<any, D3Node, any, any>) {
      s
        .filter((d) => d.text !== undefined)
        .attr('id', (d) => `text-${d.id}`)
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
    }

    function doRender() {
      const svg = d3.select(context.refs.svg as Element);
      svg.selectAll('*').remove();

      const checkAndCall = <V>(f?: (v: V) => void) => (v: V) => {
        if (f) {
          f(v);
        }
      };

      let hull: d3.Selection<any, any, any, any> | null = null;
      if (props.hulls) {
        hull = svg.append('g')
          .attr('class', 'hulls')
          .selectAll('path')
          .data(convexHulls())
          .enter().append('path')
          .attr('class', 'hull')
          .attr('d', (d) => curve(d.path))
          .style('fill', fill)
          .style('opacity', 0.5);

        hull.on('click', checkAndCall(props.hullClick));
        hull.on('dblclick', checkAndCall(props.hullDblclick));
      }

      let simulation: null | d3.Simulation<D3Node, undefined> = null;
      if (props.force) {
        simulation = d3.forceSimulation(allNodes.value)
          .force('link', forceLink<D3Node, D3Link>(allLinks.value).id((d) => '' + d.id).strength(0.3))
          .velocityDecay(0.5)
          .force('charge', forceManyBody().strength(-1000))
          // .force('group', hullForce())
          .force('center', d3.forceCenter(props.width / 2, props.height / 2));
      }

      const data = allLinks.value.map(({ color }) => color);

      if (props.arrows) {
        svg.append('svg:defs').selectAll('marker')
          .data(data)  // Different link/path types can be defined here
          .enter().append('svg:marker')  // This section adds in the arrows
          .attr('id', (d) => `${id}-${d}`)
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 10)
          .attr('refY', 0)
          .attr('markerWidth', props.arrowSize)
          .attr('markerHeight', props.arrowSize)
          .attr('orient', 'auto')
          .append('svg:path')
          .style('fill', (d) => d)
          .attr('d', 'M0,-5L10,0L0,5');
      }

      const bigLinks = svg.append('g')
        .attr('stroke-opacity', 0)
        .selectAll('line')
        .data(allLinks.value)
        .join('line')
        .attr('stroke-width', (d) => 6)
        .attr('stroke', (d) => d.color)
        .on('click', (d) => {
          if (d.onDidClick) {
            d.onDidClick(d3.event);
          }
        });

      const link = svg.append('g')
        .attr('stroke-opacity', 0.6)
        .selectAll('line')
        .data(allLinks.value)
        .join('line')
        .style('pointer-events', 'none')
        .attr('stroke-width', (d) => 3)
        .attr('stroke', (d) => d.color);

      if (!simulation) {

        // This function only works for hotizontal arrows
        // It can be generialized for vertical arrows though if neccessary
        const calcPosition = (xy: 'x' | 'y', st: 'source' | 'target') => (d: D3Link) => {
          const source = nodeLookup.value[d.source];
          const target = nodeLookup.value[d.target];
          const sourcePosition = source[xy];
          const targetPosition = target[xy];
          const greater = targetPosition > sourcePosition;

          const node = nodeLookup.value[d[st]];
          const toAdd = xy === 'y' ? node.height / 2 : !greater ? node.width : 0;
          return node[xy] + toAdd;
        };

        link
          .attr('x1', calcPosition('x', 'source'))
          .attr('y1', calcPosition('y', 'source'))
          .attr('x2', calcPosition('x', 'target'))
          .attr('y2', calcPosition('y', 'target'));
      }

      if (props.arrows) {
        // This, along with the defs above, adds the arrows
        link.attr('marker-end', (d) => `url(#${id}-${d.color})`);
      }

      const g = selection = svg.append('g')
        .attr('stroke', '#fff')
        .selectAll('.node')
        .data(allNodes.value)
        .join('g')
        .attr('class', 'node');

      applyNode(g.append('rect'));

      const checkAndCallV2 = (key: D3NodeCallbackKeys) => (d: D3Node) => {
        const cb = d[key];
        if (cb) {
          cb(d3.event);
        }
      };

      g.on('click', checkAndCallV2('onDidClick'));
      g.on('dblclick', checkAndCallV2('onDidDblclick'));
      g.on('mousedown', checkAndCallV2('onDidMousedown'));
      g.on('contextmenu', checkAndCallV2('onDidRightClick'));

      if (props.drag) {
        // I can't get the types to work out for some reason, this definitely works though
        // you can see that I cast as `any` at the end
        const drag = d3.drag<any, d3.SimulationNodeDatum>()
          .on('start', (d) => {
            if (simulation && !d3.event.active) { simulation.alphaTarget(0.3).restart(); }
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (d) => {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
          })
          .on('end', (d) => {
            if (simulation && !d3.event.active) { simulation.alphaTarget(0); }
            d.fx = null;
            d.fy = null;
          });
        g.call(drag as any);
      }

      applyText(g.append('text'));

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
        .on('click', checkAndCallV2('onDidActionClick'));

      if (simulation) {
        simulation.on('tick', () => {
          if (hull && !hull.empty()) {
            hull
              .data(convexHulls())
              .attr('d', (d) => curve(d.path));
          }

          const middle = (node: D3Node) => {
            return {
              x: node.x + node.width / 2,
              y: node.y + node.height / 2,
            };
          };

          const getIntersection = (source: D3Node, target: D3Node) => {
            const tl = { x: target.x, y: target.y };
            const tr = { x: target.x + target.width, y: target.y };
            const bl = { x: target.x, y: target.y + target.height };
            const br = { x: target.x + target.width, y: target.y + target.height };

            const middleOfTarget = middle(target);
            const middleOfSource = middle(source);

            const p1 = intersection(middleOfTarget, middleOfSource, tl, tr);
            const p2 = intersection(middleOfTarget, middleOfSource, tr, br);
            const p3 = intersection(middleOfTarget, middleOfSource, br, bl);
            const p4 = intersection(middleOfTarget, middleOfSource, bl, tl);

            // We only ever need to check two points depending on the relative location of the source node compared to
            // target node.
            let points: Array<ReturnType<typeof intersection>>;
            if (middleOfTarget.x > middleOfSource.x && middleOfTarget.y > middleOfSource.y) {
              points = [p1, p4];
            } else if (middleOfTarget.x < middleOfSource.x && middleOfTarget.y > middleOfSource.y) {
              points = [p1, p2];
            } else if (middleOfTarget.x > middleOfSource.x && middleOfTarget.y < middleOfSource.y) {
              points = [p3, p4];
            } else {
              points = [p2, p3];
            }

            for (const p of points) {
              if (!p) {
                continue;
              }

              if (!p.onLine1 || !p.onLine2) {
                continue;
              }

              return {
                center: middleOfTarget,
                point: p,
              };
            }

            // This occurs if the target is within the source
            return {
              center: middleOfTarget,
              point: {
                x: middleOfTarget.x,
                y: middleOfTarget.y,
              },
            };
          };

          // Unfortunently, it seems like I need to add these weird type cast statements here
          // The following code is perfectly fine so the d3 typings must be wrong
          link
            .attr('x1', (d) => {
              const source = d.source as any as D3Node;
              return source.x + source.width / 2;
            })
            .attr('y1', (d) => {
              const source = d.source as any as D3Node;
              return source.y + source.height / 2;
            })
            .attr('x2', (d) => {
              const { point, center } = getIntersection(d.source as any as D3Node, d.target as any as D3Node);
              return center.x + point.x - center.x;
            })
            .attr('y2', (d) => {
              const { point, center } = getIntersection(d.source as any as D3Node, d.target as any as D3Node);
              return center.y + point.y - center.y;
            });

          // We are duplicating the calculations/logic from above
          // We could easily optimize if neccessary
          bigLinks
            .attr('x1', (d) => {
              const source = d.source as any as D3Node;
              return source.x + source.width / 2;
            })
            .attr('y1', (d) => {
              const source = d.source as any as D3Node;
              return source.y + source.height / 2;
            })
            .attr('x2', (d) => {
              const { point, center } = getIntersection(d.source as any as D3Node, d.target as any as D3Node);
              return center.x + point.x - center.x;
            })
            .attr('y2', (d) => {
              const { point, center } = getIntersection(d.source as any as D3Node, d.target as any as D3Node);
              return center.y + point.y - center.y;
            });

          g
            .attr('transform', (d) => `translate(${d.x}, ${d.y})`);
        });
      }

      // make sure we increase the id for next time render of this component
      id++;
    }

    function setStrokeColor(node: D3Node, color: string) {
      node.stroke = color;
      if (selection) {
        selection.select(`#${node.id}`)
          .style('stroke', (d) => d.stroke);
      }
    }

    watch(() => props.colorChanges, () => {
      props.colorChanges.forEach((colorAndNode) => {
        setStrokeColor(colorAndNode.node, colorAndNode.color);
      });

      if (props.colorChanges.length) {
        props.colorChanges.splice(0, props.colorChanges.length);
      }
    });

    onMounted(doRender);
    watch(allNodes, doRender);
    watch(allLinks, doRender);

    return {
      addNode,
      addLink,
    };
  },
});
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
