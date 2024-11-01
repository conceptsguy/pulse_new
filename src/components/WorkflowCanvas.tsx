import React, { useState, useRef, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Node, 
  Edge, 
  Connection, 
  Panel, 
  MarkerType, 
  useReactFlow,
  NodeChange,
  EdgeChange,
  SelectionMode,
  PanOnScrollMode,
} from 'reactflow';
import { useThemeStore } from '../stores/themeStore';
import { useWorkflowStore } from '../store/workflowStore';
import TaskNode from './nodes/TaskNode';
import TaskDetails from './TaskDetails';
import EdgeGradient from './workflow/EdgeGradient';
import { useNodeStyle } from './workflow/NodeStyle';
import { MousePointer, Hand, Plus, Box, Layout } from 'lucide-react';
import LibraryModal from './modals/LibraryModal';

interface WorkflowCanvasProps {
  selectedTrades: Set<string>;
}

const nodeTypes = {
  taskNode: TaskNode,
};

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ selectedTrades }) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { fitView, getNodes, project, screenToFlowPosition } = useReactFlow();
  const {
    nodes,
    edges,
    addNode,
    updateNode,
    removeNode,
    setEdges,
    addEdge,
    selectedNodeId,
    setSelectedNodeId,
  } = useWorkflowStore();

  const { nodeStyle } = useNodeStyle({ selectedTrades });
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryAnchor, setLibraryAnchor] = useState<{ x: number; y: number } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    if (!reactFlowWrapper.current) return;

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = screenToFlowPosition({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    try {
      const jsonData = event.dataTransfer.getData('application/reactflow');
      if (!jsonData) return;

      const data = JSON.parse(jsonData);

      if (data.type === 'template') {
        let lastNodeId: string | null = null;
        const template = data.template;
        
        template.tasks.forEach((task: any, index: number) => {
          const nodeId = `node-${Date.now()}-${index}`;
          const newNode = {
            id: nodeId,
            type: 'taskNode',
            position: {
              x: position.x + (task.phase * 300),
              y: position.y + (task.parallel * 150),
            },
            data: {
              ...task,
              status: 'pending',
            },
          };
          
          addNode(newNode);

          // Create edge if there's a predecessor
          if (lastNodeId) {
            const edgeId = `edge-${lastNodeId}-${nodeId}`;
            addEdge({
              id: edgeId,
              source: lastNodeId,
              target: nodeId,
              type: 'smoothstep',
              animated: false,
              style: {
                stroke: isDarkMode ? '#A3A3A3' : '#64748b',
                strokeWidth: 2,
              },
            });
          }

          lastNodeId = nodeId;
        });
      } else {
        const newNode = {
          id: `node-${Date.now()}`,
          type: 'taskNode',
          position,
          data: data.data,
        };
        
        addNode(newNode);
      }
    } catch (error) {
      console.error('Error processing drop:', error);
    }
  }, [addNode, addEdge, isDarkMode, screenToFlowPosition]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach(change => {
      if (change.type === 'position' && 'position' in change) {
        updateNode(change.id, { position: change.position });
      } else if (change.type === 'select') {
        const selectedNodes = getNodes().filter(node => node.selected);
        setSelectedNodes(selectedNodes);
        setShowBulkActions(selectedNodes.length > 1);
      }
    });
  }, [updateNode, getNodes]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const newEdges = edges.filter(edge => 
      !changes.some(change => 
        change.id === edge.id && change.type === 'remove'
      )
    );
    setEdges(newEdges);
  }, [edges, setEdges]);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    const edgeId = `edge-${connection.source}-${connection.target}`;

    const isCriticalPath = sourceNode?.data?.isCritical && targetNode?.data?.isCritical;

    const newEdge: Edge = {
      id: edgeId,
      source: connection.source,
      target: connection.target,
      type: 'smoothstep',
      animated: false,
      style: {
        strokeWidth: isCriticalPath ? 3 : 2,
        stroke: isCriticalPath ? '#FCD34D' : `url(#edge-gradient-${edgeId})`,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isCriticalPath ? '#FCD34D' : (sourceNode?.data?.tradeColor || (isDarkMode ? '#A3A3A3' : '#64748b')),
      },
    };

    const connectionExists = edges.some(
      edge => edge.source === connection.source && edge.target === connection.target
    );

    if (!connectionExists) {
      addEdge(newEdge);
    }
  }, [isDarkMode, edges, addEdge, nodes]);

  const handleAddActivity = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'taskNode',
      position: { x: 100, y: 100 },
      data: { label: 'New Activity', status: 'pending' }
    };
    addNode(newNode);
  };

  const handleOpenLibrary = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setLibraryAnchor({ x: rect.right, y: rect.top + rect.height / 2 });
    setIsLibraryOpen(true);
  };

  return (
    <div className="flex h-full">
      {/* Left Toolbar */}
      <div className={`fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 rounded-lg shadow-lg z-40
        ${isDarkMode ? 'bg-bolt-dark-surface' : 'bg-white'}`}
      >
        <div className={`p-1 rounded-lg mb-2 ${
          isDarkMode ? 'bg-bolt-dark-bg' : 'bg-gray-100'
        }`}>
          <button
            onClick={() => setInteractionMode('select')}
            className={`p-2 rounded-lg w-full flex items-center justify-center transition-colors ${
              interactionMode === 'select'
                ? isDarkMode
                  ? 'bg-bolt-dark-surface text-bolt-dark-text-primary'
                  : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode
                  ? 'text-bolt-dark-text-secondary hover:text-bolt-dark-text-primary'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Select (V)"
          >
            <MousePointer size={20} />
          </button>
          <button
            onClick={() => setInteractionMode('pan')}
            className={`p-2 rounded-lg w-full flex items-center justify-center transition-colors ${
              interactionMode === 'pan'
                ? isDarkMode
                  ? 'bg-bolt-dark-surface text-bolt-dark-text-primary'
                  : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode
                  ? 'text-bolt-dark-text-secondary hover:text-bolt-dark-text-primary'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Hand Tool (H)"
          >
            <Hand size={20} />
          </button>
        </div>

        <div className={`w-full h-px ${isDarkMode ? 'bg-bolt-dark-border' : 'bg-gray-200'}`} />

        <button
          onClick={handleAddActivity}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center
            ${isDarkMode 
              ? 'text-bolt-dark-text-secondary hover:text-bolt-dark-text-primary hover:bg-bolt-dark-hover' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          title="Add Activity"
        >
          <Plus size={20} />
        </button>

        <button
          onClick={handleOpenLibrary}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center
            ${isDarkMode 
              ? 'text-bolt-dark-text-secondary hover:text-bolt-dark-text-primary hover:bg-bolt-dark-hover' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          title="Library"
        >
          <Box size={20} />
        </button>

        <button
          className={`p-2 rounded-lg transition-colors flex items-center justify-center
            ${isDarkMode 
              ? 'text-bolt-dark-text-secondary hover:text-bolt-dark-text-primary hover:bg-bolt-dark-hover' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          title="Zones"
        >
          <Layout size={20} />
        </button>
      </div>

      {/* Main Canvas */}
      <div 
        ref={reactFlowWrapper} 
        className="relative flex-1 h-full"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className={`text-center ${isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-600'}`}>
              <h3 className="text-xl font-medium mb-2">No activities yet</h3>
              <p className="text-sm mb-4">
                Drag trades from the library or use the add button to create activities
              </p>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => {
            setSelectedNodeId(null);
            setShowBulkActions(false);
            setSelectedNodes([]);
          }}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
            style: {
              strokeWidth: 2,
              stroke: `url(#edge-gradient-${isDarkMode ? 'dark' : 'light'})`,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isDarkMode ? '#A3A3A3' : '#64748b',
            },
          }}
          connectionMode="loose"
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.1}
          maxZoom={2}
          deleteKeyCode="Delete"
          multiSelectionKeyCode="Shift"
          selectionMode={SelectionMode.Partial}
          selectionOnDrag={true}
          panOnScroll={true}
          panOnScrollMode={PanOnScrollMode.Free}
          className="touch-none"
          snapToGrid={true}
          snapGrid={[20, 20]}
          selectNodesOnDrag={false}
          style={nodeStyle}
          preventScrolling={false}
          edgeUpdaterRadius={10}
          connectionRadius={20}
        >
          <EdgeGradient isDarkMode={isDarkMode} edges={edges} nodes={nodes} />

          {/* Bulk Actions Menu */}
          {showBulkActions && (
            <Panel position="top-center" className="bg-transparent">
              <div className={`flex items-center gap-1 p-1 rounded-lg shadow-lg
                ${isDarkMode ? 'bg-bolt-dark-surface' : 'bg-white'}`}
              >
                <div className={`px-2 py-1 text-xs
                  ${isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-500'}`}
                >
                  {selectedNodes.length} selected
                </div>
              </div>
            </Panel>
          )}

          <Background />
        </ReactFlow>

        {selectedNode && (
          <div className="absolute top-0 right-0 h-full">
            <TaskDetails
              nodeId={selectedNode.id}
              node={selectedNode}
              onClose={() => setSelectedNodeId(null)}
              onUpdate={(id, data) => updateNode(id, { data })}
              onDelete={removeNode}
              onDuplicate={(id) => {
                const nodeToDuplicate = nodes.find(n => n.id === id);
                if (nodeToDuplicate) {
                  const newNode = {
                    ...nodeToDuplicate,
                    id: `node-${Date.now()}`,
                    position: {
                      x: nodeToDuplicate.position.x + 50,
                      y: nodeToDuplicate.position.y + 50,
                    },
                  };
                  addNode(newNode);
                }
              }}
              edges={edges}
              nodes={nodes}
            />
          </div>
        )}
      </div>

      <LibraryModal 
        isOpen={isLibraryOpen}
        onClose={() => {
          setIsLibraryOpen(false);
          setLibraryAnchor(null);
        }}
        anchorPosition={libraryAnchor}
      />
    </div>
  );
};

export default WorkflowCanvas;