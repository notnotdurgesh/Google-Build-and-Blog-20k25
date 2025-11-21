/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

export type InstrumentType = 'piano';

export interface TrackSettings {
  pitch: number;
  decay: number;
  attack: number;
  distortion: number;
  sustain: number;
  release: number;
  cutoff: number; // Frequency in Hz (20 to 20000)
  resonance: number; // Q factor
}

export interface Track {
  id: string;
  name: string;
  type: InstrumentType;
  steps: boolean[];
  mute: boolean;
  solo: boolean;
  volume: number;
  pan: number;
  settings: TrackSettings;
  savedPreset?: string;
  hidden?: boolean; // New property for visibility
}

export const INITIAL_STEPS = 16;
export const MAX_STEPS = 64;
export const INITIAL_BPM = 120;

const DEFAULT_SETTINGS: Record<InstrumentType, TrackSettings> = {
  piano: { pitch: 0, decay: 0.5, attack: 0.01, distortion: 0, sustain: 0.3, release: 0.8, cutoff: 20000, resonance: 1 },
};

export const createTrack = (
  id: string,
  type: InstrumentType,
  name: string,
  stepCount: number,
  pattern?: boolean[],
  customSettings?: Partial<TrackSettings>,
  hidden: boolean = false
): Track => ({
  id,
  name,
  type,
  steps: pattern && pattern.length === stepCount ? pattern : Array(stepCount).fill(false),
  mute: false,
  solo: false,
  volume: -5, // Default to -5dB for piano to prevent clipping with many keys
  pan: 0,
  settings: { ...DEFAULT_SETTINGS[type], ...customSettings },
  hidden
});

// Full 88 Keys (C8 down to A0)
const PIANO_NOTES = [
  "C8", "B7", "A#7", "A7", "G#7", "G7", "F#7", "F7", "E7", "D#7", "D7", "C#7",
  "C7", "B6", "A#6", "A6", "G#6", "G6", "F#6", "F6", "E6", "D#6", "D6", "C#6",
  "C6", "B5", "A#5", "A5", "G#5", "G5", "F#5", "F5", "E5", "D#5", "D5", "C#5",
  "C5", "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4",
  "C4", "B3", "A#3", "A3", "G#3", "G3", "F#3", "F3", "E3", "D#3", "D3", "C#3",
  "C3", "B2", "A#2", "A2", "G#2", "G2", "F#2", "F2", "E2", "D#2", "D2", "C#2",
  "C2", "B1", "A#1", "A1", "G#1", "G1", "F#1", "F1", "E1", "D#1", "D1", "C#1",
  "C1", "B0", "A#0", "A0"
];

const createInitialTracks = (): Track[] => {
  return PIANO_NOTES.map((note) => {
    // Calculate semitone difference from C4
    const semitones = Tone.Frequency(note).toMidi() - Tone.Frequency("C4").toMidi();
    
    // Default visible range: C3 to C5
    const midi = Tone.Frequency(note).toMidi();
    const isVisible = midi >= Tone.Frequency("C3").toMidi() && midi <= Tone.Frequency("C5").toMidi();

    return createTrack(
      `piano-${note}`,
      'piano',
      note,
      INITIAL_STEPS,
      undefined,
      { pitch: semitones },
      !isVisible // Hidden if not in range
    );
  });
};

