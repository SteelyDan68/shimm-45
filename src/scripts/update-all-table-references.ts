/**
 * ========================================================
 * SCRIPT: UPPDATERA ALLA TABELL-REFERENSER
 * Single Source of Truth Implementation
 * ========================================================
 * 
 * Detta script kan köras för att systematiskt uppdatera alla
 * förekomster av gamla tabellnamn till de nya enhetliga namnen
 */

// Gamla tabellnamn -> Nya tabellnamn
export const TABLE_MIGRATIONS = {
  'client_data_cache': 'user_data_cache',
  'client_data_containers': 'user_data_containers', 
  'client_pillar_activations': 'user_pillar_activations',
  'client_pillar_assignments': 'user_pillar_assignments'
};

// Lista över filer som behöver uppdateras
export const FILES_TO_UPDATE = [
  'src/hooks/useRealCoachDashboard.ts',
  'src/hooks/useRealDataBindings.ts', 
  'src/hooks/useSixPillarsModular.ts',
  'src/hooks/useUserPillars.ts',
  'src/hooks/useIntelligenceHub.ts',
  'src/hooks/useUnifiedUserData.ts',
  'src/hooks/useUnifiedUserManagement.ts',
  'src/components/AdminPillarManagement.tsx',
  'src/components/UnifiedUserProfile/RealUserData.tsx'
];

export function updateTableReference(content: string): string {
  let updatedContent = content;
  
  Object.entries(TABLE_MIGRATIONS).forEach(([oldTable, newTable]) => {
    // Uppdatera .from() anrop
    const fromRegex = new RegExp(`\\.from\\(['"\`]${oldTable}['"\`]\\)`, 'g');
    updatedContent = updatedContent.replace(fromRegex, `.from('${newTable}')`);
    
    // Uppdatera on() ändringar för realtime
    const onChangeRegex = new RegExp(`table: ['"\`]${oldTable}['"\`]`, 'g');
    updatedContent = updatedContent.replace(onChangeRegex, `table: '${newTable}'`);
    
    // Uppdatera kommentarer och dokumentation
    const commentRegex = new RegExp(oldTable, 'g');
    updatedContent = updatedContent.replace(commentRegex, newTable);
  });
  
  return updatedContent;
}

console.log('Table migration mappings:', TABLE_MIGRATIONS);
console.log('Files to update:', FILES_TO_UPDATE);