import React from 'react';
import { Play, Square, Trash2, Gauge, ZoomIn, Dices, MonitorPlay, Waves, Timer } from 'lucide-react';
import { cn } from '../lib/utils';

interface ControlPanelProps {
  isPlaying: boolean;
  onPlayToggle: () => void;
  onClear: () => void;
  onRandomize: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  // onAddTrack, // Not used for Piano Roll mode
  onBrowseSamples?: () => void;
  onLogoClick?: () => void;

  // Master FX
  masterVolume: number;
  onMasterVolumeChange: (val: number) => void;
  reverbAmount: number;
  onReverbChange: (val: number) => void;
  delayAmount: number;
  onDelayChange: (val: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isPlaying,
  onPlayToggle,
  onClear,
  onRandomize,
  bpm,
  onBpmChange,
  zoom,
  onZoomChange,
  reverbAmount,
  onReverbChange,
  delayAmount,
  onDelayChange,
  onLogoClick
}) => {
  return (
    <div className="w-full bg-zinc-900 border-b border-zinc-800 p-4 flex flex-wrap items-center gap-6 sticky top-0 z-50 shadow-2xl backdrop-blur-md bg-opacity-95">
      <div className="flex items-center gap-2">
        <button 
            onClick={onLogoClick}
            className="flex items-center gap-2 mr-4 hover:opacity-80 transition-opacity text-left"
        >
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <MonitorPlay className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
                <div className="text-xl font-black tracking-tighter text-white leading-none">
                PRO<span className="text-indigo-500">BEAT</span>
                </div>
            </div>
        </button>
        
        <div className="h-10 w-px bg-zinc-800 mx-2" />

        <button
          onClick={onPlayToggle}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95",
            isPlaying 
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
              : "bg-green-500 hover:bg-green-600 shadow-green-500/20"
          )}
        >
          {isPlaying ? <Square className="w-5 h-5 text-white fill-current" /> : <Play className="w-5 h-5 text-white fill-current ml-1" />}
        </button>

        <div className="flex flex-col gap-1">
            <div className="flex gap-1">
                <button
                onClick={onRandomize}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-indigo-400 transition-colors"
                title="Randomize Pattern"
                >
                <Dices className="w-4 h-4" />
                </button>

                <button
                onClick={onClear}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors"
                title="Clear All"
                >
                <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      <div className="h-10 w-px bg-zinc-800 mx-2" />

      {/* Master FX Group */}
      <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-zinc-800/30 px-3 py-2 rounded-xl border border-zinc-800/50">
            <Waves className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Reverb</span>
              <input
                type="range" min="0" max="1" step="0.01"
                value={reverbAmount}
                onChange={(e) => onReverbChange(Number(e.target.value))}
                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-zinc-800/30 px-3 py-2 rounded-xl border border-zinc-800/50">
            <Timer className="w-4 h-4 text-yellow-400" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Delay</span>
              <input
                type="range" min="0" max="1" step="0.01"
                value={delayAmount}
                onChange={(e) => onDelayChange(Number(e.target.value))}
                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
            </div>
          </div>
      </div>

      <div className="h-10 w-px bg-zinc-800 mx-2" />

      {/* Transport Group */}
      <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-zinc-800/30 px-3 py-1.5 rounded-xl border border-zinc-800/50">
            <Gauge className="w-4 h-4 text-indigo-400" />
            <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tempo</span>
            <div className="flex items-center gap-2">
                <input
                type="range" min="60" max="200"
                value={bpm}
                onChange={(e) => onBpmChange(Number(e.target.value))}
                className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-xs font-mono text-zinc-300 w-8 text-right">{bpm}</span>
            </div>
            </div>
        </div>
        
        <div className="flex items-center gap-3 bg-zinc-800/30 px-3 py-1.5 rounded-xl border border-zinc-800/50">
            <ZoomIn className="w-4 h-4 text-purple-400" />
            <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Zoom</span>
            <div className="flex items-center gap-2">
                <input
                type="range" min="50" max="150"
                value={zoom}
                onChange={(e) => onZoomChange(Number(e.target.value))}
                className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
            </div>
            </div>
        </div>
      </div>

      <div className="flex-grow" />
    </div>
  );
};
