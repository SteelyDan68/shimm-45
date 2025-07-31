// Background synchronization service for XML containers
import { XmlDataAggregator } from './xmlDataAggregator';
import { supabase } from '@/integrations/supabase/client';
import { ContainerType } from '@/types/xmlContainers';

export class XmlContainerSync {
  
  /**
   * Synchronizes all data for a client into XML containers
   * This runs in the background and doesn't require UI updates
   */
  static async syncClientData(clientId: string): Promise<boolean> {
    try {
      console.log(`Starting XML container sync for client ${clientId}`);
      
      // Sync different data types in parallel
      const syncPromises = [
        this.syncAssessmentBundle(clientId),
        this.syncProgressTimeline(clientId),
        this.syncPillarAnalysis(clientId)
      ];

      const results = await Promise.allSettled(syncPromises);
      
      // Log any failures but don't stop the process
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const syncTypes = ['assessment_bundle', 'progress_timeline', 'pillar_analysis'];
          console.error(`Failed to sync ${syncTypes[index]} for client ${clientId}:`, result.reason);
        }
      });

      console.log(`XML container sync completed for client ${clientId}`);
      return true;
    } catch (error) {
      console.error(`XML container sync failed for client ${clientId}:`, error);
      return false;
    }
  }

  private static async syncAssessmentBundle(clientId: string): Promise<void> {
    const aggregatedData = await XmlDataAggregator.aggregateAssessmentData(clientId);
    if (!aggregatedData) return;

    await this.createOrUpdateContainer(
      clientId,
      'assessment_bundle',
      aggregatedData,
      {
        source_table: 'assessment_rounds',
        aggregation_date: new Date().toISOString(),
        data_version: '1.0'
      }
    );
  }

  private static async syncProgressTimeline(clientId: string): Promise<void> {
    const aggregatedData = await XmlDataAggregator.aggregateProgressData(clientId);
    if (!aggregatedData) return;

    await this.createOrUpdateContainer(
      clientId,
      'progress_timeline',
      aggregatedData,
      {
        source_table: 'path_entries,tasks',
        aggregation_date: new Date().toISOString(),
        data_version: '1.0'
      }
    );
  }

  private static async syncPillarAnalysis(clientId: string): Promise<void> {
    const aggregatedData = await XmlDataAggregator.aggregatePillarData(clientId);
    if (!aggregatedData) return;

    await this.createOrUpdateContainer(
      clientId,
      'pillar_analysis',
      aggregatedData,
      {
        source_table: 'pillar_assessments,pillar_visualization_data',
        aggregation_date: new Date().toISOString(),
        data_version: '1.0'
      }
    );
  }

  private static async createOrUpdateContainer(
    clientId: string,
    containerType: ContainerType,
    data: Record<string, any>,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      // Check if container already exists
      const { data: existingContainer, error: fetchError } = await supabase
        .from('client_data_containers')
        .select('id, version')
        .eq('client_id', clientId)
        .eq('container_type', containerType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      const xmlContent = this.generateXmlFromData(containerType, data);

      if (existingContainer) {
        // Update existing container
        const { error: updateError } = await supabase
          .from('client_data_containers')
          .update({
            xml_content: xmlContent,
            metadata: {
              ...metadata,
              last_sync: new Date().toISOString(),
              sync_source: 'background_aggregation'
            },
            version: existingContainer.version + 1
          })
          .eq('id', existingContainer.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new container
        const { error: insertError } = await supabase
          .from('client_data_containers')
          .insert({
            client_id: clientId,
            container_type: containerType,
            xml_content: xmlContent,
            metadata: {
              ...metadata,
              initial_sync: new Date().toISOString(),
              sync_source: 'background_aggregation'
            },
            created_by: (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000'
          });

        if (insertError) {
          throw insertError;
        }
      }
    } catch (error) {
      console.error(`Failed to create/update container ${containerType} for client ${clientId}:`, error);
      throw error;
    }
  }

  private static generateXmlFromData(containerType: ContainerType, data: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<container type="${containerType}" xmlns="http://coaching-platform.com/schemas/v1">
  <metadata>
    <created_at>${timestamp}</created_at>
    <version>1.0</version>
    <data_source>aggregated</data_source>
  </metadata>
  <data>
${Object.entries(data).map(([key, value]) => 
  `    <${key}>${this.escapeXml(typeof value === 'object' ? JSON.stringify(value) : String(value))}</${key}>`
).join('\n')}
  </data>
</container>`;
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Trigger sync for all clients (admin function)
   */
  static async syncAllClients(): Promise<void> {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id');

      if (error) {
        throw error;
      }

      console.log(`Starting XML sync for ${clients?.length || 0} clients`);

      // Process clients in batches to avoid overwhelming the system
      const batchSize = 5;
      const clientBatches = [];
      
      for (let i = 0; i < (clients?.length || 0); i += batchSize) {
        clientBatches.push(clients!.slice(i, i + batchSize));
      }

      for (const batch of clientBatches) {
        await Promise.allSettled(
          batch.map(client => this.syncClientData(client.id))
        );
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('XML sync completed for all clients');
    } catch (error) {
      console.error('Failed to sync all clients:', error);
      throw error;
    }
  }
}