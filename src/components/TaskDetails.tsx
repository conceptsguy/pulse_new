import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MoreVertical, Trash2, Copy, CheckCircle, Maximize2, Minimize2, Search, Plus, UserX, GripVertical } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { useWorkflowStore } from '../store/workflowStore';
import { trades } from '../data/trades';
import { users } from '../data/users';
import { Edge, Node } from 'reactflow';
import confetti from 'canvas-confetti';

interface TaskDetailsProps {
  nodeId: string;
  node: Node;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  edges: Edge[];
  nodes: Node[];
}

const TaskDetails: React.FC<TaskDetailsProps> = ({
  nodeId,
  node,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  edges,
  nodes,
}) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const { setEdges } = useWorkflowStore();
  const [newComment, setNewComment] = useState('');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAssigningUser, setIsAssigningUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [draggedSubtaskId, setDraggedSubtaskId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAssigningUser && labelInputRef.current) {
      labelInputRef.current.focus();
    }
  }, [isAssigningUser]);

  const handleInputChange = (field: string, value: any) => {
    onUpdate(nodeId, {
      ...node.data,
      [field]: value
    });
  };

  const handleComplete = () => {
    onUpdate(nodeId, {
      ...node.data,
      status: 'completed',
      completion: 100
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comments = node.data.comments || [];
    handleInputChange('comments', [...comments, {
      id: Date.now(),
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
      user: 'Current User'
    }]);
    setNewComment('');
  };

  const handleAssignUser = (user: typeof users[0]) => {
    const currentAssignees = node.data.assignees || [];
    if (!currentAssignees.some(a => a.id === user.id)) {
      handleInputChange('assignees', [...currentAssignees, user]);
    }
    setIsAssigningUser(false);
    setUserSearchQuery('');
  };

  const handleRemoveAssignee = (userId: string) => {
    const currentAssignees = node.data.assignees || [];
    handleInputChange('assignees', currentAssignees.filter(a => a.id !== userId));
  };

  const handleSubtaskDragStart = (e: React.DragEvent, subtaskId: string) => {
    setDraggedSubtaskId(subtaskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSubtaskDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSubtaskId || draggedSubtaskId === targetId) return;

    const currentSubtasks = node.data.subtasks || [];
    const currentIndex = currentSubtasks.findIndex(t => t.id === draggedSubtaskId);
    const targetIndex = currentSubtasks.findIndex(t => t.id === targetId);
    
    if (currentIndex === -1 || targetIndex === -1) return;

    const newSubtasks = [...currentSubtasks];
    const [removed] = newSubtasks.splice(currentIndex, 1);
    newSubtasks.splice(targetIndex, 0, removed);

    onUpdate(nodeId, {
      data: { ...node.data, subtasks: newSubtasks }
    });
  };

  const handleSubtaskDragEnd = () => {
    setDraggedSubtaskId(null);
  };

  const handleRemoveRelatedTask = (relatedNodeId: string) => {
    // Remove all edges connected between these nodes
    const newEdges = edges.filter(edge => 
      !(edge.source === nodeId && edge.target === relatedNodeId) &&
      !(edge.source === relatedNodeId && edge.target === nodeId)
    );
    
    // Update edges in the workflow store
    setEdges(newEdges);
  };

  const relatedTasks = edges
    .filter(edge => edge.source === nodeId || edge.target === nodeId)
    .map(edge => {
      const relatedNodeId = edge.source === nodeId ? edge.target : edge.source;
      const relatedNode = nodes.find(n => n.id === relatedNodeId);
      const type = edge.source === nodeId ? 'succeeding' : 'preceding';
      return {
        id: `${type}-${edge.id}`,
        nodeId: relatedNodeId,
        name: relatedNode?.data.label,
        type
      };
    });

  const inputClasses = `w-full px-2 py-1.5 text-sm rounded-md border ${
    isDarkMode
      ? 'bg-bolt-dark-bg border-bolt-dark-border text-bolt-dark-text-primary'
      : 'bg-white border-gray-300 text-gray-900'
  } focus:outline-none focus:ring-1 ${
    isDarkMode ? 'focus:ring-bolt-dark-hover' : 'focus:ring-blue-500'
  }`;

  const labelClasses = `block text-xs font-medium mb-1 ${
    isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-600'
  }`;

  return (
    <div
      className={`${isFullscreen ? 'fixed inset-0 z-50' : 'w-96 h-full'} 
        border-l flex flex-col transition-all duration-300 
        ${isDarkMode ? 'bg-bolt-dark-surface border-bolt-dark-border' : 'bg-white border-gray-200'}`}
    >
      {/* Header */}
      <div className={`p-3 border-b ${
        isDarkMode ? 'border-bolt-dark-border' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-base font-semibold ${
            isDarkMode ? 'text-bolt-dark-text-primary' : 'text-gray-900'
          }`}>
            Task Details
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleComplete}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${
                node.data.status === 'completed'
                  ? isDarkMode
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-green-50 text-green-600'
                  : isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              disabled={node.data.status === 'completed'}
            >
              <CheckCircle size={16} />
              {node.data.status === 'completed' ? 'Completed' : 'Complete'}
            </button>
            <div className="relative">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`p-1.5 rounded-lg ${
                  isDarkMode
                    ? 'hover:bg-bolt-dark-hover text-bolt-dark-text-secondary hover:text-bolt-dark-text-primary'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                <MoreVertical size={16} />
              </button>
              
              {isMoreMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMoreMenuOpen(false)}
                  />
                  <div className={`absolute right-0 mt-1 w-48 rounded-md shadow-lg py-1 z-50
                    ${isDarkMode ? 'bg-bolt-dark-bg border border-bolt-dark-border' : 'bg-white border border-gray-200'}`}
                  >
                    <button
                      onClick={() => {
                        onDuplicate(nodeId);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 w-full px-4 py-2 text-sm
                        ${isDarkMode 
                          ? 'text-bolt-dark-text-primary hover:bg-bolt-dark-hover' 
                          : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <Copy size={14} />
                      Duplicate Task
                    </button>
                    <button
                      onClick={() => {
                        onDelete(nodeId);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 
                        ${isDarkMode ? 'hover:bg-bolt-dark-hover' : 'hover:bg-gray-100'}`}
                    >
                      <Trash2 size={14} />
                      Delete Task
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-lg ${
                isDarkMode
                  ? 'hover:bg-bolt-dark-hover text-bolt-dark-text-secondary hover:text-bolt-dark-text-primary'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg ${
                isDarkMode
                  ? 'hover:bg-bolt-dark-hover text-bolt-dark-text-secondary hover:text-bolt-dark-text-primary'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className={`p-3 space-y-3 ${isFullscreen ? 'max-w-3xl mx-auto' : ''}`}>
          {/* Task Name */}
          <div>
            <label className={labelClasses}>Task Name</label>
            <input
              type="text"
              value={node?.data.label || ''}
              onChange={(e) => handleInputChange('label', e.target.value)}
              className={inputClasses}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClasses}>Description</label>
            <textarea
              value={node?.data.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
              className={`${inputClasses} resize-none`}
              placeholder="Enter task description..."
            />
          </div>

          {/* Assignees */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClasses}>Assignees</label>
              <button
                onClick={() => setIsAssigningUser(true)}
                className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors
                  ${isDarkMode 
                    ? 'text-bolt-dark-text-secondary hover:bg-bolt-dark-hover' 
                    : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Plus size={12} />
                Add
              </button>
            </div>

            {/* Current Assignees */}
            {node.data.assignees && node.data.assignees.length > 0 ? (
              <div className="space-y-1">
                {node.data.assignees.map((assignee) => (
                  <div
                    key={assignee.id}
                    className={`flex items-center justify-between p-2 rounded-lg
                      ${isDarkMode ? 'bg-bolt-dark-bg' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={assignee.avatar}
                        alt={assignee.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <div>
                        <div className={`text-sm font-medium
                          ${isDarkMode ? 'text-bolt-dark-text-primary' : 'text-gray-900'}`}
                        >
                          {assignee.name}
                        </div>
                        <div className={`text-xs
                          ${isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-500'}`}
                        >
                          {assignee.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAssignee(assignee.id)}
                      className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500
                        ${isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-500'}`}
                    >
                      <UserX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-sm text-center py-4 rounded-lg border-2 border-dashed
                ${isDarkMode 
                  ? 'border-bolt-dark-border text-bolt-dark-text-secondary' 
                  : 'border-gray-200 text-gray-500'}`}
              >
                No assignees yet
              </div>
            )}

            {/* User Search Dropdown */}
            {isAssigningUser && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => {
                    setIsAssigningUser(false);
                    setUserSearchQuery('');
                  }}
                />
                <div className={`absolute left-3 right-3 mt-1 rounded-lg shadow-lg z-20 overflow-hidden
                  ${isDarkMode ? 'bg-bolt-dark-bg border border-bolt-dark-border' : 'bg-white border border-gray-200'}`}
                >
                  <div className="p-2">
                    <div className="relative">
                      <input
                        ref={labelInputRef}
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-md border
                          ${isDarkMode 
                            ? 'bg-bolt-dark-surface border-bolt-dark-border text-bolt-dark-text-primary placeholder-bolt-dark-text-tertiary' 
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                          } focus:outline-none`}
                      />
                      <Search 
                        size={14} 
                        className={`absolute left-2.5 top-1/2 -translate-y-1/2
                          ${isDarkMode ? 'text-bolt-dark-text-tertiary' : 'text-gray-400'}`}
                      />
                    </div>
                  </div>
                  <div className={`max-h-64 overflow-y-auto ${
                    isDarkMode ? 'divide-y divide-bolt-dark-border' : 'divide-y divide-gray-100'
                  }`}>
                    {users
                      .filter(user => 
                        !node.data.assignees?.some(a => a.id === user.id) &&
                        (user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
                      )
                      .map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleAssignUser(user)}
                          className={`w-full flex items-center gap-3 p-2 transition-colors
                            ${isDarkMode 
                              ? 'hover:bg-bolt-dark-hover' 
                              : 'hover:bg-gray-50'}`}
                        >
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1 text-left">
                            <div className={`text-sm font-medium
                              ${isDarkMode ? 'text-bolt-dark-text-primary' : 'text-gray-900'}`}
                            >
                              {user.name}
                            </div>
                            <div className={`text-xs
                              ${isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-500'}`}
                            >
                              {user.email}
                            </div>
                          </div>
                        </button>
                      ))}
                    {users.filter(user => 
                      !node.data.assignees?.some(a => a.id === user.id) &&
                      (user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                       user.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
                    ).length === 0 && (
                      <div className={`p-3 text-sm text-center
                        ${isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-500'}`}
                      >
                        No users found
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Start Date */}
            <div>
              <label className={labelClasses}>Start Date</label>
              <input
                type="date"
                value={node?.data.startDate || ''}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={inputClasses}
              />
            </div>

            {/* Duration */}
            <div>
              <label className={labelClasses}>Duration (days)</label>
              <input
                type="number"
                min="1"
                value={node?.data.duration || ''}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || '')}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Trade Selection */}
            <div>
              <label className={labelClasses}>Trade</label>
              <select
                value={trades.find(t => t.name === node?.data.trade)?.id || ''}
                onChange={(e) => {
                  const selectedTrade = trades.find(t => t.id === e.target.value);
                  if (selectedTrade) {
                    handleInputChange('trade', selectedTrade.name);
                    handleInputChange('tradeColor', selectedTrade.color);
                  } else {
                    handleInputChange('trade', undefined);
                    handleInputChange('tradeColor', undefined);
                  }
                }}
                className={inputClasses}
              >
                <option value="">No Trade</option>
                {trades.map(trade => (
                  <option key={trade.id} value={trade.id}>
                    {trade.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className={labelClasses}>Status</label>
              <select
                value={node?.data.status || 'pending'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className={inputClasses}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
          </div>

          {/* Completion Percentage */}
          <div>
            <label className={labelClasses}>Completion</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={node?.data.completion || 0}
                onChange={(e) => handleInputChange('completion', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className={`text-sm ${isDarkMode ? 'text-bolt-dark-text-primary' : 'text-gray-900'}`}>
                {node?.data.completion || 0}%
              </span>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className={labelClasses}>Type</label>
            <div className={`flex items-center gap-2 mt-1
              ${isDarkMode ? 'text-bolt-dark-text-primary' : 'text-gray-900'}`}
            >
              <input
                type="checkbox"
                checked={node?.data.isMilestone || false}
                onChange={(e) => handleInputChange('isMilestone', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Milestone</span>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-xs font-medium
                ${isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-600'}`}
              >
                Subtasks ({(node.data.subtasks || []).length})
              </h3>
              <button
                onClick={() => {
                  const newSubtask = {
                    id: `subtask-${Date.now()}`,
                    label: 'New subtask',
                    completed: false
                  };
                  onUpdate(nodeId, {
                    ...node.data,
                    subtasks: [...(node.data.subtasks || []), newSubtask]
                  });
                }}
                className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors
                  ${isDarkMode 
                    ? 'text-bolt-dark-text-secondary hover:bg-bolt-dark-hover' 
                    : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Plus size={12} />
                Add Subtask
              </button>
            </div>

            {node.data.subtasks && node.data.subtasks.length > 0 ? (
              <div className="space-y-1.5">
                {node.data.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    draggable
                    onDragStart={(e) => handleSubtaskDragStart(e, subtask.id)}
                    onDragOver={(e) => handleSubtaskDragOver(e, subtask.id)}
                    onDragEnd={handleSubtaskDragEnd}
                    className={`group flex items-center gap-2 p-2 rounded-md text-sm
                      ${isDarkMode ? 'bg-bolt-dark-bg hover:bg-bolt-dark-hover' : 'bg-gray-100 hover:bg-gray-50'}`}
                  >
                    <GripVertical 
                      size={14} 
                      className={`cursor-grab ${isDarkMode ? 'text-bolt-dark-text-tertiary' : 'text-gray-400'}`} 
                    />
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => {
                        const updatedSubtasks = node.data.subtasks?.map(t =>
                          t.id === subtask.id ? { ...t, completed: !t.completed } : t
                        );
                        onUpdate(nodeId, { ...node.data, subtasks: updatedSubtasks });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className={`flex-1 ${
                      subtask.completed
                        ? isDarkMode 
                          ? 'line-through text-bolt-dark-text-tertiary' 
                          : 'line-through text-gray-400'
                        : isDarkMode
                          ? 'text-bolt-dark-text-primary'
                          : 'text-gray-900'
                    }`}>
                      {subtask.label}
                    </span>
                    <button
                      onClick={() => {
                        const updatedSubtasks = node.data.subtasks?.filter(t => t.id !== subtask.id);
                        onUpdate(nodeId, { ...node.data, subtasks: updatedSubtasks });
                      }}
                      className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
                        ${isDarkMode 
                          ? 'hover:bg-bolt-dark-bg text-bolt-dark-text-tertiary hover:text-red-400' 
                          : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-sm text-center py-4 rounded-lg border-2 border-dashed
                ${isDarkMode 
                  ? 'border-bolt-dark-border text-bolt-dark-text-secondary' 
                  : 'border-gray-200 text-gray-500'}`}
              >
                No subtasks yet
              </div>
            )}
          </div>

          {/* Related Tasks */}
          {relatedTasks.length > 0 && (
            <div>
              <h3 className={`text-xs font-medium mb-2 ${
                isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-600'
              }`}>
                Related Tasks
              </h3>
              <div className="space-y-1.5">
                {relatedTasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-2 rounded-md text-xs ${
                      isDarkMode ? 'bg-bolt-dark-bg' : 'bg-gray-100'
                    }`}
                  >
                    <div>
                      <div className={`font-medium ${
                        isDarkMode ? 'text-bolt-dark-text-primary' : 'text-gray-700'
                      }`}>
                        {task.name}
                      </div>
                      <div className={isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-500'}>
                        {task.type === 'preceding' ? 'Predecessor' : 'Successor'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveRelatedTask(task.nodeId)}
                      className={`p-1 rounded hover:bg-opacity-10 hover:bg-gray-500
                        ${isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-400'}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Thread */}
          <div className="mt-4">
            <h3 className={`text-xs font-medium mb-2 ${
              isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-600'
            }`}>
              Comments
            </h3>
            <div className="space-y-2">
              {(node.data.comments || []).map((comment: any) => (
                <div
                  key={comment.id}
                  className={`p-2 rounded-md ${
                    isDarkMode ? 'bg-bolt-dark-bg' : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${
                      isDarkMode ? 'text-bolt-dark-text-primary' : 'text-gray-700'
                    }`}>
                      {comment.user}
                    </span>
                    <span className={`text-xs ${
                      isDarkMode ? 'text-bolt-dark-text-tertiary' : 'text-gray-500'
                    }`}>
                      {new Date(comment.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-600'
                  }`}>
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <div className={`p-3 border-t ${
        isDarkMode ? 'border-bolt-dark-border' : 'border-gray-200'
      }`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className={`flex-1 ${inputClasses}`}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className={`p-1.5 rounded-md transition-colors ${
              newComment.trim()
                ? isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
                : isDarkMode
                  ? 'bg-bolt-dark-bg text-bolt-dark-text-tertiary'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;