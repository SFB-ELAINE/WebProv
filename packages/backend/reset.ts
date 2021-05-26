import fetch from 'node-fetch';
import fs from 'fs';
import {
  DependencyRelationship,
  InformationField,
  InformationRelationship,
  ProvenanceNode,
  RelationshipInformation,
  Study,
  ProvenanceNodeSchema,
  StudySchema,
  DependencyRelationshipSchema,
  InformationRelationshipSchema,
  InformationFieldSchema,
  ExportInterface,
  ExportInterfaceType,
} from 'common';
import * as c from 'common';
import { updateOrCreate, updateOrCreateConnection } from './src/cypher';

export const initializeData = async (data: ExportInterface) => {
  // We don't want to do this unless we are debugging
  // clearDatabase();

  console.log('Creating ' + data.provenanceNodes.length + ' Nodes');
  for (const node of data.provenanceNodes) {
    const result = await updateOrCreate(ProvenanceNodeSchema, node);
    if (result.result === 'error') {
      console.error(`ERROR: Error creating node: ${result.message}`);
    }
  }

  for (const study of data.studies) {
    const result = await updateOrCreate(StudySchema, study);
    if (result.result === 'error') {
      console.error(`ERROR: Error creating study: ${result.message}`);
    }
  }

  for (const field of data.informationFields) {
    const result = await updateOrCreate(InformationFieldSchema, field);
    if (result.result === 'error') {
      console.error(`ERROR: Error creating field: ${result.message}`);
    }
  }

  console.log(
    'Creating ' + data.dependencyRelationships.length + ' dependencies',
  );
  for (const dependency of data.dependencyRelationships) {
    const result = await updateOrCreateConnection(
      DependencyRelationshipSchema,
      dependency,
    );

    if (result.result === 'error') {
      console.error(`ERROR: Error creating dependency: ${result.message}`);
    }
  }

  for (const relationship of data.informationRelationships) {
    await updateOrCreateConnection(InformationRelationshipSchema, relationship);
  }
};

const main = async () => {
  const links = [
    'https://github.com/SFB-ELAINE/SI_Provenance_Wnt_Family/blob/main/WebProvExport/2003Lee_isolated.json',
    'https://github.com/SFB-ELAINE/SI_Provenance_Wnt_Family/blob/main/WebProvExport/WD_2001Lee.json',
    'https://github.com/SFB-ELAINE/SI_Provenance_Wnt_Family/blob/main/WebProvExport/WD_2003Dajani.json',
    'https://github.com/SFB-ELAINE/SI_Provenance_Wnt_Family/blob/main/WebProvExport/WD_2000Salic.json',
  ];

  const raw = links.map((link) => {
    const [_, end] = link.split('com');
    const [before, after] = end.split('blob/');
    return 'https://raw.githubusercontent.com' + before + after;
  });

  const data: {
    provenanceNodes: unknown[];
    informationFields: unknown[];
    informationRelationships: unknown[];
    dependencyRelationships: unknown[];
    studies: unknown[];
  } = {
    provenanceNodes: [],
    informationFields: [],
    informationRelationships: [],
    dependencyRelationships: [],
    studies: [],
  };

  for (const url of raw) {
    const res = await fetch(url);
    const json = await res.json();
    data.provenanceNodes.push(...json.provenanceNodes);
    data.informationFields.push(...json.informationFields);
    data.informationRelationships.push(...json.informationRelationships);
    data.dependencyRelationships.push(...json.dependencyRelationships);
    data.studies.push(...json.studies);
  }

  const result = ExportInterfaceType.decode(data);
  if (c.isLeft(result)) {
    console.log(
      'Data is not in expected format\n\n' +
        c.PathReporter.report(result).join('\n\n'),
    );

    return;
  }

  initializeData(result.right);
};

main();
