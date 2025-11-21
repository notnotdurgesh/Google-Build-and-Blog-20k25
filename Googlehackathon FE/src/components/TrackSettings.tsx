import React, { useState } from 'react';
import { X, Zap, Activity, Timer, Waves, Music, BarChart2 } from 'lucide-react';
import type { Track, TrackSettings as TrackSettingsType } from '../hooks/useSequencer';

interface TrackSettingsProps {
  track: Track;
  onUpdateSetting: (setting: keyof TrackSettingsType, value: number) => void;
  onClose: () => void;
  onSavePreset: (name: string) => void;
}

export const TrackSettings: React.FC<TrackSettingsProps> = ({ track, onUpdateSetting, onClose, onSavePreset }) => {
  // Local state for immediate visual feedback
  // Key in parent ensures we remount on track change, so initial state is always correct
  const [localDecay, setLocalDecay] = useState(track.settings.decay);
  const [localAttack, setLocalAttack] = useState(track.settings.attack);
  const [localDistortion, setLocalDistortion] = useState(track.settings.distortion);
  const [localPitch, setLocalPitch] = useState(track.settings.pitch);
  const [localSustain, setLocalSustain] = useState(track.settings.sustain);
  const [localRelease, setLocalRelease] = useState(track.settings.release);
  const [localCutoff, setLocalCutoff] = useState(track.settings.cutoff || 20000);
  const [localResonance, setLocalResonance] = useState(track.settings.resonance || 1);

  // Preset Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [presetName, setPresetName] = useState(track.name);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    if (!presetName.trim()) return;
    onSavePreset(presetName);
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const isMelodic = ['bass', 'lead', 'pad', 'piano'].includes(track.type);

  return (
    <div className="w-80 flex-shrink-0 bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800 shadow-2xl z-40 p-6 flex flex-col animate-in slide-in-from-right duration-300 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-12 rounded-full ${
            track.type === 'kick' ? "bg-indigo-500" :
            track.type === 'snare' ? "bg-purple-500" :
            track.type === 'hihat' ? "bg-pink-500" : 
            track.type === 'bass' ? "bg-emerald-500" :
            track.type === 'lead' ? "bg-amber-500" :
            track.type === 'pad' ? "bg-teal-500" :
            "bg-blue-500"
          }`} />
          <div>
            <h3 className="text-lg font-bold text-white">{track.name}</h3>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Sound Design</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {showSuccess && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-xs font-bold flex items-center justify-center animate-in fade-in slide-in-from-top-2">
          Preset Saved Successfully!
        </div>
      )}

      <div className="mb-6 p-4 bg-zinc-800/30 rounded-xl border border-zinc-800">
        {!isSaving ? (
           <div className="flex items-center justify-between">
             <span className="text-xs font-mono text-zinc-500 uppercase">Current Preset</span>
             <button 
               onClick={() => setIsSaving(true)}
               className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded-lg transition-colors"
             >
               Save As Preset
             </button>
           </div>
        ) : (
           <div className="flex flex-col gap-2">
             <span className="text-xs font-bold text-zinc-400">Save Preset As:</span>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={presetName}
                 onChange={(e) => setPresetName(e.target.value)}
                 className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:border-indigo-500 outline-none"
                 autoFocus
               />
               <button 
                 onClick={handleSave}
                 className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-bold"
               >
                 Save
               </button>
               <button 
                 onClick={() => setIsSaving(false)}
                 className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-2 py-1 rounded text-xs"
               >
                 Cancel
               </button>
             </div>
           </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-8">
        
        {/* Pitch Control - Especially for Melodic Instruments */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Music className="w-4 h-4" />
            <span className="text-sm font-medium">Pitch / Tune</span>
          </div>
          <input
            type="range"
            min="-24"
            max="24"
            step="1"
            value={localPitch}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLocalPitch(val);
              onUpdateSetting('pitch', val);
            }}
            className={`w-full sound-slider ${isMelodic ? 'sound-slider-amber' : 'sound-slider-zinc'}`}
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>-2 Oct</span>
            <span>{localPitch > 0 ? '+' : ''}{localPitch} st</span>
            <span>+2 Oct</span>
          </div>
        </div>
        
        {/* Filter Cutoff */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Waves className="w-4 h-4" />
            <span className="text-sm font-medium">Filter Cutoff</span>
          </div>
          <input
            type="range"
            min="20"
            max="20000"
            step="10"
            value={localCutoff}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLocalCutoff(val);
              onUpdateSetting('cutoff', val);
            }}
            className="w-full sound-slider sound-slider-zinc"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>Low</span>
            <span>{localCutoff < 1000 ? localCutoff : `${(localCutoff/1000).toFixed(1)}k`}Hz</span>
            <span>High</span>
          </div>
        </div>

        {/* Filter Resonance */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Waves className="w-4 h-4" />
            <span className="text-sm font-medium">Resonance</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="20"
            step="0.1"
            value={localResonance}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLocalResonance(val);
              onUpdateSetting('resonance', val);
            }}
            className="w-full sound-slider sound-slider-zinc"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>Flat</span>
            <span>{localResonance.toFixed(1)}</span>
            <span>Peak</span>
          </div>
        </div>

        {/* Attack */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-medium">Attack</span>
          </div>
          <input
            type="range"
            min="0.001"
            max="0.5"
            step="0.001"
            value={localAttack}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLocalAttack(val);
              onUpdateSetting('attack', val);
            }}
            className="w-full sound-slider sound-slider-purple"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>Punch</span>
            <span>{localAttack.toFixed(3)}s</span>
            <span>Soft</span>
          </div>
        </div>

        {/* Decay */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Decay</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="2.0"
            step="0.01"
            value={localDecay}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLocalDecay(val);
              onUpdateSetting('decay', val);
            }}
            className="w-full sound-slider sound-slider-indigo"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>Short</span>
            <span>{localDecay.toFixed(2)}s</span>
            <span>Long</span>
          </div>
        </div>

        {/* Sustain - Only meaningful for envelopes that support it (most do now) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <BarChart2 className="w-4 h-4" />
            <span className="text-sm font-medium">Sustain</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localSustain}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLocalSustain(val);
              onUpdateSetting('sustain', val);
            }}
            className="w-full sound-slider sound-slider-teal"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>Silence</span>
            <span>{(localSustain * 100).toFixed(0)}%</span>
            <span>Full</span>
          </div>
        </div>

        {/* Release */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Activity className="w-4 h-4 rotate-180" />
            <span className="text-sm font-medium">Release</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="3.0"
            step="0.01"
            value={localRelease}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLocalRelease(val);
              onUpdateSetting('release', val);
            }}
            className="w-full sound-slider sound-slider-pink"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>Short</span>
            <span>{localRelease.toFixed(2)}s</span>
            <span>Long</span>
          </div>
        </div>

        {/* Distortion */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Distortion</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localDistortion}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLocalDistortion(val);
              onUpdateSetting('distortion', val);
            }}
            className="w-full sound-slider sound-slider-orange"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>Clean</span>
            <span>{(localDistortion * 100).toFixed(0)}%</span>
            <span>Dirty</span>
          </div>
        </div>
        
        {/* Waveform Visualization - Simplified for new params */}
        <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 mt-4">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <Waves className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">ADSR Preview</span>
            </div>
            <div className="h-24 flex items-end justify-center gap-[2px] px-2">
                {(() => {
                  const points = 40;
                  const waveform = [];
                  
                  // Simplified ADSR visualization
                  // A: 0 -> 1
                  // D: 1 -> S
                  // S: Hold S
                  // R: S -> 0

                  // Time proportions (rough approx for visualizer)
                  const totalTime = localAttack + localDecay + 1 + localRelease; 
                  
                  for (let i = 0; i < points; i++) {
                    const t = (i / points) * totalTime;
                    let amplitude = 0;

                    if (t < localAttack) {
                        amplitude = t / localAttack;
                    } else if (t < localAttack + localDecay) {
                        const decayProgress = (t - localAttack) / localDecay;
                        amplitude = 1 - (decayProgress * (1 - localSustain));
                    } else if (t < localAttack + localDecay + 1) {
                        amplitude = localSustain;
                    } else {
                        const releaseProgress = (t - (localAttack + localDecay + 1)) / localRelease;
                         amplitude = localSustain * (1 - releaseProgress);
                    }
                    
                    // Clamp
                    amplitude = Math.max(0, Math.min(1, amplitude));

                    // Apply distortion visual effect
                    if (localDistortion > 0.1) {
                      amplitude = Math.tanh(amplitude * (1 + localDistortion * 2));
                    }

                    const height = Math.max(5, amplitude * 100);
                    waveform.push(height);
                  }

                  return waveform.map((height, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t transition-all duration-300 ${
                        track.type === 'kick' ? 'bg-indigo-500' :
                        track.type === 'snare' ? 'bg-purple-500' :
                        track.type === 'hihat' ? 'bg-pink-500' : 
                        isMelodic ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ height: `${height}%`, opacity: 0.6 + (height / 100) * 0.4 }}
                    />
                  ));
                })()}
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-zinc-600 font-mono">
              <span>Att</span>
              <span>Dec</span>
              <span>Sus</span>
              <span>Rel</span>
            </div>
        </div>
      </div>
    </div>
  );
};
