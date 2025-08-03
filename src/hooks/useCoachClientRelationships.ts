// Backwards compatibility file
// Redirects to useUserRelationships
export { 
  useCoachClientRelationships
} from './useUserRelationships';

export type { 
  UserRelationship as CoachClientRelationship,
  RelationshipStats 
} from './useUserRelationships';