// Please refer to the d3 index.d.ts file for further documentation

declare module '@/link' {
  import { SimulationNodeDatum, SimulationLinkDatum, ForceLink } from 'd3';
  
  export default function forceLink<
    NodeDatum extends SimulationNodeDatum, 
    LinksDatum extends SimulationLinkDatum<NodeDatum>
  >(links: LinksDatum[]): ForceLink<NodeDatum, LinksDatum>;
}
