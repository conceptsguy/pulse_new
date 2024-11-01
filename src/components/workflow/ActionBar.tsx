import React, { useState, useRef } from 'react';
import { MousePointer, Hand, Plus, Sparkles, Layout, Box, ChevronDown } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import LibraryModal from '../modals/LibraryModal';

interface ActionBarProps {
  onOpenAI: () => void;
  onAddActivity: () => void;
  onAddZone: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({
  onOpenAI,
  onAddActivity,
  onAddZone,
}) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const libraryButtonRef = useRef<HTMLButtonElement>(null);

  const getLibraryPosition = () => {
    if (!libraryButtonRef.current) return null;
    const rect = libraryButtonRef.current.getBoundingClientRect();
    return {
      x: rect.right,
      y: rect.top + rect.height / 2
    };
  };

  return (
    <>
      <div className={`fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 rounded-lg shadow-lg z-40
        ${isDarkMode ? 'bg-bolt-dark-surface' : 'bg-white'}`}
      >
        {/* Interaction Tools */}
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

        {/* AI Assistant */}
        <button
          onClick={onOpenAI}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center
            ${isDarkMode 
              ? 'text-bolt-dark-text-secondary hover:text-bolt-dark-text-primary hover:bg-bolt-dark-hover' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          title="AI Assistant"
        >
          <Sparkles size={20} />
        </button>

        {/* Add Activity/Milestone */}
        <div className="relative">
          <button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center
              ${isDarkMode 
                ? 'text-bolt-dark-text-secondary hover:text-bolt-dark-text-primary hover:bg-bolt-dark-hover' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            title="Add Activity"
          >
            <Plus size={20} />
          </button>

          {isAddMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setIsAddMenuOpen(false)}
              />
              <div className={`absolute left-full ml-2 top-0 w-48 rounded-lg shadow-lg py-1 z-20
                ${isDarkMode 
                  ? 'bg-bolt-dark-surface border border-bolt-dark-border' 
                  : 'bg-white border border-gray-200'}`}
              >
                <button
                  onClick={() => {
                    onAddActivity();
                    setIsAddMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full px-4 py-2 text-sm
                    ${isDarkMode 
                      ? 'text-bolt-dark-text-primary hover:bg-bolt-dark-hover' 
                      : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Add Activity
                </button>
                <button
                  onClick={() => {
                    // Add milestone logic
                    setIsAddMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full px-4 py-2 text-sm
                    ${isDarkMode 
                      ? 'text-bolt-dark-text-primary hover:bg-bolt-dark-hover' 
                      : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Add Milestone
                </button>
              </div>
            </>
          )}
        </div>

        {/* Library Button */}
        <button
          ref={libraryButtonRef}
          onClick={() => setIsLibraryOpen(true)}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center
            ${isDarkMode 
              ? 'text-bolt-dark-text-secondary hover:text-bolt-dark-text-primary hover:bg-bolt-dark-hover' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          title="Library"
        >
          <Box size={20} />
        </button>

        {/* Zones Button */}
        <button
          onClick={onAddZone}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center
            ${isDarkMode 
              ? 'text-bolt-dark-text-secondary hover:text-bolt-dark-text-primary hover:bg-bolt-dark-hover' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          title="Zones"
        >
          <Layout size={20} />
        </button>
      </div>

      <LibraryModal 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        anchorPosition={getLibraryPosition()}
      />
    </>
  );
};

export default ActionBar;