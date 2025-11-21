/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, Music, Zap, Plus, Play, Square } from 'lucide-react';
import * as Tone from 'tone';
import type { InstrumentType } from '../hooks/useSequencer';

interface Sample {
  id: number;
  name: string;
  description: string;
  type: InstrumentType;
  pattern?: boolean[]; // Optional pre-defined pattern
}

interface DetectedBeat {
  step: number;
  type: InstrumentType;
  velocity: number;
}

interface SampleBrowserProps {
  onClose: () => void;
  onSelectSample: (type: InstrumentType, name: string, pattern?: boolean[]) => void;
  onBeatsDetected?: (beats: DetectedBeat[], bpm: number) => void;
}

export const SampleBrowser: React.FC<SampleBrowserProps> = ({ onClose, onSelectSample }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [previewingId, setPreviewingId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewSynthsRef = useRef<Map<InstrumentType, any>>(new Map());
  const previewLoopRef = useRef<number | null>(null);

  // Initialize preview synthesizers
  useEffect(() => {
    const initSynths = async () => {
      await Tone.start();

      // Create preview synths for each instrument type
      const kickSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
      }).toDestination();

      const snareSynth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
      }).toDestination();

      const hihatSynth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).toDestination();

      const clapSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 0.5,
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
      }).toDestination();

      previewSynthsRef.current.set('kick', kickSynth);
      previewSynthsRef.current.set('snare', snareSynth);
      previewSynthsRef.current.set('hihat', hihatSynth);
      previewSynthsRef.current.set('clap', clapSynth);
    };

    initSynths();

    return () => {
      // Cleanup synths on unmount
      if (previewLoopRef.current !== null) {
        clearInterval(previewLoopRef.current);
      }
      previewSynthsRef.current.forEach(synth => synth.dispose());
      previewSynthsRef.current.clear();
    };
  }, []);

  // Perfect preset tracks - No API, built-in synth-based
  const [freeSamples] = useState<Sample[]>([
    // KICK DRUMS - Different sonic characteristics
    {
      id: 1,
      name: '808 Boom',
      description: 'Classic 808 sub bass kick',
      type: 'kick',
      pattern: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false]
    },
    {
      id: 2,
      name: 'Four Floor',
      description: 'House music 4-on-floor pattern',
      type: 'kick',
      pattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false]
    },
    {
      id: 3,
      name: 'Syncopated',
      description: 'Off-beat kick pattern',
      type: 'kick',
      pattern: [true, false, false, true, false, false, true, false, false, false, true, false, false, false, false, false]
    },
    {
      id: 4,
      name: 'Double Kick',
      description: 'Fast double kick hits',
      type: 'kick',
      pattern: [true, false, true, false, false, false, false, false, true, false, true, false, false, false, false, false]
    },

    // SNARE DRUMS - Different patterns
    {
      id: 5,
      name: 'Backbeat',
      description: 'Classic 2 and 4 snare',
      type: 'snare',
      pattern: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false]
    },
    {
      id: 6,
      name: 'Breakbeat',
      description: 'Hip-hop break pattern',
      type: 'snare',
      pattern: [false, false, false, false, true, false, true, false, false, false, false, true, true, false, false, false]
    },
    {
      id: 7,
      name: 'Rapid Fire',
      description: 'Fast snare rolls',
      type: 'snare',
      pattern: [false, false, false, false, true, false, false, true, false, false, true, true, true, false, false, false]
    },
    {
      id: 8,
      name: 'Rimshot',
      description: 'Tight rim snare pattern',
      type: 'snare',
      pattern: [false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false]
    },

    // HI-HATS - Different grooves
    {
      id: 9,
      name: 'Straight 8ths',
      description: 'Even eighth note hats',
      type: 'hihat',
      pattern: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]
    },
    {
      id: 10,
      name: '16th Groove',
      description: 'Continuous 16th notes',
      type: 'hihat',
      pattern: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
    },
    {
      id: 11,
      name: 'Off-Beat',
      description: 'Upbeat hihat pattern',
      type: 'hihat',
      pattern: [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true]
    },
    {
      id: 12,
      name: 'Triplet Feel',
      description: 'Swung hihat groove',
      type: 'hihat',
      pattern: [true, false, true, false, false, true, false, true, true, false, true, false, false, true, false, true]
    },

    // CLAPS - Different rhythms
    {
      id: 13,
      name: 'Simple Clap',
      description: 'Basic 2 and 4 claps',
      type: 'clap',
      pattern: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false]
    },
    {
      id: 14,
      name: 'Double Clap',
      description: 'Double hit clap accent',
      type: 'clap',
      pattern: [false, false, false, false, true, true, false, false, false, false, false, false, true, true, false, false]
    },
    {
      id: 15,
      name: 'Percussion',
      description: 'Rhythmic clap pattern',
      type: 'clap',
      pattern: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false]
    },
    {
      id: 16,
      name: 'Shuffle Clap',
      description: 'Syncopated clap rhythm',
      type: 'clap',
      pattern: [false, false, false, true, false, false, true, false, false, false, false, true, false, false, true, false]
    },

    // EMPTY TRACKS - For manual programming
    {
      id: 17,
      name: 'Blank Kick',
      description: 'Empty kick track - program your own',
      type: 'kick',
      pattern: Array(16).fill(false)
    },
    {
      id: 18,
      name: 'Blank Snare',
      description: 'Empty snare track - program your own',
      type: 'snare',
      pattern: Array(16).fill(false)
    },
    {
      id: 19,
      name: 'Blank HiHat',
      description: 'Empty hihat track - program your own',
      type: 'hihat',
      pattern: Array(16).fill(false)
    },
    {
      id: 20,
      name: 'Blank Clap',
      description: 'Empty clap track - program your own',
      type: 'clap',
      pattern: Array(16).fill(false)
    },
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show coming soon message
    setShowComingSoon(true);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Hide message after 3 seconds
    setTimeout(() => {
      setShowComingSoon(false);
    }, 3000);
  };

  const handleAddSample = (sample: Sample) => {
    onSelectSample(sample.type, sample.name, sample.pattern);
    // Don't close modal, allow adding multiple tracks
  };

  const handlePreview = async (sample: Sample) => {
    await Tone.start();

    // If already previewing this sample, stop it
    if (previewingId === sample.id) {
      if (previewLoopRef.current !== null) {
        clearInterval(previewLoopRef.current);
        previewLoopRef.current = null;
      }
      setPreviewingId(null);
      return;
    }

    // Stop any existing preview
    if (previewLoopRef.current !== null) {
      clearInterval(previewLoopRef.current);
    }

    // Start new preview
    setPreviewingId(sample.id);

    const synth = previewSynthsRef.current.get(sample.type);
    if (!synth) return;

    // Get pattern or create a simple demo pattern
    const pattern = sample.pattern || [true, false, false, false, false, false, false, false];

    let currentStep = 0;

    // Play pattern in a loop
    const playPattern = () => {
      if (pattern[currentStep]) {
        const now = Tone.now();
        if (sample.type === 'kick') {
          synth.triggerAttackRelease('C1', '8n', now, 1.0);
        } else if (sample.type === 'snare') {
          synth.triggerAttackRelease('8n', now, 1.0);
        } else if (sample.type === 'hihat') {
          synth.triggerAttackRelease('32n', now, 0.8);
        } else if (sample.type === 'clap') {
          synth.triggerAttackRelease('C2', '16n', now, 1.0);
        }
      }
      currentStep = (currentStep + 1) % pattern.length;
    };

    // Play immediately
    playPattern();

    // Continue playing at 120 BPM (16th notes)
    const interval = (60 / 120) * 0.25 * 1000; // milliseconds per 16th note
    previewLoopRef.current = window.setInterval(playPattern, interval);

    // Auto-stop after 4 bars
    setTimeout(() => {
      if (previewingId === sample.id) {
        if (previewLoopRef.current !== null) {
          clearInterval(previewLoopRef.current);
          previewLoopRef.current = null;
        }
        setPreviewingId(null);
      }
    }, interval * pattern.length * 4);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Sample Library & AI Beat Detection</h2>
              <p className="text-xs text-zinc-500">Browse samples or upload MP3 to extract beats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'library'
                ? 'text-white bg-zinc-800 border-b-2 border-indigo-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Sample Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'text-white bg-zinc-800 border-b-2 border-indigo-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            AI Beat Detection
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'library' && (
            <div className="grid gap-2">
              <p className="text-zinc-400 text-sm mb-2">
                Click <Play className="w-3 h-3 inline" /> to preview sound • Click <Plus className="w-3 h-3 inline" /> to add track
              </p>
              {freeSamples.map((sample) => (
                <div
                  key={sample.id}
                  className="bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex items-center justify-between transition-colors group"
                >
                  <div className="flex-1 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      sample.type === 'kick' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' :
                      sample.type === 'snare' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                      sample.type === 'hihat' ? 'bg-gradient-to-br from-pink-500 to-pink-600' :
                      'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}>
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm mb-0.5">{sample.name}</p>
                      <p className="text-zinc-500 text-xs">{sample.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          sample.type === 'kick' ? 'bg-indigo-500/20 text-indigo-300' :
                          sample.type === 'snare' ? 'bg-purple-500/20 text-purple-300' :
                          sample.type === 'hihat' ? 'bg-pink-500/20 text-pink-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>{sample.type}</span>
                        {sample.pattern && sample.pattern.some(s => s) && (
                          <span className="text-[10px] text-zinc-600">
                            {sample.pattern.filter(s => s).length} hits
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Preview Button */}
                    <button
                      onClick={() => handlePreview(sample)}
                      className={`p-2.5 rounded-lg font-bold transition-all flex items-center justify-center shadow-lg hover:shadow-xl ${
                        previewingId === sample.id
                          ? 'bg-indigo-500 text-white scale-105'
                          : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      }`}
                      title={previewingId === sample.id ? 'Stop Preview' : 'Preview Sound'}
                    >
                      {previewingId === sample.id ? (
                        <Square className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>

                    {/* Add Button */}
                    <button
                      onClick={() => handleAddSample(sample)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-all flex items-center gap-2 text-sm shadow-lg hover:shadow-xl hover:scale-105 group-hover:bg-green-400"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 rounded-xl p-12 text-center hover:border-indigo-500 transition-colors cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mp3,audio/mpeg,audio/wav"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <p className="text-white font-bold text-lg mb-2">Upload Audio File</p>
                <p className="text-zinc-500 text-sm">AI Beat Detection & Pattern Extraction</p>
              </div>

              {/* Coming Soon Snackbar */}
              {showComingSoon && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 shadow-2xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-white" />
                    <div className="flex-1">
                      <p className="text-white font-bold text-lg">Coming Soon! 🚀</p>
                      <p className="text-indigo-100 text-sm">AI Beat Detection will be implemented in the next update</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
