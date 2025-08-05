// Backwards compatibility file
// Redirects to useUserRelationships (NEW ATTRIBUT SYSTEM)
export { 
  useUserRelationships as useCoachClientRelationships
} from './useUserRelationships';

export type { 
  UserRelationship as CoachClientRelationship,
  RelationshipStats 
} from './useUserRelationships';