import { misconceptionCatalog, getMisconceptionDefinition } from '../../lib/domain/learning/misconceptions';

export { misconceptionCatalog, getMisconceptionDefinition };

export const misconceptionsDictionary = Object.fromEntries(
  Object.entries(misconceptionCatalog).map(([key, definition]) => [
    key,
    {
      id: key,
      title: definition.title,
      explanation: definition.description,
      relatedStepIds: definition.relatedSkills,
      remediationConceptId: definition.relatedSkills[0]
    }
  ])
);
