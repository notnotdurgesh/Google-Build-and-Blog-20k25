import React, { useMemo } from 'react';
import { GripVertical, Settings2, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Track } from '../hooks/useSequencer';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

interface SequencerGridProps {
  tracks: Track[];
  currentStep: number;
  onToggleStep: (trackId: string, step: number) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onUpdateVolume: (trackId: string, val: number) => void;
  onToggleHidden: (trackId: string) => void;
  onBatchToggleHidden: (trackIds: string[], hidden: boolean) => void;
  onOpenSettings: (track: Track) => void;
  onReorderTracks: (startIndex: number, endIndex: number) => void;
  zoom: number;
}

// Optimized Cell Component to prevent thousands of re-renders per step
const SequencerCell = React.memo(({ 
  isActive, 
  stepIndex, 
  currentStep, 
  trackId, 
  cellWidth, 
  rowHeight, 
  onToggle 
}: {
  isActive: boolean;
  stepIndex: number;
  currentStep: number;
  trackId: string;
  cellWidth: number;
  rowHeight: number;
  onToggle: (id: string, step: number) => void;
}) => {
  const isCurrent = currentStep === stepIndex;
  
  return (
    <button
        onMouseDown={() => onToggle(trackId, stepIndex)}
        onMouseEnter={(e) => {
            if (e.buttons === 1) {
                onToggle(trackId, stepIndex);
            }
        }}
        style={{ width: `${cellWidth}px`, height: `${rowHeight}px` }}
        className={cn(
        "rounded-[2px] transition-all border border-zinc-800/30 relative group/step",
        isActive 
            ? "shadow-sm border-transparent bg-blue-500 shadow-blue-500/50"
            : cn(
                "bg-zinc-900/50 hover:bg-zinc-800",
                stepIndex % 4 === 0 ? "bg-zinc-800/80" : ""
            ),
        isCurrent && !isActive && "bg-zinc-700 ring-1 ring-white/20",
        isCurrent && isActive && "brightness-150 ring-2 ring-white z-10 scale-100"
        )}
    >
    </button>
  );
}, (prev, next) => {
  // Custom comparison for performance
  // Only re-render if:
  // 1. Cell dimensions changed
  if (prev.cellWidth !== next.cellWidth) return false;
  // 2. Active state changed
  if (prev.isActive !== next.isActive) return false;
  // 3. Current step status changed (Entered or Left this specific cell)
  const prevIsCurrent = prev.currentStep === prev.stepIndex;
  const nextIsCurrent = next.currentStep === next.stepIndex;
  if (prevIsCurrent !== nextIsCurrent) return false;
  
  return true;
});

