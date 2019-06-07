import * as d3 from 'd3';

interface LineOptions {
  arrows?: boolean;
  color?: string | string[];
}

interface HasColor {
  color: string;
}

export function addArrows<T extends HasColor>(
  svg: d3.Selection<any, any, any, any>, links: T[], opts?: LineOptions,
) {
  const {
    arrows = false,
  } = opts || {};

  if (arrows) {
    const data = links.map(({ color }) => color);

    svg.append('svg:defs').selectAll('marker')
      .data(data)  // Different link/path types can be defined here
      .enter().append('svg:marker')  // This section adds in the arrows
      .attr('id', (d) => `${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('svg:path')
      .style('fill', (d) => d)
      .attr('d', 'M0,-5L10,0L0,5');
  }

  return svg.append('g')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke-width', (d) => 3)
    .attr('stroke', (d) => d.color)
    // This, along with the defs above, adds the arrows
    .attr('marker-end', (d) => `url(#${d.color})`);
}
