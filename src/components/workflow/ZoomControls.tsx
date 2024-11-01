import React from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView,
}) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  const buttonClass = `p-1.5 rounded-lg hover:bg-opacity-10 hover:bg-gray-500
    ${isDarkMode ? 'text-bolt-dark-text-secondary' : 'text-gray-600'}`;

  return (
    <div className={`flex gap-1 p-1 rounded-lg shadow-lg ${
      isDarkMode ? 'bg-bolt-dark-surface' : 'bg-white'
    }`}>
      <button onClick={onZoomIn} className={buttonClass} title="Zoom In">
        <ZoomIn size={16} />
      </button>
      <button onClick={onZoomOut} className={buttonClass} title="Zoom Out">
        <ZoomOut size={16} />
      </button>
      <button onClick={onFitView} className={buttonClass} title="Fit View">
        <Maximize size={16} />
      </button>
    </div>
  );
};

export default ZoomControls;