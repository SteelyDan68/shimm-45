import { ContainerType, XMLSchemaDefinition } from '@/types/xmlContainers';

export class XMLContainerBuilder {
  private xmlContent: string = '';
  private containerType: ContainerType;
  private namespace?: string;

  constructor(containerType: ContainerType, namespace?: string) {
    this.containerType = containerType;
    this.namespace = namespace;
  }

  startContainer(rootElement: string): XMLContainerBuilder {
    const namespaceAttr = this.namespace ? ` xmlns="${this.namespace}"` : '';
    this.xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}${namespaceAttr}>`;
    return this;
  }

  addElement(name: string, value: any, attributes?: Record<string, string>): XMLContainerBuilder {
    const attrStr = attributes 
      ? ' ' + Object.entries(attributes).map(([k, v]) => `${k}="${this.escapeXML(v)}"`).join(' ')
      : '';
    
    if (typeof value === 'object' && value !== null) {
      this.xmlContent += `\n  <${name}${attrStr}>`;
      this.addObjectContent(value, 2);
      this.xmlContent += `\n  </${name}>`;
    } else {
      this.xmlContent += `\n  <${name}${attrStr}>${this.escapeXML(String(value))}</${name}>`;
    }
    return this;
  }

  addSection(name: string, content: () => void): XMLContainerBuilder {
    this.xmlContent += `\n  <${name}>`;
    const currentIndent = this.xmlContent.match(/\n(\s*)$/)?.[1] || '';
    content();
    this.xmlContent += `\n  </${name}>`;
    return this;
  }

  endContainer(rootElement: string): string {
    this.xmlContent += `\n</${rootElement}>`;
    return this.xmlContent;
  }

  private addObjectContent(obj: any, indentLevel: number): void {
    const indent = '  '.repeat(indentLevel);
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.xmlContent += `\n${indent}<item index="${index}">`;
        if (typeof item === 'object') {
          this.addObjectContent(item, indentLevel + 1);
        } else {
          this.xmlContent += this.escapeXML(String(item));
        }
        this.xmlContent += `<\/item>`;
      });
    } else {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          this.xmlContent += `\n${indent}<${key}>`;
          this.addObjectContent(value, indentLevel + 1);
          this.xmlContent += `\n${indent}</${key}>`;
        } else {
          this.xmlContent += `\n${indent}<${key}>${this.escapeXML(String(value))}</${key}>`;
        }
      });
    }
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const createAssessmentRecordXML = (assessmentData: any): string => {
  const builder = new XMLContainerBuilder('assessment_record');
  
  return builder
    .startContainer('AssessmentRecord')
    .addElement('timestamp', new Date().toISOString())
    .addElement('assessmentId', assessmentData.id)
    .addElement('userId', assessmentData.user_id)
    .addElement('assessmentType', assessmentData.pillar_type || assessmentData.form_definition_id || 'general')
    .addElement('scores', assessmentData.scores)
    .addElement('answers', assessmentData.answers)
    .addElement('aiAnalysis', assessmentData.ai_analysis || '')
    .addElement('createdBy', assessmentData.created_by)
    .addElement('metadata', {
      version: '1.0',
      source: 'assessment_rounds',
      aggregated_at: new Date().toISOString()
    })
    .endContainer('AssessmentRecord');
};

export const createProgressTimelineXML = (pathEntries: any[]): string => {
  const builder = new XMLContainerBuilder('progress_timeline');
  
  let xml = builder.startContainer('ProgressTimeline');
  
  xml = xml.addElement('timelineId', `timeline_${Date.now()}`)
           .addElement('generatedAt', new Date().toISOString())
           .addElement('entryCount', pathEntries.length);

  pathEntries.forEach((entry, index) => {
    xml = xml.addSection('Entry', () => {
      xml.addElement('entryId', entry.id)
         .addElement('sequence', index + 1)
         .addElement('timestamp', entry.timestamp)
         .addElement('type', entry.type)
         .addElement('title', entry.title)
         .addElement('details', entry.details || '')
         .addElement('status', entry.status)
         .addElement('aiGenerated', entry.ai_generated)
         .addElement('visibleToClient', entry.visible_to_client)
         .addElement('metadata', entry.metadata || {});
    });
  });

  return xml.endContainer('ProgressTimeline');
};

export const validateXMLContainer = (xmlContent: string, containerType: ContainerType): boolean => {
  try {
    // Basic XML validation - in production, you'd use a proper XML parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Check for parsing errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.error('XML parsing error:', parseError.textContent);
      return false;
    }

    // Basic structure validation based on container type
    const rootElement = doc.documentElement;
    const expectedRoots: Record<ContainerType, string> = {
      'assessment_record': 'AssessmentRecord',
      'progress_timeline': 'ProgressTimeline',
      'intervention_plan': 'InterventionPlan',
      'coaching_session': 'CoachingSession',
      'intelligence_report': 'IntelligenceReport',
      'pillar_analysis': 'PillarAnalysis',
      'habit_tracking': 'HabitTracking',
      'milestone_record': 'MilestoneRecord'
    };

    return rootElement.tagName === expectedRoots[containerType];
  } catch (error) {
    console.error('XML validation error:', error);
    return false;
  }
};

export const extractXMLMetadata = (xmlContent: string): Record<string, any> => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    
    const metadataElement = doc.querySelector('metadata');
    if (!metadataElement) return {};

    const metadata: Record<string, any> = {};
    Array.from(metadataElement.children).forEach(child => {
      metadata[child.tagName] = child.textContent;
    });

    return metadata;
  } catch (error) {
    console.error('Error extracting XML metadata:', error);
    return {};
  }
};