/**
 * 🎯 PRD VISUALIZATION COMPONENTS
 * 
 * React Flow Implementation för systemarkitektur
 * SCRUM Team Excellence - Visuell systemdokumentation
 */

import React from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface PRDArchitectureViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (node: Node) => void;
  onEdgeClick?: (edge: Edge) => void;
}

// Custom node types för olika systemkomponenter
const CustomNode = ({ data }: { data: any }) => {
  const getNodeStyle = (category: string) => {
    const styles = {
      frontend: { backgroundColor: '#3b82f6', color: 'white' },
      backend: { backgroundColor: '#10b981', color: 'white' },
      database: { backgroundColor: '#6366f1', color: 'white' },
      external: { backgroundColor: '#f59e0b', color: 'white' },
      api: { backgroundColor: '#ef4444', color: 'white' }
    };
    return styles[category as keyof typeof styles] || { backgroundColor: '#6b7280', color: 'white' };
  };

  return (
    <div 
      className="px-4 py-2 rounded-lg border-2 border-gray-300 min-w-[120px] text-center"
      style={getNodeStyle(data.category)}
    >
      <div className="font-semibold">{data.label}</div>
      {data.description && (
        <div className="text-xs mt-1 opacity-90">{data.description}</div>
      )}
      {data.componentCount && (
        <div className="text-xs mt-1 opacity-75">
          {data.componentCount} komponenter
        </div>
      )}
    </div>
  );
};

// Custom edge för olika typer av kopplingar  
const CustomEdge = ({ label }: { label?: string }) => {
  return (
    <div className="relative">
      {label && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-1 rounded text-xs border">
          {label}
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Använd bara standard edges för nu
const edgeTypes = {};

export const PRDArchitectureView: React.FC<PRDArchitectureViewProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick,
  onEdgeClick
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    onNodeClick?.(node);
  };

  const handleEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    onEdgeClick?.(edge);
  };

  return (
    <div className="h-[600px] w-full border rounded-lg bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <MiniMap 
          zoomable 
          pannable 
          className="bg-white border rounded"
          nodeColor={(node) => {
            switch (node.data?.category) {
              case 'frontend': return '#3b82f6';
              case 'backend': return '#10b981';
              case 'database': return '#6366f1';
              case 'external': return '#f59e0b';
              case 'api': return '#ef4444';
              default: return '#6b7280';
            }
          }}
        />
        <Controls className="bg-white border rounded" />
        <Background 
          color="#e5e7eb" 
          gap={20} 
          size={1}
        />
      </ReactFlow>
    </div>
  );
};

// Component för assessment struktur visualisering
export const AssessmentStructureView: React.FC<{ assessmentData: any }> = ({ assessmentData }) => {
  const assessmentNodes: Node[] = [
    {
      id: 'welcome-assessment',
      type: 'custom',
      position: { x: 100, y: 100 },
      data: { 
        label: 'Welcome Assessment',
        category: 'frontend',
        description: 'Första bedömning',
        componentCount: 3
      }
    },
    {
      id: 'pillar-assessments',
      type: 'custom', 
      position: { x: 400, y: 100 },
      data: {
        label: 'Pillar Assessments',
        category: 'frontend',
        description: '6 områdesbedömningar',
        componentCount: 6
      }
    },
    {
      id: 'assessment-state-manager',
      type: 'custom',
      position: { x: 250, y: 250 },
      data: {
        label: 'Assessment State Manager',
        category: 'backend',
        description: 'Unified state handling',
        componentCount: 1
      }
    },
    {
      id: 'ai-analysis',
      type: 'custom',
      position: { x: 250, y: 400 },
      data: {
        label: 'AI Analysis Engine',
        category: 'external',
        description: 'OpenAI integration',
        componentCount: 5
      }
    }
  ];

  const assessmentEdges: Edge[] = [
    {
      id: 'welcome-to-state',
      source: 'welcome-assessment',
      target: 'assessment-state-manager',
      type: 'custom',
      label: 'State Updates'
    },
    {
      id: 'pillar-to-state',
      source: 'pillar-assessments',
      target: 'assessment-state-manager',
      type: 'custom',
      label: 'State Updates'
    },
    {
      id: 'state-to-ai',
      source: 'assessment-state-manager',
      target: 'ai-analysis',
      type: 'custom',
      label: 'Analysis Trigger'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Assessment System Architecture</h3>
      <PRDArchitectureView 
        nodes={assessmentNodes}
        edges={assessmentEdges}
      />
    </div>
  );
};

// Component för pillar system visualisering
export const PillarSystemView: React.FC<{ pillarData: any }> = ({ pillarData }) => {
  const pillarNodes: Node[] = [
    {
      id: 'self-care',
      type: 'custom',
      position: { x: 100, y: 50 },
      data: { label: 'Self Care', category: 'frontend', description: 'Egenomsorg' }
    },
    {
      id: 'health-fitness', 
      type: 'custom',
      position: { x: 300, y: 50 },
      data: { label: 'Health & Fitness', category: 'frontend', description: 'Hälsa & träning' }
    },
    {
      id: 'career',
      type: 'custom',
      position: { x: 500, y: 50 },
      data: { label: 'Career', category: 'frontend', description: 'Karriär' }
    },
    {
      id: 'relationships',
      type: 'custom',
      position: { x: 100, y: 200 },
      data: { label: 'Relationships', category: 'frontend', description: 'Relationer' }
    },
    {
      id: 'money-security',
      type: 'custom',
      position: { x: 300, y: 200 },
      data: { label: 'Money & Security', category: 'frontend', description: 'Ekonomi & trygghet' }
    },
    {
      id: 'open-track',
      type: 'custom',
      position: { x: 500, y: 200 },
      data: { label: 'Open Track', category: 'frontend', description: 'Fritt val' }
    },
    {
      id: 'pillar-orchestrator',
      type: 'custom',
      position: { x: 300, y: 350 },
      data: { 
        label: 'Pillar Journey Orchestrator',
        category: 'backend',
        description: 'Central koordination'
      }
    }
  ];

  const pillarEdges: Edge[] = [
    { id: 'self-care-to-orchestrator', source: 'self-care', target: 'pillar-orchestrator', type: 'custom' },
    { id: 'health-to-orchestrator', source: 'health-fitness', target: 'pillar-orchestrator', type: 'custom' },
    { id: 'career-to-orchestrator', source: 'career', target: 'pillar-orchestrator', type: 'custom' },
    { id: 'relationships-to-orchestrator', source: 'relationships', target: 'pillar-orchestrator', type: 'custom' },
    { id: 'money-to-orchestrator', source: 'money-security', target: 'pillar-orchestrator', type: 'custom' },
    { id: 'open-to-orchestrator', source: 'open-track', target: 'pillar-orchestrator', type: 'custom' }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Six Pillars System Architecture</h3>
      <PRDArchitectureView 
        nodes={pillarNodes}
        edges={pillarEdges}
      />
    </div>
  );
};