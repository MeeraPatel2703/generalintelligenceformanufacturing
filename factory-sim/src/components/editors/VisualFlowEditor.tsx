/**
 * Visual Flow Editor - Level 2 Editability
 *
 * Node-based visual editor using React Flow
 * - Drag-drop node positioning
 * - Visual connections
 * - Component library
 * - Property inspector
 */

import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useDESModelStore } from '../../store/desModelStore';
import './VisualFlowEditor.css';

// Custom Node Components
const SourceNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="custom-node source-node">
      <div className="node-header">
        <span className="node-icon">📥</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-body">
        <div className="node-info">
          <span className="label">Type:</span>
          <span className="value">{data.entityType}</span>
        </div>
        <div className="node-info">
          <span className="label">Arrival:</span>
          <span className="value">{data.arrivalPattern?.type || 'N/A'}</span>
        </div>
      </div>
      <div className="node-handle output" />
    </div>
  );
};

const ResourceNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="custom-node resource-node">
      <div className="node-handle input" />
      <div className="node-header">
        <span className="node-icon">⚙️</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-body">
        <div className="node-info">
          <span className="label">Type:</span>
          <span className="value">{data.resourceType}</span>
        </div>
        <div className="node-info">
          <span className="label">Capacity:</span>
          <span className="value">{data.capacity}</span>
        </div>
      </div>
      <div className="node-handle output" />
    </div>
  );
};

const ProcessNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="custom-node process-node">
      <div className="node-handle input" />
      <div className="node-header">
        <span className="node-icon">🔄</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-body">
        <div className="node-info">
          <span className="label">Steps:</span>
          <span className="value">{data.sequence?.length || 0}</span>
        </div>
        <div className="node-info">
          <span className="label">Logic:</span>
          <span className="value">{data.routingLogic}</span>
        </div>
      </div>
      <div className="node-handle output" />
    </div>
  );
};

const DecisionNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="custom-node decision-node">
      <div className="node-handle input" />
      <div className="node-header">
        <span className="node-icon">🔀</span>
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-body">
        <div className="node-info">
          <span className="label">Branches:</span>
          <span className="value">{data.branches || 2}</span>
        </div>
      </div>
      <div className="node-handle output" style={{ top: '40%' }} />
      <div className="node-handle output" style={{ top: '60%' }} />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  source: SourceNode,
  resource: ResourceNode,
  process: ProcessNode,
  decision: DecisionNode,
};

export const VisualFlowEditor: React.FC = () => {
  const {
    flowNodes: initialNodes,
    flowEdges: initialEdges,
    setFlowNodes,
    setFlowEdges,
    selectedNodeId,
    selectNode,
  } = useDESModelStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // Sync local state to store
  const syncNodesToStore = useCallback(
    (newNodes: Node[]) => {
      setNodes(newNodes);
      setFlowNodes(newNodes);
    },
    [setNodes, setFlowNodes]
  );

  const syncEdgesToStore = useCallback(
    (newEdges: Edge[]) => {
      setEdges(newEdges);
      setFlowEdges(newEdges);
    },
    [setEdges, setFlowEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      const newEdges = addEdge(newEdge, edges);
      syncEdgesToStore(newEdges);
    },
    [edges, syncEdgesToStore]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // Add node from library
  const addNodeToCanvas = (type: string) => {
    const newNode: Node = {
      id: `${type}-${nodes.length + 1}`,
      type,
      position: { x: 250, y: 250 },
      data: {
        label: `New ${type}`,
      },
    };

    syncNodesToStore([...nodes, newNode]);
  };

  // Component Library
  const componentLibrary = [
    { type: 'source', icon: '📥', label: 'Source' },
    { type: 'resource', icon: '⚙️', label: 'Server' },
    { type: 'decision', icon: '🔀', label: 'Decision' },
    { type: 'process', icon: '🔄', label: 'Process' },
  ];

  return (
    <div className="visual-flow-editor">
      <div className="flow-sidebar">
        <h3>COMPONENT LIBRARY</h3>
        <div className="component-list">
          {componentLibrary.map((comp) => (
            <div
              key={comp.type}
              className={`component-item ${
                selectedComponent === comp.type ? 'selected' : ''
              }`}
              onClick={() => {
                setSelectedComponent(comp.type);
                addNodeToCanvas(comp.type);
              }}
            >
              <span className="icon">{comp.icon}</span>
              <span className="label">{comp.label}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-section">
          <h4>SELECTED NODE</h4>
          {selectedNodeId ? (
            <div className="node-properties">
              <div className="property-group">
                <label>ID:</label>
                <input type="text" value={selectedNodeId} readOnly />
              </div>
              <button className="btn-delete">Delete Node</button>
            </div>
          ) : (
            <p className="empty-state">No node selected</p>
          )}
        </div>
      </div>

      <div className="flow-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            syncNodesToStore(nodes);
          }}
          onEdgesChange={(changes) => {
            onEdgesChange(changes);
            syncEdgesToStore(edges);
          }}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <div className="flow-toolbar">
        <button className="toolbar-btn">+ Add Node</button>
        <button className="toolbar-btn">Connect</button>
        <button className="toolbar-btn">Delete</button>
        <button className="toolbar-btn">Auto-Layout</button>
      </div>
    </div>
  );
};
