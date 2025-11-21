import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Plus, Waves, Play, Sparkles, Loader2 } from 'lucide-react';
import * as Tone from 'tone';
import { createTrack, INITIAL_STEPS } from '../hooks/useSequencer';
import type { TrackSettings } from '../hooks/useSequencer';
import { presetService, type Preset } from '../services/api';
import { ChatBox } from '../components/ChatBox';

// Full 88-key piano range (C8 down to A0)
const PIANO_NOTES = [
  "C8", "B7", "A#7", "A7", "G#7", "G7", "F#7", "F7", "E7", "D#7", "D7", "C#7", "C7",
  "B6", "A#6", "A6", "G#6", "G6", "F#6", "F6", "E6", "D#6", "D6", "C#6", "C6",
  "B5", "A#5", "A5", "G#5", "G5", "F#5", "F5", "E5", "D#5", "D5", "C#5", "C5",
  "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4", "C4",
  "B3", "A#3", "A3", "G#3", "G3", "F#3", "F3", "E3", "D#3", "D3", "C#3", "C3",
  "B2", "A#2", "A2", "G#2", "G2", "F#2", "F2", "E2", "D#2", "D2", "C#2", "C2",
  "B1", "A#1", "A1", "G#1", "G1", "F#1", "F1", "E1", "D#1", "D1", "C#1", "C1",
  "B0", "A#0", "A0"
];

const resolveStepCount = (melody: Record<string, number[]>, baseSteps: number) => {
  const highestStep = Object.values(melody)
    .flat()
    .reduce((max, step) => (step > max ? step : max), 0);

  return Math.max(baseSteps, highestStep + 1, 64);
};

const createPianoTemplate = (
  templateId: string,
  melody: Record<string, number[]>,
  stepCount: number,
  customSettings?: Partial<TrackSettings>
) => {
  const resolvedStepCount = resolveStepCount(melody, stepCount);

  // 1. Identify which octaves are actually used in this song
  const usedOctaves = new Set<number>();
  Object.keys(melody).forEach(note => {
    const octave = parseInt(note.slice(-1));
    if (!isNaN(octave)) usedOctaves.add(octave);
  });

  // 2. Ensure at least 3, 4, 5 are visible if no others are used, 
  // but if lower/higher are used, show them too.
  // Actually, let's just show exactly what is used + 3,4,5 as a safe baseline?
  // User wants "perfect" and "no hidden notes playing".
  // So we MUST show all octaves that have notes.
  
  return PIANO_NOTES.map(note => {
    const activeSteps = melody[note] || [];
    const pattern = Array(resolvedStepCount).fill(false);
    activeSteps.forEach(step => {
      if (step < resolvedStepCount) pattern[step] = true;
    });

    const semitones = Tone.Frequency(note).toMidi() - Tone.Frequency("C4").toMidi();
    const octave = parseInt(note.slice(-1));

    // Logic: If this octave contains any notes in the melody, show it.
    // Otherwise, hide it (unless it's the middle C4 range which we might want to keep as anchor? 
    // No, user wants clean "only playing" view).
    // Let's keep 3,4,5 as default "center" but expand if needed.
    
    const isUsedInSong = usedOctaves.has(octave);
    
    // If the song uses Octave 2, we show Octave 2.
    // If the song ONLY uses Octave 4, should we hide 3 and 5?
    // "ensure the octaves soe arehidden those are not beong played" -> 
    // "Ensure that hidden octaves are NOT being played".
    // This implies: Visible = Played. Hidden = Not Played.
    
    const isHidden = !isUsedInSong;

    return createTrack(
      `piano-${templateId}-${note}`,
      'piano',
      note,
      resolvedStepCount,
      pattern,
      { pitch: semitones, ...customSettings },
      isHidden
    );
  });
};