export function useSequencer(initialData?: { tracks?: Track[], bpm?: number, stepCount?: number }) {
  const [stepCount, setStepCount] = useState(initialData?.stepCount || INITIAL_STEPS);
  const [tracks, setTracks] = useState<Track[]>(initialData?.tracks || createInitialTracks());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(initialData?.bpm || INITIAL_BPM);
  const [isLoaded, setIsLoaded] = useState(false);

  // Master Effects State
  const [masterVolume, setMasterVolume] = useState(0);
  const [reverbAmount, setReverbAmount] = useState(0.1);
  const [delayAmount, setDelayAmount] = useState(0);

  // Refs for Tone instruments and effects - KEYED BY TRACK ID now
  const instruments = useRef<Map<string, any>>(new Map());
  const channels = useRef<Map<string, Tone.Channel>>(new Map());
  const distortions = useRef<Map<string, Tone.Distortion>>(new Map());
  const filters = useRef<Map<string, Tone.Filter>>(new Map());
  
  // Shared Piano Instrument
  const pianoInstrument = useRef<Tone.PolySynth | null>(null);
  const pianoChannel = useRef<Tone.Channel | null>(null);

  // Master Chain Refs
  const masterLimiter = useRef<Tone.Limiter | null>(null);
  const masterReverb = useRef<Tone.Reverb | null>(null);
  const masterDelay = useRef<Tone.FeedbackDelay | null>(null);
  const masterGain = useRef<Tone.Volume | null>(null);

  // Setup Single Instrument (Helper)
  const createInstrument = useCallback((track: Track) => {
      // For piano, we use the shared instrument, so we don't create individual synths.
      // But we might want to keep non-piano logic here if we ever add other instruments back.
      if (track.type === 'piano') return;
      
      if (!masterReverb.current) return;

    const distortion = new Tone.Distortion(0).connect(masterReverb.current);
    const channel = new Tone.Channel({ volume: 0, pan: 0 }).connect(distortion);
    const filter = new Tone.Filter(track.settings.cutoff || 20000, "lowpass", -12).connect(channel);
    filter.Q.value = track.settings.resonance || 1;

    let synth;
    // ... (Non-piano synth creation logic would go here if needed)

    if (synth) {
       // synth.connect(filter);
       instruments.current.set(track.id, synth);
    }
    
    channels.current.set(track.id, channel);
    distortions.current.set(track.id, distortion);
    filters.current.set(track.id, filter);
  }, []);

  // Initialize Audio Engine
  useEffect(() => {
    masterLimiter.current = new Tone.Limiter(-1);
    masterReverb.current = new Tone.Reverb({ decay: 2, wet: 0.1 });
    masterDelay.current = new Tone.FeedbackDelay("8n", 0.5);
    masterGain.current = new Tone.Volume(0);
    
    // Shared Piano Setup
    // Create a dedicated channel for the piano to allow global piano volume/pan mixing if needed
    pianoChannel.current = new Tone.Channel({ volume: -2, pan: 0 });
    
    // Create a single PolySynth for all 88 keys to save performance
    pianoInstrument.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' }, // Triangle wave is closer to a basic key sound than pulse
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 1.2 }
    });
    pianoInstrument.current.maxPolyphony = 64; // Increase polyphony to prevent voice stealing on complex tracks

    // Chain
    // Piano -> PianoChannel -> Reverb -> Delay -> Limiter -> Gain -> Destination
    pianoInstrument.current.connect(pianoChannel.current);
    pianoChannel.current.connect(masterReverb.current);
    
    masterReverb.current.connect(masterDelay.current);
    masterDelay.current.connect(masterLimiter.current);
    masterLimiter.current.connect(masterGain.current);
    masterGain.current.toDestination();
    
    // Initialize reverb
    masterReverb.current.generate();

    // Create instruments for initial tracks (non-piano)
    tracks.forEach(track => createInstrument(track));

    setTimeout(() => setIsLoaded(true), 0);

    // Copy refs for cleanup
    const instrumentsRef = instruments.current;
    const channelsRef = channels.current;
    const distortionsRef = distortions.current;
    const filtersRef = filters.current;
    const reverbRef = masterReverb.current;
    const delayRef = masterDelay.current;
    const limiterRef = masterLimiter.current;
    const gainRef = masterGain.current;
    const pianoRef = pianoInstrument.current;
    const pianoChanRef = pianoChannel.current;

    return () => {
      instrumentsRef.forEach(inst => inst.dispose());
      channelsRef.forEach(chan => chan.dispose());
      distortionsRef.forEach(dist => dist.dispose());
      filtersRef.forEach(filt => filt.dispose());
      reverbRef?.dispose();
      delayRef?.dispose();
      limiterRef?.dispose();
      gainRef?.dispose();
      pianoRef?.dispose();
      pianoChanRef?.dispose();
      instrumentsRef.clear();
      channelsRef.clear();
      distortionsRef.clear();
      filtersRef.clear();
      Tone.Transport.stop();
      Tone.Transport.position = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createInstrument]);


  // Sync Tracks to Audio Engine (Add/Remove)
  useEffect(() => {
      if (!isLoaded) return;

      // 1. Create missing instruments (only non-piano)
      tracks.forEach(track => {
          if (track.type !== 'piano' && !instruments.current.has(track.id)) {
              createInstrument(track);
          }
      });

      // 2. Remove deleted instruments
      const trackIds = new Set(tracks.map(t => t.id));
      instruments.current.forEach((_, id) => {
          if (!trackIds.has(id)) {
              instruments.current.get(id)?.dispose();
              channels.current.get(id)?.dispose();
              distortions.current.get(id)?.dispose();
              filters.current.get(id)?.dispose();
              
              instruments.current.delete(id);
              channels.current.delete(id);
              distortions.current.delete(id);
              filters.current.delete(id);
          }
      });

  }, [tracks, isLoaded, createInstrument]);


  // Update BPM
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  // Update Master Effects
  useEffect(() => {
    if (masterReverb.current) masterReverb.current.wet.rampTo(reverbAmount, 0.1);
    if (masterDelay.current) masterDelay.current.wet.rampTo(delayAmount, 0.1);
    if (masterGain.current) masterGain.current.volume.rampTo(masterVolume, 0.1);
  }, [reverbAmount, delayAmount, masterVolume]);

  // Update Channel settings (Volume/Pan/Effects)
  useEffect(() => {
    tracks.forEach(track => {
      // For shared piano, we can't easily update per-track audio nodes anymore.
      // Volume will be handled by velocity in the trigger loop.
      // Pan is currently not supported per-key in this optimized mode.
      
      // For non-piano tracks (if any exist in future)
      if (track.type !== 'piano') {
          const channel = channels.current.get(track.id);
          const distortion = distortions.current.get(track.id);
          const filter = filters.current.get(track.id);

          if (channel) {
            channel.volume.rampTo(track.mute ? -Infinity : track.volume, 0.1);
            channel.pan.rampTo(track.pan, 0.1);
          }

          if (distortion) {
            distortion.distortion = track.settings.distortion;
          }

          if (filter) {
            filter.frequency.rampTo(track.settings.cutoff, 0.1);
            filter.Q.value = track.settings.resonance;
          }
      }
    });
  }, [tracks]);

  const tracksRef = useRef(tracks);
  const stepCountRef = useRef(stepCount);
  const stepCounterRef = useRef(0);

  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { stepCountRef.current = stepCount; }, [stepCount]);

  // Reset step counter when transport stops
  useEffect(() => {
    if (!isPlaying) {
      stepCounterRef.current = 0;
    }
  }, [isPlaying]);

  // Sequencer Loop - Counter-based for perfect timing
  useEffect(() => {
    // Reset counter on mount
    stepCounterRef.current = 0;

    const scheduleId = Tone.Transport.scheduleRepeat((time) => {
      const currentStepCount = stepCountRef.current;

      // Use counter instead of tick calculation to avoid rounding errors
      const step = stepCounterRef.current % currentStepCount;
      stepCounterRef.current++;

      // Update UI on main thread
      Tone.Draw.schedule(() => {
        setCurrentStep(step);
      }, time);

      const currentTracks = tracksRef.current;
      const anySolo = currentTracks.some(t => t.solo);

      // Schedule all instruments at exact same time
      const pianoNotes: string[] = [];
      const pianoVelocities: number[] = [];

      currentTracks.forEach(track => {
        const trackStep = track.steps[step] || false;
        const shouldPlay = trackStep && (anySolo ? track.solo : !track.mute);

        if (shouldPlay) {
          if (track.type === 'piano') {
               // Calculate velocity based on volume (-60 to 0 dB range mapped to 0-1)
               let velocity = Math.pow(10, track.volume / 20); 
               if (velocity > 1) velocity = 1;

               // Play every note (user requested "every note")
               const note = Tone.Frequency("C4").transpose(track.settings.pitch).toNote();
               pianoNotes.push(note);
               pianoVelocities.push(velocity);
          } else {
              // Legacy support for other instruments
              const inst = instruments.current.get(track.id);
              if (inst) {
                 // ... legacy trigger logic ...
              }
          }
        }
      });

      // Trigger for Piano (Loop for safety and per-note velocity support)
      if (pianoInstrument.current && pianoNotes.length > 0) {
          // Limit to max 64 simultaneous notes to prevent overload
          const limit = Math.min(pianoNotes.length, 64);
          
          for (let i = 0; i < limit; i++) {
             pianoInstrument.current.triggerAttackRelease(pianoNotes[i], '8n', time, pianoVelocities[i]);
          }
      }
    }, "16n");

    return () => {
      Tone.Transport.clear(scheduleId);
      stepCounterRef.current = 0;
    };
  }, []);

  const toggleStep = useCallback((trackId: string, stepIndex: number) => {
    const needsExpand = stepIndex >= stepCount - 2 && stepCount < MAX_STEPS;
    
    if (needsExpand) {
        const extension = Math.min(16, MAX_STEPS - stepCount);
        const newCount = stepCount + extension;
        setStepCount(newCount);
        
        setTracks(prev => prev.map(t => {
            // Expand existing steps
            const expandedSteps = [...t.steps, ...Array(extension).fill(false)];
            // If this is the target track, toggle the bit
            if (t.id === trackId) {
                const isCurrentlyActive = t.steps[stepIndex] || false;
                expandedSteps[stepIndex] = !isCurrentlyActive;
            }
            return { ...t, steps: expandedSteps };
        }));
    } else {
        // Standard toggle without expansion
        setTracks(prev => prev.map(t => 
          t.id === trackId 
            ? { ...t, steps: t.steps.map((s, i) => i === stepIndex ? !s : s) }
            : t
        ));
    }
  }, [stepCount]);

  const updateTrackVolume = useCallback((trackId: string, volume: number) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, volume } : t));
  }, []);

  const updateTrackPan = useCallback((trackId: string, pan: number) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, pan } : t));
  }, []);

  const updateTrackSetting = useCallback((trackId: string, setting: keyof TrackSettings, value: number) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId 
        ? { ...t, settings: { ...t.settings, [setting]: value } } 
        : t
    ));
  }, []);

  const toggleMute = useCallback((trackId: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, mute: !t.mute } : t));
  }, []);

  const toggleHidden = useCallback((trackId: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, hidden: !t.hidden } : t));
  }, []);

  const batchToggleHidden = useCallback((trackIds: string[], hidden: boolean) => {
    const idSet = new Set(trackIds);
    setTracks(prev => prev.map(t => idSet.has(t.id) ? { ...t, hidden } : t));
  }, []);

  const setAllHidden = useCallback((hidden: boolean) => {
    setTracks(prev => prev.map(t => ({ ...t, hidden })));
  }, []);

  const toggleSolo = useCallback((trackId: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, solo: !t.solo } : t));
  }, []);

  const addTrack = useCallback((type: InstrumentType, name?: string, pattern?: boolean[]) => {
    // Use randomUUID if available, otherwise fallback to timestamp + random
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newId = `${type}-${uuid}`;

    setTracks(prev => {
      // Generate default name based on existing tracks of same type
      const defaultName = `${type.charAt(0).toUpperCase() + type.slice(1)} ${prev.filter(t => t.type === type).length + 1}`;
      // Use provided name or default
      const trackName = name || defaultName;
      return [...prev, createTrack(newId, type, trackName, stepCount, pattern, undefined, false)];
    });
  }, [stepCount]);

  const removeTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
  }, []);
  
  const reorderTracks = useCallback((startIndex: number, endIndex: number) => {
      setTracks(prev => {
          const result = Array.from(prev);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return result;
      });
  }, []);

  const changeStepCount = useCallback((newCount: number) => {
    if (newCount < 4 || newCount > MAX_STEPS) return;
    setStepCount(newCount);
    setTracks(prev => prev.map(t => {
      const newSteps = [...t.steps];
      if (newCount > t.steps.length) {
        return { ...t, steps: [...newSteps, ...Array(newCount - t.steps.length).fill(false)] };
      } else {
        return { ...t, steps: newSteps.slice(0, newCount) };
      }
    }));
  }, []);

  const loadSession = useCallback((data: { tracks: Track[], bpm: number, stepCount: number }) => {
    if (data.tracks) setTracks(data.tracks);
    if (data.bpm) setBpm(data.bpm);
    if (data.stepCount) setStepCount(data.stepCount);
  }, []);

  const togglePlay = useCallback(async () => {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.position = 0; // Reset transport position
      stepCounterRef.current = 0; // Reset step counter
      setCurrentStep(0);
      setIsPlaying(false);
    } else {
      stepCounterRef.current = 0; // Reset counter on start
      Tone.Transport.position = 0; // Start from beginning
      Tone.Transport.start();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const clearGrid = useCallback(() => {
    setTracks(prev => prev.map(t => ({ ...t, steps: Array(stepCount).fill(false) })));
  }, [stepCount]);

  const randomizeGrid = useCallback(() => {
    setTracks(prev => prev.map(t => ({
      ...t,
      steps: t.steps.map(() => Math.random() > 0.7)
    })));
  }, []);

  const savePreset = useCallback((trackId: string, name: string) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId 
        ? { ...t, name: name, savedPreset: name }
        : t
    ));
  }, []);

  return {
    tracks,
    isPlaying,
    currentStep,
    stepCount,
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
    updateTrackPan,
    updateTrackSetting,
    addTrack,
    removeTrack,
    reorderTracks,
    changeStepCount,
    loadSession,
    masterVolume,
    setMasterVolume,
    reverbAmount,
    setReverbAmount,
    delayAmount,
    setDelayAmount,
    savePreset,
    toggleHidden,
    batchToggleHidden,
    setAllHidden
  };
}