export const SequencerGrid: React.FC<SequencerGridProps> = ({
  tracks,
  currentStep,
  onToggleStep,
  onToggleMute,
  onToggleSolo,
  onUpdateVolume,
  onToggleHidden,
  onBatchToggleHidden,
  onOpenSettings,
  onReorderTracks,
  zoom
}) => {
  const cellWidth = (zoom / 100) * 48; // Base width 48px
  const rowHeight = 40;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    // Note: Reordering might be disabled for piano roll if strictly pitch-ordered
    onReorderTracks(result.source.index, result.destination.index);
  };

  const visibleTracks = useMemo(() => tracks.filter(t => !t.hidden), [tracks]);

  // Calculate octave visibility status
  // Octaves 0-8
  const octaves = useMemo(() => {
    const octaveStatus: Record<number, boolean> = {};
    for (let i = 0; i <= 8; i++) {
        // Check if ANY track in this octave is visible
        const tracksInOctave = tracks.filter(t => t.name.includes(`${i}`));
        // If at least one is visible, we consider the octave "active" in terms of visibility
        // But actually we want to toggle ALL.
        // Let's check if ALL are hidden
        const allHidden = tracksInOctave.every(t => t.hidden);
        octaveStatus[i] = !allHidden;
    }
    return octaveStatus;
  }, [tracks]);

  const toggleOctave = (octave: number) => {
      const isVisible = octaves[octave]; // If true, it means some or all are visible, so we want to Hide All (false)
      const tracksInOctave = tracks.filter(t => t.name.includes(`${octave}`));
      const trackIds = tracksInOctave.map(t => t.id);
      
      // If currently visible (true), we set hidden=true. If currently hidden (false), we set hidden=false.
      onBatchToggleHidden(trackIds, isVisible);
  };
  
  return (
    <div className="flex flex-col flex-1 min-h-0">
        {/* Octave Visibility Toolbar */}
        <div className="flex items-center gap-2 p-2 bg-zinc-900 border-b border-zinc-800 overflow-x-auto">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-2">Octaves:</span>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(octave => (
                <button
                    key={octave}
                    onClick={() => toggleOctave(octave)}
                    className={cn(
                        "px-3 py-1 rounded text-xs font-bold transition-colors",
                        octaves[octave] 
                            ? "bg-indigo-500 text-white hover:bg-indigo-600" 
                            : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                    )}
                >
                    {octave}
                </button>
            ))}
        </div>

    <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tracks" direction="vertical">
            {(provided) => (
                <div
                    className="flex flex-col gap-1 p-6 bg-zinc-950 overflow-x-auto overflow-y-auto flex-1 w-full min-w-0"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                >
                {visibleTracks.map((track, index) => {
                    const rowWidth = track.steps.length * (cellWidth + 8); // 8px gap approximation
                    return (
                    <Draggable key={track.id} draggableId={track.id} index={index} isDragDisabled={track.type === 'piano'}> 
                        {(provided, snapshot) => (
                            <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                    "flex items-center gap-4 group/track animate-in fade-in slide-in-from-left-4 duration-300 min-w-max",
                                    snapshot.isDragging && "opacity-50"
                                )}
                            >
                            {/* Track Header */}
                            <div className={cn(
                                "w-64 flex-shrink-0 sticky left-0 z-20 rounded-lg border px-3 py-1 flex items-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.5),4px_0_8px_rgba(0,0,0,0.3)] transition-all select-none",
                                track.type === 'piano' 
                                    ? (track.name.includes('#') 
                                        ? "bg-zinc-950 border-zinc-800 hover:border-zinc-600 h-[40px]" 
                                        : "bg-white border-zinc-200 hover:border-zinc-300 h-[40px]")
                                    : "bg-zinc-950 border-zinc-800/50 hover:border-zinc-700 h-[40px]"
                            )}>
                                    {/* Drag Handle (Hidden for piano to enforce order) */}
                                    {track.type !== 'piano' && (
                                        <div 
                                            {...provided.dragHandleProps}
                                            className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400"
                                        >
                                            <GripVertical className="w-4 h-4" />
                                        </div>
                                    )}
                                    
                                    {/* Piano Key Visual / Type Indicator */}
                                    <div className={cn("w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-lg", 
                                        track.type === 'piano' 
                                            ? (track.name.includes('#') ? "bg-zinc-800" : "bg-zinc-300")
                                            : "bg-blue-500"
                                    )} />

                                    {/* Name */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <span className={cn("font-bold text-xs truncate", 
                                            track.type === 'piano' && !track.name.includes('#') ? "text-zinc-900" : "text-zinc-200"
                                        )}>{track.name}</span>
                                    </div>
                                
                                {/* Controls */}
                                <div className="flex items-center gap-2">
                                    {/* Volume */}
                                    <input 
                                        type="range" min="-60" max="6" step="0.1" 
                                        value={track.volume} 
                                        onChange={(e) => onUpdateVolume(track.id, Number(e.target.value))}
                                        className={cn("w-12 h-1 rounded-lg appearance-none cursor-pointer hover:accent-white opacity-50 group-hover/track:opacity-100 transition-opacity",
                                            track.type === 'piano' && !track.name.includes('#') ? "bg-zinc-300 accent-zinc-600" : "bg-zinc-700 accent-zinc-400"
                                        )}
                                        title={`Volume: ${track.volume.toFixed(1)} dB`}
                                    />
                                
                                    {/* Mute / Solo */}
                                    <div className="flex items-center gap-0.5">
                                        <button
                                        onClick={() => onToggleMute(track.id)}
                                        className={cn(
                                            "p-0.5 rounded text-[10px] font-bold w-5 h-5 flex items-center justify-center transition-colors",
                                            track.mute 
                                                ? "bg-red-500 text-white" 
                                                : (track.type === 'piano' && !track.name.includes('#') ? "bg-zinc-200 text-zinc-400 hover:text-zinc-600" : "bg-zinc-800 text-zinc-600 hover:text-zinc-400")
                                        )}
                                        title="Mute"
                                        >
                                        M
                                        </button>
                                        <button
                                        onClick={() => onToggleSolo(track.id)}
                                        className={cn(
                                            "p-0.5 rounded text-[10px] font-bold w-5 h-5 flex items-center justify-center transition-colors",
                                            track.solo 
                                                ? "bg-yellow-400 text-black" 
                                                : (track.type === 'piano' && !track.name.includes('#') ? "bg-zinc-200 text-zinc-400 hover:text-zinc-600" : "bg-zinc-800 text-zinc-600 hover:text-zinc-400")
                                        )}
                                        title="Solo"
                                        >
                                        S
                                        </button>
                                    </div>
                                    
                                    {/* Settings */}
                                    <button
                                        onClick={() => onOpenSettings(track)}
                                        className={cn("transition-colors p-1 opacity-0 group-hover/track:opacity-100", 
                                            track.type === 'piano' && !track.name.includes('#') ? "text-zinc-400 hover:text-indigo-600" : "text-zinc-600 hover:text-indigo-400"
                                        )}
                                        title="Sound Design"
                                    >
                                        <Settings2 className="w-3 h-3" />
                                    </button>

                                    {/* Hide (instead of Remove for Piano) */}
                                    <button
                                        onClick={() => onToggleHidden(track.id)}
                                        className={cn("transition-colors p-1 opacity-0 group-hover/track:opacity-100",
                                            track.type === 'piano' && !track.name.includes('#') ? "text-zinc-400 hover:text-zinc-600" : "text-zinc-600 hover:text-zinc-400"
                                        )}
                                        title="Hide Track"
                                    >
                                        <EyeOff className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="flex items-center gap-0.5 flex-shrink-0" style={{ minWidth: `${rowWidth}px` }}>
                                {track.steps.map((isActive, stepIndex) => (
                                    <SequencerCell
                                        key={stepIndex}
                                        isActive={isActive}
                                        stepIndex={stepIndex}
                                        currentStep={currentStep}
                                        trackId={track.id}
                                        cellWidth={cellWidth}
                                        rowHeight={rowHeight}
                                        onToggle={onToggleStep}
                                    />
                                ))}
                            </div>
                            </div>
                        )}
                    </Draggable>
                )})}
                {provided.placeholder}
                </div>
            )}
        </Droppable>
    </DragDropContext>
    </div>
  );
};
