/**
 * UNIFIED ASSESSMENT DATA SERVICE
 * 
 * Centraliserad service för all assessment-data som hanterar:
 * - Legacy data från path_entries
 * - Modern data från assessment_rounds  
 * - Automatisk synkronisering mellan källor
 * - Universell kompatibilitet för alla användare
 */

import { supabase } from '@/integrations/supabase/client';

export interface UnifiedAssessmentData {
  id: string;
  user_id: string;
  pillar_type: string;
  calculated_score: number;
  ai_analysis: string;
  assessment_data: any;
  created_at: string;
  updated_at: string;
  source: 'assessment_rounds' | 'path_entries' | 'hybrid';
  metadata: any;
}

export interface SaveAssessmentRequest {
  user_id: string;
  pillar_type: string;
  assessment_data: any;
  calculated_score: number;
  ai_analysis?: string;
  comments?: string;
}

class AssessmentDataService {
  /**
   * UNIVERSIELL LÄSNING: Hämtar assessment data från alla källor
   * Prioriterar assessment_rounds men använder path_entries som fallback
   */
  async getAssessments(userId: string): Promise<UnifiedAssessmentData[]> {
    console.log('🔄 AssessmentDataService: Loading unified data for user:', userId);

    try {
      // Parallell hämtning från båda källor
      const [assessmentRoundsResponse, pathEntriesResponse] = await Promise.all([
        // Primär källa: assessment_rounds
        supabase
          .from('assessment_rounds')
          .select('*')
          .eq('user_id', userId)
          .not('ai_analysis', 'is', null)
          .order('created_at', { ascending: false }),
        
        // Fallback källa: path_entries
        supabase
          .from('path_entries')
          .select('*')
          .eq('user_id', userId)
          .in('type', ['assessment', 'recommendation', 'analysis'])
          .eq('ai_generated', true)
          .not('details', 'is', null)
          .order('created_at', { ascending: false })
      ]);

      const { data: assessmentRounds, error: roundsError } = assessmentRoundsResponse;
      const { data: pathEntries, error: entriesError } = pathEntriesResponse;

      if (roundsError) {
        console.error('Error loading assessment rounds:', roundsError);
        throw roundsError;
      }

      console.log(`📊 Found ${assessmentRounds?.length || 0} assessment rounds, ${pathEntries?.length || 0} path entries`);

      // Transformera assessment_rounds till unified format
      const unifiedFromRounds: UnifiedAssessmentData[] = (assessmentRounds || []).map(round => {
        const scores = round.scores as any || {};
        const calculatedScore = scores[round.pillar_type] || scores.overall || 0;
        
        return {
          id: round.id,
          user_id: round.user_id,
          pillar_type: round.pillar_type,
          calculated_score: typeof calculatedScore === 'number' ? calculatedScore : parseFloat(calculatedScore) || 0,
          ai_analysis: round.ai_analysis || 'AI-analys inte tillgänglig',
          assessment_data: round.answers || {},
          created_at: round.created_at,
          updated_at: round.updated_at,
          source: 'assessment_rounds',
          metadata: {
            assessment_round_id: round.id,
            original_scores: scores,
            comments: round.comments
          }
        };
      });

      // Identifiera vilka pillar-typer som saknas från assessment_rounds
      const existingPillarTypes = new Set(unifiedFromRounds.map(a => a.pillar_type));
      
      // Transformera path_entries för saknade pillar-typer
      const unifiedFromEntries: UnifiedAssessmentData[] = (pathEntries || [])
        .filter(entry => {
          const metadata = entry.metadata as any || {};
          const pillarType = this.extractPillarType(entry, metadata);
          
          // Endast använd path_entries för pillar-typer som inte finns i assessment_rounds
          return pillarType && 
                 !existingPillarTypes.has(pillarType) && 
                 entry.details && 
                 entry.details.length > 100; // Säkerställ riktig analys
        })
        .map(entry => {
          const metadata = entry.metadata as any || {};
          const pillarType = this.extractPillarType(entry, metadata);
          const assessmentScore = metadata.assessment_score || 0;

          return {
            id: entry.id,
            user_id: entry.user_id,
            pillar_type: pillarType,
            calculated_score: typeof assessmentScore === 'number' ? assessmentScore : parseFloat(assessmentScore) || 0,
            ai_analysis: entry.details || 'Analys från legacy system',
            assessment_data: metadata.assessment_data || {},
            created_at: entry.created_at,
            updated_at: entry.updated_at,
            source: 'path_entries',
            metadata: {
              ...metadata,
              path_entry_id: entry.id,
              legacy_migration: true
            }
          };
        });

      // Kombinera alla källor och sortera efter datum
      const allAssessments = [...unifiedFromRounds, ...unifiedFromEntries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log(`✅ Unified assessments loaded: ${allAssessments.length} total`);
      
      return allAssessments;

    } catch (error) {
      console.error('Critical error in AssessmentDataService.getAssessments:', error);
      throw error;
    }
  }

  /**
   * UNIVERSIELL SPARNING: Sparar assessment data i båda tabeller för kompatibilitet
   */
  async saveAssessment(request: SaveAssessmentRequest): Promise<{ success: boolean; assessment_round_id?: string; error?: string }> {
    console.log('💾 AssessmentDataService: Saving assessment universally:', request);

    try {
      // 1. Spara i assessment_rounds (primär källa)
      const { data: assessmentRound, error: roundError } = await supabase
        .from('assessment_rounds')
        .insert({
          user_id: request.user_id,
          created_by: request.user_id,
          pillar_type: request.pillar_type,
          answers: request.assessment_data,
          scores: {
            [request.pillar_type]: request.calculated_score,
            overall: request.calculated_score
          },
          comments: request.comments || 'Automatiskt sparad via AssessmentDataService',
          ai_analysis: request.ai_analysis,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (roundError) {
        console.error('Error saving to assessment_rounds:', roundError);
        throw roundError;
      }

      // 2. Spara i path_entries för backward compatibility
      const { error: entryError } = await supabase
        .from('path_entries')
        .insert({
          user_id: request.user_id,
          created_by: request.user_id,
          timestamp: new Date().toISOString(),
          type: 'recommendation',
          title: `AI-analys: ${this.getPillarDisplayName(request.pillar_type)}`,
          details: request.ai_analysis || 'Analys sparad via unified service',
          status: 'completed',
          ai_generated: true,
          visible_to_client: true,
          metadata: {
            pillar_type: request.pillar_type,
            assessment_score: request.calculated_score,
            assessment_data: request.assessment_data,
            assessment_round_id: assessmentRound.id,
            unified_service: true,
            created_via: 'AssessmentDataService'
          }
        });

      if (entryError) {
        console.warn('Warning: Failed to save to path_entries (non-critical):', entryError);
      }

      console.log(`✅ Assessment saved universally with assessment_round_id: ${assessmentRound.id}`);
      
      return {
        success: true,
        assessment_round_id: assessmentRound.id
      };

    } catch (error) {
      console.error('Critical error in AssessmentDataService.saveAssessment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * AUTOMATISK MIGRATION: Migrerar legacy data till modern struktur
   */
  async migrateLegacyData(userId: string): Promise<{ migrated: number; errors: string[] }> {
    console.log('🔄 AssessmentDataService: Starting legacy data migration for user:', userId);

    try {
      const errors: string[] = [];
      let migrated = 0;

      // Hämta legacy data från path_entries som inte har motsvarighet i assessment_rounds
      const { data: legacyEntries } = await supabase
        .from('path_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'recommendation')
        .eq('ai_generated', true)
        .not('details', 'is', null);

      if (!legacyEntries || legacyEntries.length === 0) {
        console.log('No legacy data found for migration');
        return { migrated: 0, errors: [] };
      }

      // Kontrollera vilka pillar-typer som redan finns i assessment_rounds
      const { data: existingRounds } = await supabase
        .from('assessment_rounds')
        .select('pillar_type')
        .eq('user_id', userId);

      const existingPillarTypes = new Set((existingRounds || []).map(r => r.pillar_type));

      // Migrera varje entry som inte redan finns
      for (const entry of legacyEntries) {
        try {
          const metadata = entry.metadata as any || {};
          const pillarType = this.extractPillarType(entry, metadata);

          if (!pillarType || existingPillarTypes.has(pillarType)) {
            continue; // Hoppa över om pillar-typ saknas eller redan existerar
          }

          const assessmentScore = metadata.assessment_score || 0;
          const assessmentData = metadata.assessment_data || { 
            reconstructed_from_analysis: true,
            original_entry_id: entry.id 
          };

          const saveResult = await this.saveAssessment({
            user_id: userId,
            pillar_type: pillarType,
            assessment_data: assessmentData,
            calculated_score: assessmentScore,
            ai_analysis: entry.details,
            comments: 'Migrerad från legacy system'
          });

          if (saveResult.success) {
            migrated++;
            console.log(`✅ Migrated ${pillarType} assessment for user ${userId}`);
          } else {
            errors.push(`Failed to migrate ${pillarType}: ${saveResult.error}`);
          }

        } catch (entryError) {
          errors.push(`Entry ${entry.id} migration failed: ${entryError.message}`);
        }
      }

      console.log(`🎯 Migration completed: ${migrated} assessments migrated, ${errors.length} errors`);
      
      return { migrated, errors };

    } catch (error) {
      console.error('Critical error in legacy migration:', error);
      return { migrated: 0, errors: [error.message] };
    }
  }

  /**
   * HEALTH CHECK: Kontrollerar dataintegritet och identifierar problem
   */
  async performHealthCheck(userId: string): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const assessments = await this.getAssessments(userId);
      
      // Kontrollera för duplicerade pillar-typer
      const pillarCounts = assessments.reduce((acc, assessment) => {
        acc[assessment.pillar_type] = (acc[assessment.pillar_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(pillarCounts).forEach(([pillar, count]) => {
        if (count > 1) {
          issues.push(`Duplicate assessments found for ${pillar} (${count} copies)`);
          recommendations.push(`Consider data cleanup for ${pillar} pillar`);
        }
      });

      // Kontrollera för saknade AI-analyser
      const withoutAnalysis = assessments.filter(a => !a.ai_analysis || a.ai_analysis.length < 50);
      if (withoutAnalysis.length > 0) {
        issues.push(`${withoutAnalysis.length} assessments missing proper AI analysis`);
        recommendations.push('Re-run AI analysis for incomplete assessments');
      }

      // Kontrollera datakällor
      const sources = assessments.reduce((acc, assessment) => {
        acc[assessment.source] = (acc[assessment.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      if (sources.path_entries && !sources.assessment_rounds) {
        issues.push('User has only legacy data, no modern assessment_rounds');
        recommendations.push('Run legacy data migration');
      }

      const status = issues.length === 0 ? 'healthy' : 
                    issues.length <= 2 ? 'warning' : 'critical';

      return { status, issues, recommendations };

    } catch (error) {
      return {
        status: 'critical',
        issues: [`Health check failed: ${error.message}`],
        recommendations: ['Contact system administrator']
      };
    }
  }

  // HJÄLPMETODER

  private extractPillarType(entry: any, metadata: any): string {
    // Prioritera metadata först
    if (metadata.pillar_type) {
      return metadata.pillar_type;
    }

    // Fallback till titel-analys
    const title = entry.title?.toLowerCase() || '';
    
    if (title.includes('talent') || title.includes('talang')) return 'talent';
    if (title.includes('skills') || title.includes('kompetens') || title.includes('färdigheter')) return 'skills';
    if (title.includes('brand') || title.includes('varumärke')) return 'brand';
    if (title.includes('economy') || title.includes('ekonomi')) return 'economy';
    if (title.includes('self_care') || title.includes('hälsa') || title.includes('självomvårdnad')) return 'self_care';
    if (title.includes('open_track') || title.includes('öppet spår')) return 'open_track';
    
    return null;
  }

  private getPillarDisplayName(pillarType: string): string {
    const displayNames: Record<string, string> = {
      'talent': 'Talang',
      'skills': 'Kompetenser',
      'brand': 'Varumärke',
      'economy': 'Ekonomi',
      'self_care': 'Självomvårdnad',
      'open_track': 'Öppna spåret'
    };
    
    return displayNames[pillarType] || pillarType;
  }
}

// Singleton instance för global användning
export const assessmentDataService = new AssessmentDataService();