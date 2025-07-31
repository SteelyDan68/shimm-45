import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClientDataContainer, ContainerType, ContainerMetadata } from '@/types/xmlContainers';

export const useXmlContainers = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createContainer = async (
    clientId: string,
    containerType: ContainerType,
    data: Record<string, any>,
    metadata: ContainerMetadata = {}
  ): Promise<ClientDataContainer | null> => {
    setIsLoading(true);
    
    try {
      // Generate XML content from data using the schema template
      const xmlContent = generateXmlFromData(containerType, data);
      
      const { data: container, error } = await supabase
        .from('client_data_containers')
        .insert({
          client_id: clientId,
          container_type: containerType,
          xml_content: xmlContent,
          metadata: {
            ...metadata,
            created_source: 'application',
            data_structure_version: '1.0'
          },
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Container skapad",
        description: `${containerType} container har skapats för klienten`,
      });

      return container as ClientDataContainer;
    } catch (error: any) {
      console.error('Error creating XML container:', error);
      toast({
        title: "Fel vid skapande av container",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getContainers = async (
    clientId: string,
    containerType?: ContainerType
  ): Promise<ClientDataContainer[]> => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('client_data_containers')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (containerType) {
        query = query.eq('container_type', containerType);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as ClientDataContainer[];
    } catch (error: any) {
      console.error('Error fetching XML containers:', error);
      toast({
        title: "Fel vid hämtning av containers",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const updateContainer = async (
    containerId: string,
    data: Record<string, any>,
    metadata?: ContainerMetadata
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Get current container to determine type and version
      const { data: currentContainer, error: fetchError } = await supabase
        .from('client_data_containers')
        .select('*')
        .eq('id', containerId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const xmlContent = generateXmlFromData(currentContainer.container_type as ContainerType, data);
      
      const { error } = await supabase
        .from('client_data_containers')
        .update({
          xml_content: xmlContent,
          metadata: {
            ...(currentContainer.metadata as Record<string, any>),
            ...metadata,
            last_modified: new Date().toISOString()
          },
          version: currentContainer.version + 1
        })
        .eq('id', containerId);

      if (error) {
        throw error;
      }

      toast({
        title: "Container uppdaterad",
        description: "XML container har uppdaterats",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating XML container:', error);
      toast({
        title: "Fel vid uppdatering av container",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const generateXmlFromData = (containerType: ContainerType, data: Record<string, any>): string => {
    
    // For now, create a simple XML structure with the data
    // In the future, this will be more sophisticated with proper XML transformation
    const xmlDoc = `
      <?xml version="1.0" encoding="UTF-8"?>
      <container type="${containerType}" xmlns="http://coaching-platform.com/schemas/v1">
        <metadata>
          <created_at>${new Date().toISOString()}</created_at>
          <version>1.0</version>
        </metadata>
        <data>
          ${Object.entries(data).map(([key, value]) => 
            `<${key}>${typeof value === 'object' ? JSON.stringify(value) : value}</${key}>`
          ).join('\n          ')}
        </data>
      </container>
    `;
    
    return xmlDoc.trim();
  };

  const parseXmlData = (xmlContent: string): Record<string, any> => {
    // Simple XML parsing - in production, use a proper XML parser
    // For now, extract data from our simple structure
    try {
      const dataMatch = xmlContent.match(/<data>(.*?)<\/data>/s);
      if (!dataMatch) return {};
      
      const dataSection = dataMatch[1];
      const data: Record<string, any> = {};
      
      // Extract key-value pairs
      const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
      let match;
      
      while ((match = tagRegex.exec(dataSection)) !== null) {
        const [, key, value] = match;
        try {
          // Try to parse as JSON, fallback to string
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error parsing XML:', error);
      return {};
    }
  };

  return {
    createContainer,
    getContainers,
    updateContainer,
    parseXmlData,
    isLoading
  };
};