const templates = [
  {
    id: 'ode-to-joy',
    name: 'Ode to Joy',
    description: 'Beethoven\'s iconic melody. Full 8-bar theme.',
    bpm: 120,
    stepCount: 128,
    tracks: createPianoTemplate('ode', {
      // Bar 1
      "E4": [0, 4, 24, 44, 48, 64, 68, 88, 108],
      "F4": [8, 20, 72, 84],
      "G4": [12, 16, 76, 80],
      // Bar 2
      "D4": [28, 40, 54, 56, 92, 104, 112],
      // Bar 3
      "C4": [32, 36, 96, 100, 118, 120],
      // Accompaniment (Simple bass)
      "C3": [0, 16, 32, 48, 64, 80, 96, 112],
      "G3": [8, 24, 40, 56, 72, 88, 104, 120]
    }, 128)
  },
  {
    id: 'fur-elise',
    name: 'Für Elise',
    description: 'The famous bagatelle by Beethoven. Extended main theme.',
    bpm: 140,
    stepCount: 128,
    tracks: createPianoTemplate('elise', {
      // Main Motif + Bridges (Right Hand)
      "E5": [0, 4, 8, 88, 92, 96],
      "D#5": [2, 6, 90, 94],
      "B4": [10, 26, 34, 98, 114, 122],
      "D5": [12, 100],
      "C5": [14, 36, 102, 124],
      "A4": [16, 24, 104, 112],
      "C4": [20, 108],
      "E4": [22, 30, 110, 118],
      "G#4": [32, 120],
      
      // Left Hand Arpeggios - Uses Octave 2 and 3
      "A2": [0, 16, 88, 104],
      "E3": [2, 18, 90, 106], 
      "A3": [4, 20, 48, 92, 108, 136],
      "G#2": [30, 118],
      "G#3": [24, 34, 112, 122]
    }, 128)
  },
  {
    id: 'moonlight',
    name: 'Moonlight Sonata',
    description: 'Atmospheric triplet arpeggios from Beethoven\'s masterpiece.',
    bpm: 100,
    stepCount: 96,
    tracks: createPianoTemplate('moonlight', {
      // Triplet pattern C#m / G#7 (Right/Mid Hand)
      "G#3": [2, 8, 14, 20, 26, 32, 38, 44, 50, 56, 62, 68, 74, 80, 86, 92],
      "C#4": [4, 10, 16, 22, 28, 34, 40, 46, 52, 58, 64, 70, 76, 82, 88, 94],
      
      // Melody overlay (High Right Hand)
      "G#4": [4, 48], 
      "C#5": [52],

      // Bass (Left Hand) - Uses Octave 2 and 3
      "C#3": [0, 6, 12, 18],
      "B2": [24, 30, 36, 42],
      "A2": [48, 54, 60, 66],
      "F#2": [72, 78, 84, 90]
    }, 96, { release: 2.0, attack: 0.05 })
  },
  {
    id: 'gymnopedie',
    name: 'Gymnopédie No.1',
    description: 'Erik Satie\'s ambient and melancholic masterpiece. Extended.',
    bpm: 60,
    stepCount: 64,
    tracks: createPianoTemplate('gym', {
      // Bass Notes (Left Hand) - Uses Octave 3
      "G3": [0, 32],
      "D3": [16, 48],
      // Chords (Right Hand) - Uses Octave 4/5
      "F#4": [4, 8, 12, 20, 24, 28, 36, 40, 44, 52, 56, 60],
      "A4": [4, 8, 12, 20, 24, 28, 36, 40, 44, 52, 56, 60],
      "C#5": [4, 8, 12, 20, 24, 28, 36, 40, 44, 52, 56, 60]
    }, 64, { release: 1.5, decay: 1.0 })
  },
  {
    id: 'clocks',
    name: 'Modern Pop Piano',
    description: 'Arpeggiated chords inspired by modern pop anthems.',
    bpm: 130,
    stepCount: 64,
    tracks: createPianoTemplate('clocks', {
      "D#4": [0, 3, 6, 16, 19, 22, 32, 35, 38, 48, 51, 54],
      "A#3": [1, 4, 7, 17, 20, 23, 33, 36, 39, 49, 52, 55],
      "G3": [2, 5, 18, 21],
      "C#4": [8, 11, 14, 24, 27, 30, 40, 43, 46, 56, 59, 62],
      "G#3": [9, 12, 15, 25, 28, 31, 41, 44, 47, 57, 60, 63],
      "F3": [10, 13, 26, 29],
      // Bass - Octave 2 and 3
      "D#3": [0, 16],
      "A#2": [32, 48]
    }, 64)
  },
  {
    id: 'scale',
    name: 'C Major Scale',
    description: 'Two octave run of C Major.',
    bpm: 120,
    stepCount: 32,
    tracks: createPianoTemplate('scale', {
      "C3": [0], "D3": [1], "E3": [2], "F3": [3],
      "G3": [4], "A3": [5], "B3": [6], "C4": [7],
      "D4": [8], "E4": [9], "F4": [10], "G4": [11],
      "A4": [12], "B4": [13], "C5": [14], "D5": [15],
      "E5": [16], "F5": [17], "G5": [18], "A5": [19],
      "B5": [20], "C6": [21]
    }, 32)
  },
  {
    id: 'canon',
    name: 'Canon in D',
    description: 'Pachelbel-inspired canon. 8-bar progression.',
    bpm: 90,
    stepCount: 128,
    tracks: createPianoTemplate('canon', {
      // Bass Line - Essential Pachelbel Bass (Octave 2 and 3)
      // D - A - B - F# - G - D - G - A
      "D3": [0, 16, 80, 96],
      "A2": [16, 32, 112],
      "B2": [32, 48],
      "F#2": [48, 64],
      "G2": [64, 80, 96, 112],
      
      // Arpeggios / Melody (Octave 3 and 4)
      "F#4": [0, 4, 8, 12], // D
      "E4": [16, 20, 24, 28], // A
      "D4": [32, 36, 40, 44, 80, 84, 88, 92], // Bm / D
      "C#4": [48, 52, 56, 60], // F#m
      "B3": [64, 68, 72, 76, 96, 100, 104, 108], // G
      "A3": [112, 116, 120, 124] // A
    }, 128)
  }
];

