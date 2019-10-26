import exported from './assets/web-provenance-export.json';
import { 
  ProvenanceNode,
  uniqueId, 
  Study, 
  DependencyRelationship, 
  RelationshipInformation, 
  InformationField,
  makeLookup,
  flat,
  isDefined,
  DependencyType,
} from 'common';

const typeToDefinition: { [k: string]: string } = {
  'wet-lab-data': 'WetLabData',
  'model': 'Model',
}

const studyIdMap: { [k: number]: string } = {};

export const studies: Study[] = exported.models.filter(study => study !== null).map((study) => {
    const studyId = uniqueId();
    studyIdMap[study!.id] = studyId;
    return {
        id: studyId,
        source: study!.source,
    }
});

export const nodes: ProvenanceNode[] = Object.values(exported.nodes).map((node) => {
    const definitionId = typeToDefinition[node.type];
    if (!definitionId) {
        throw Error('Lookup does not contain ' + node.type);
    }

    return {
        id: node.id,
        definitionId: definitionId,
        studyId: node.studyId !== undefined ? studyIdMap[node.studyId] : undefined,
        label: node.name,
    }
});


type Dependency = RelationshipInformation<DependencyRelationship>
export const dependencies: Array<Dependency> = flat(Object.values(exported.nodes).map((node) => {
    if (!node.connections) {
        return;
    }

    return node.connections.map((connection) => {
        return {
            source: node.id,
            target: connection.targetId,
            properties: {
                id: connection.id,
                type: connection.type as DependencyType,
            }
        }
    });
}).filter(isDefined));


export const informationFields: InformationField[] = flat(Object.values(exported.nodes).map((node) => {
    if (!node.information) {
        return;
    }

    return node.information.map((information): InformationField => {
        return {
            id: uniqueId(),
            key: information[0],
            value: information[1],
        }
    })
}).filter(isDefined));