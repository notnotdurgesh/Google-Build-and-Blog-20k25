import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Save as SaveIcon, CheckCircle } from 'lucide-react';
import { ControlPanel } from '../components/ControlPanel';
import { SequencerGrid } from '../components/SequencerGrid';
import { TrackSettings } from '../components/TrackSettings';
import { SaveModal } from '../components/SaveModal';
import { useSequencer, type Track } from '../hooks/useSequencer';
import { presetService } from '../services/api';

// --- Helper to generate the 256-step arrays easily ---
// const fillSteps = (length: number, activeIndices: number[]) => {
//   const steps = Array(length).fill(false);
//   activeIndices.forEach(index => {
//     if (index < length) steps[index] = true;
//   });
//   return steps;
// };

const PRESET_JSON = JSON.parse(localStorage.getItem('preset') || '{}');

export function StudioPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialState = location.state as { tracks?: Track[], bpm?: number, stepCount?: number } | undefined;

  const {
    tracks,
    isPlaying,
    currentStep,
    bpm,
    setBpm,
    toggleStep,
    togglePlay,
    clearGrid,
    randomizeGrid,
    isLoaded,
    toggleMute,
    toggleSolo,
    updateTrackVolume,
    updateTrackSetting,
    reorderTracks,
    masterVolume,
    setMasterVolume,
    reverbAmount,
    setReverbAmount,
    delayAmount,
    setDelayAmount,
    savePreset,
    toggleHidden,
    batchToggleHidden,
    loadSession
  } = useSequencer(initialState);

  // Auto-load the generated song data
  useEffect(() => {
    if (initialState) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadSession(PRESET_JSON as any);

  }, [initialState, loadSession]);

  const [zoom, setZoom] = useState(100);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectedTrack = useMemo(() =>
    selectedTrackId ? tracks.find(t => t.id === selectedTrackId) || null : null
  , [tracks, selectedTrackId]);

  const handleSaveBeat = async (name: string, description: string) => {
    try {
      const result = await presetService.createPreset({
        name,
        description,
        bpm,
        stepCount: tracks[0]?.steps.length || 16,
        tracks
      });

      if (result) {
        console.log('Beat saved successfully:', result);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error('Failed to save beat');
      }
    } catch (error) {
      console.error('Error saving beat:', error);
      throw error;
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const activeElement = document.activeElement;
        const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
        
        if (!isInput) {
          e.preventDefault();
          togglePlay();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col gap-4 items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-lg font-medium text-zinc-400">Loading ProAudio Engine...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 text-white font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50">
        <ControlPanel
          isPlaying={isPlaying}
          onPlayToggle={togglePlay}
          onClear={clearGrid}
          onRandomize={randomizeGrid}
          bpm={bpm}
          onBpmChange={setBpm}
          zoom={zoom}
          onZoomChange={setZoom}
          masterVolume={masterVolume}
          onMasterVolumeChange={setMasterVolume}
          reverbAmount={reverbAmount}
          onReverbChange={setReverbAmount}
          delayAmount={delayAmount}
          onDelayChange={setDelayAmount}
          onLogoClick={() => navigate('/')}
        />
      </div>

      {/* Scrollable Content Area */}
      <main className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>

        {/* Grid Container */}
        <div className="flex-1 relative z-10 flex min-h-0 min-w-0">
            <div className="flex-1 relative flex flex-col min-h-0 min-w-0">
                <SequencerGrid
                    tracks={tracks}
                    currentStep={currentStep}
                    onToggleStep={toggleStep}
                    onToggleMute={toggleMute}
                    onToggleSolo={toggleSolo}
                    onUpdateVolume={updateTrackVolume}
                    onToggleHidden={toggleHidden}
                    onBatchToggleHidden={batchToggleHidden}
                    onOpenSettings={(track) => setSelectedTrackId(track.id)}
                    onReorderTracks={reorderTracks}
                    zoom={zoom}
                />
            </div>

            {/* Settings Panel (Sidebar) */}
            {selectedTrack && (
                <TrackSettings
                    key={selectedTrack.id}
                    track={selectedTrack}
                    onUpdateSetting={(setting, value) => updateTrackSetting(selectedTrack.id, setting, value)}
                    onClose={() => setSelectedTrackId(null)}
                    onSavePreset={(name) => savePreset(selectedTrack.id, name)}
                />
            )}
        </div>

      </main>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-50 bg-zinc-900 border-t border-zinc-800 px-4 py-2 flex items-center justify-between">
        <div className="text-[10px] font-mono text-zinc-500">
          {isPlaying ? 'PLAYING' : 'READY'} • {bpm} BPM
        </div>

        {/* Save Button */}
        <button
          onClick={() => setShowSaveModal(true)}
          className="group relative px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg font-semibold text-sm transition-all hover:scale-105 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] flex items-center gap-2"
        >
          <SaveIcon className="w-4 h-4" />
          Save Beat
        </button>

        <div className="text-[10px] font-mono text-zinc-500">
          v2.1.0 PRO
        </div>
      </div>

      {/* Save Success Notification */}
      {saveSuccess && (
        <div className="fixed bottom-20 right-6 z-[60] bg-gradient-to-r from-green-600 to-emerald-600 border border-green-500/50 rounded-xl px-6 py-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-white" />
          <span className="font-semibold text-white">Beat saved successfully!</span>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <SaveModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveBeat}
        />
      )}
    </div>
  );
}