export function HomePage() {
  const navigate = useNavigate();
  const [presets, setPresets] = useState<Preset[]>(templates);
  const [publicBeats, setPublicBeats] = useState<Preset[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isLoadingPublicBeats, setIsLoadingPublicBeats] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null);

  useEffect(() => {
    loadPresetsFromAPI();
    loadPublicBeats();
  }, []);

  const loadPresetsFromAPI = async () => {
    setIsLoadingPresets(true);
    try {
      const [fetchedPresets, current] = await Promise.all([
        presetService.getPresets(),
        presetService.getCurrentPreset()
      ]);

      if (current) {
        setCurrentPreset(current);
      }

      // Always use templates for the preset section
      setPresets(templates);
    } catch (error) {
      console.error('Error loading presets:', error);
      setPresets(templates);
    } finally {
      setIsLoadingPresets(false);
    }
  };

  const loadPublicBeats = async () => {
    setIsLoadingPublicBeats(true);
    try {
      const beats = await presetService.getPresets();
      setPublicBeats(beats || []);
    } catch (error) {
      console.error('Error loading public beats:', error);
      setPublicBeats([]);
    } finally {
      setIsLoadingPublicBeats(false);
    }
  };

  const handleCreateEmpty = () => {
    navigate('/studio');
  };

  const handleLoadTemplate = (template: Preset) => {
    navigate('/studio', {
      state: {
        tracks: template.tracks,
        bpm: template.bpm,
        stepCount: template.stepCount ?? INITIAL_STEPS
      }
    });
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-zinc-800 bg-zinc-900/50">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="container mx-auto px-6 py-24 relative z-10 text-center">
          
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
            PRO<span className="text-indigo-500">BEAT</span> STUDIO
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            ADHD curer.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleCreateEmpty}
              className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Create New Beat</span>
              </div>
            </button>

            <button
              onClick={handleOpenChat}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>Get Started with AI</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Current Preset Section */}
      {currentPreset && (
        <div className="container mx-auto px-6 py-10 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold">Current Preset</h2>
          </div>

          <div className="max-w-md">
            <div className="group bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/50 hover:from-purple-900/30 hover:to-indigo-900/30 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => handleLoadTemplate(currentPreset)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>

              <div className="flex justify-between items-start mb-4 relative">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Music className="w-6 h-6 text-purple-400" />
                </div>
                <div className="px-2 py-1 rounded-lg bg-purple-600/20 border border-purple-500/30 text-xs font-mono text-purple-400">
                  {currentPreset.bpm} BPM
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2 text-purple-300 group-hover:text-purple-200 transition-colors">{currentPreset.name}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                {currentPreset.description}
              </p>

              <div className="flex items-center text-sm font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
                <Play className="w-4 h-4 mr-2 fill-current" />
                Open Studio
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Presets Section */}
      <div className="container mx-auto px-6 py-20 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-10">
          <Waves className="w-6 h-6 text-indigo-500" />
          <h2 className="text-2xl font-bold">Explore Presets</h2>
        </div>

        {isLoadingPresets ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-zinc-500">Loading presets...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presets.map(preset => (
              <div
                key={preset.id}
                className="group bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-zinc-900 transition-all hover:shadow-2xl cursor-pointer relative overflow-hidden"
                onClick={() => handleLoadTemplate(preset)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all"></div>

                <div className="flex justify-between items-start mb-4 relative">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Music className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400" />
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-zinc-800 text-xs font-mono text-zinc-500">
                    {preset.bpm} BPM
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">{preset.name}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                  {preset.description}
                </p>

                <div className="flex items-center text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Open Studio
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public Beats Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-10">
          <Music className="w-6 h-6 text-purple-500" />
          <h2 className="text-2xl font-bold">Public Beats</h2>
          <span className="px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-400 text-xs font-semibold">
            {publicBeats.length} beats
          </span>
        </div>

        {isLoadingPublicBeats ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <p className="text-zinc-500">Loading public beats...</p>
            </div>
          </div>
        ) : publicBeats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Music className="w-16 h-16 text-zinc-700 mb-4" />
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">No Public Beats Yet</h3>
            <p className="text-zinc-600 max-w-md">
              Create and save your first beat in the studio to see it here!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicBeats.map(beat => (
              <div
                key={beat.id}
                className="group bg-gradient-to-br from-purple-900/10 to-pink-900/10 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 hover:from-purple-900/20 hover:to-pink-900/20 transition-all hover:shadow-2xl cursor-pointer relative overflow-hidden"
                onClick={() => handleLoadTemplate(beat)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>

                <div className="flex justify-between items-start mb-4 relative">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Music className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-purple-600/20 border border-purple-500/30 text-xs font-mono text-purple-400">
                    {beat.bpm} BPM
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-2 text-purple-300 group-hover:text-purple-200 transition-colors">{beat.name}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-2">
                  {beat.description}
                </p>

                <div className="flex items-center text-sm font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Open Studio
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ChatBox */}
      {isChatOpen && <ChatBox onClose={handleCloseChat} />}
    </div>
  );
}

