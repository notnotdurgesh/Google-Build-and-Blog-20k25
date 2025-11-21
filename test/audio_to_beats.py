"""
Audio to Beats Conversion Module

This module integrates machine learning models (Basic Pitch, Pop2Piano) and
advanced audio analysis (librosa) to transform audio into sheet music and
beat patterns for use in music production applications.

Features:
- Spotify's Basic Pitch for accurate pitch detection
- Pop2Piano for piano transcription (optional)
- Librosa-based CQT analysis with harmonic enhancement
- Configurable parameters via command-line or API
- Robust error handling and logging
"""

import argparse
import json
import logging
import math
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import warnings

import librosa
import librosa.decompose
import numpy as np
from scipy.signal import find_peaks

# Optional ML model imports
try:
    from basic_pitch.inference import predict
    from basic_pitch import ICASSP_2022_MODEL_PATH
    BASIC_PITCH_AVAILABLE = True
except ImportError:
    BASIC_PITCH_AVAILABLE = False
    warnings.warn("Basic Pitch not installed. Install with: pip install basic-pitch")

try:
    from transformers import Pop2PianoForConditionalGeneration, Pop2PianoProcessor
    import torch
    POP2PIANO_AVAILABLE = True
except ImportError:
    POP2PIANO_AVAILABLE = False
    warnings.warn("Pop2Piano not available. Install with: pip install transformers torch")


# Configuration Constants
DEFAULT_AUDIO_FILE = 'Dancing in My Room.mp3'
DEFAULT_OUTPUT_FILE = 'beats.json'
DEFAULT_BPM_OVERRIDE = None
DEFAULT_MAX_STEPS = 256
DEFAULT_THRESHOLD_DB = 40
DEFAULT_MIN_NOTE_DURATION = 0.1  # seconds

# Full 88 Piano Keys (C8 down to A0)
PIANO_NOTES = [
    "C8", "B7", "A#7", "A7", "G#7", "G7", "F#7", "F7", "E7", "D#7", "D7", "C#7",
    "C7", "B6", "A#6", "A6", "G#6", "G6", "F#6", "F6", "E6", "D#6", "D6", "C#6",
    "C6", "B5", "A#5", "A5", "G#5", "G5", "F#5", "F5", "E5", "D#5", "D5", "C#5",
    "C5", "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4",
    "C4", "B3", "A#3", "A3", "G#3", "G3", "F#3", "F3", "E3", "D#3", "D3", "C#3",
    "C3", "B2", "A#2", "A2", "G#2", "G2", "F#2", "F2", "E2", "D#2", "D2", "C#2",
    "C2", "B1", "A#1", "A1", "G#1", "G1", "F#1", "F1", "E1", "D#1", "D1", "C#1",
    "C1", "B0", "A#0", "A0"
]

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class NumpyEncoder(json.JSONEncoder):
    """Custom JSON encoder for NumPy types"""
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.bool_):
            return bool(obj)
        return super(NumpyEncoder, self).default(obj)


class AudioAnalysisConfig:
    """Configuration for audio analysis parameters"""
    def __init__(
        self,
        method: str = 'librosa',
        bpm_override: Optional[float] = None,
        max_steps: int = DEFAULT_MAX_STEPS,
        threshold_db: float = DEFAULT_THRESHOLD_DB,
        min_note_duration: float = DEFAULT_MIN_NOTE_DURATION,
        use_harmonic_enhancement: bool = True,
        hop_length: int = 512
    ):
        self.method = method
        self.bpm_override = bpm_override
        self.max_steps = max_steps
        self.threshold_db = threshold_db
        self.min_note_duration = min_note_duration
        self.use_harmonic_enhancement = use_harmonic_enhancement
        self.hop_length = hop_length

    def validate(self):
        """Validate configuration parameters"""
        if self.method not in ['librosa', 'basic_pitch', 'pop2piano']:
            raise ValueError(f"Invalid method: {self.method}")

        if self.method == 'basic_pitch' and not BASIC_PITCH_AVAILABLE:
            raise RuntimeError("Basic Pitch is not installed")

        if self.method == 'pop2piano' and not POP2PIANO_AVAILABLE:
            raise RuntimeError("Pop2Piano is not installed")

        if self.max_steps < 16 or self.max_steps > 1024:
            raise ValueError("max_steps must be between 16 and 1024")

        if self.threshold_db < 10 or self.threshold_db > 80:
            raise ValueError("threshold_db must be between 10 and 80")


class AudioToBeatsConverter:
    """Main converter class that handles audio to beat pattern conversion"""

    def __init__(self, config: AudioAnalysisConfig):
        self.config = config
        self.config.validate()

    def load_audio(self, file_path: str) -> Tuple[np.ndarray, int]:
        """
        Load audio file and return waveform and sample rate

        Args:
            file_path: Path to audio file

        Returns:
            Tuple of (audio_waveform, sample_rate)
        """
        logger.info(f"Loading audio from: {file_path}")

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        try:
            y, sr = librosa.load(file_path, sr=None)
            duration = librosa.get_duration(y=y, sr=sr)
            logger.info(f"Audio loaded: {duration:.2f}s at {sr}Hz")
            return y, sr
        except Exception as e:
            logger.error(f"Failed to load audio: {e}")
            raise

    def detect_tempo(self, y: np.ndarray, sr: int) -> float:
        """
        Detect tempo from audio signal

        Args:
            y: Audio waveform
            sr: Sample rate

        Returns:
            Detected tempo in BPM
        """
        if self.config.bpm_override:
            logger.info(f"Using override BPM: {self.config.bpm_override}")
            return self.config.bpm_override

        logger.info("Analyzing tempo...")
        try:
            onset_env = librosa.onset.onset_strength(y=y, sr=sr)
            tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)

            if isinstance(tempo, np.ndarray):
                tempo = tempo.item()

            logger.info(f"Detected tempo: {tempo:.2f} BPM")
            return float(tempo)
        except Exception as e:
            logger.warning(f"Tempo detection failed: {e}. Using default 120 BPM")
            return 120.0

    def analyze_with_basic_pitch(
        self,
        file_path: str,
        tempo: float
    ) -> Dict[str, Any]:
        """
        Analyze audio using Spotify's Basic Pitch model

        Args:
            file_path: Path to audio file
            tempo: Tempo in BPM

        Returns:
            Dictionary containing note activations
        """
        logger.info("Using Basic Pitch for pitch detection...")

        try:
            # Run Basic Pitch inference
            model_output, midi_data, note_events = predict(
                file_path,
                ICASSP_2022_MODEL_PATH,
                onset_threshold=0.5,
                frame_threshold=0.3,
                minimum_note_length=self.config.min_note_duration * 1000,  # Convert to ms
                minimum_frequency=None,
                maximum_frequency=None,
                multiple_pitch_bends=False,
                melodia_trick=True,
                debug_file=None
            )

            logger.info(f"Basic Pitch detected {len(note_events)} notes")

            # Convert note events to our format
            seconds_per_beat = 60.0 / tempo
            step_duration = seconds_per_beat / 4.0

            y, sr = self.load_audio(file_path)
            total_duration = librosa.get_duration(y=y, sr=sr)
            total_steps = int(math.ceil(total_duration / step_duration))
            target_steps = min(self.config.max_steps, ((total_steps + 15) // 16) * 16)

            active_notes_data = {}

            for start_time, end_time, pitch_midi, amplitude, _ in note_events:
                note_name = librosa.midi_to_note(int(pitch_midi))

                # Calculate which steps this note occupies
                start_step = int(start_time / step_duration)
                end_step = int(end_time / step_duration)

                if note_name not in active_notes_data:
                    active_notes_data[note_name] = {"steps": set(), "magnitudes": []}

                for step in range(start_step, min(end_step + 1, target_steps)):
                    active_notes_data[note_name]["steps"].add(step)
                    active_notes_data[note_name]["magnitudes"].append(amplitude)

            return {
                "tempo": tempo,
                "target_steps": target_steps,
                "active_notes_data": active_notes_data,
                "step_duration": step_duration
            }

        except Exception as e:
            logger.error(f"Basic Pitch analysis failed: {e}")
            raise

    def analyze_with_pop2piano(
        self,
        file_path: str,
        tempo: float
    ) -> Dict[str, Any]:
        """
        Analyze audio using Pop2Piano model

        Args:
            file_path: Path to audio file
            tempo: Tempo in BPM

        Returns:
            Dictionary containing note activations
        """
        logger.info("Using Pop2Piano for transcription...")

        try:
            # Load Pop2Piano model
            model = Pop2PianoForConditionalGeneration.from_pretrained("sweetcocoa/pop2piano")
            processor = Pop2PianoProcessor.from_pretrained("sweetcocoa/pop2piano")

            # Load and process audio
            y, sr = self.load_audio(file_path)

            # Pop2Piano expects 16kHz audio
            if sr != 16000:
                y = librosa.resample(y, orig_sr=sr, target_sr=16000)
                sr = 16000

            # Process audio
            inputs = processor(audio=y, sampling_rate=sr, return_tensors="pt")

            # Generate MIDI tokens
            model_output = model.generate(
                input_features=inputs["input_features"],
                composer="composer1",  # You can customize this
            )

            # Decode to MIDI
            tokenizer_output = processor.batch_decode(
                token_ids=model_output,
                feature_extractor_output=inputs
            )

            # Convert MIDI to our format
            seconds_per_beat = 60.0 / tempo
            step_duration = seconds_per_beat / 4.0

            total_duration = librosa.get_duration(y=y, sr=sr)
            total_steps = int(math.ceil(total_duration / step_duration))
            target_steps = min(self.config.max_steps, ((total_steps + 15) // 16) * 16)

            active_notes_data = {}

            # Process MIDI output
            for midi_output in tokenizer_output:
                for note in midi_output.instruments[0].notes:
                    note_name = librosa.midi_to_note(note.pitch)

                    start_step = int(note.start / step_duration)
                    end_step = int(note.end / step_duration)

                    if note_name not in active_notes_data:
                        active_notes_data[note_name] = {"steps": set(), "magnitudes": []}

                    for step in range(start_step, min(end_step + 1, target_steps)):
                        active_notes_data[note_name]["steps"].add(step)
                        active_notes_data[note_name]["magnitudes"].append(note.velocity / 127.0)

            logger.info(f"Pop2Piano detected notes in {len(active_notes_data)} pitches")

            return {
                "tempo": tempo,
                "target_steps": target_steps,
                "active_notes_data": active_notes_data,
                "step_duration": step_duration
            }

        except Exception as e:
            logger.error(f"Pop2Piano analysis failed: {e}")
            raise

    def analyze_with_librosa(
        self,
        y: np.ndarray,
        sr: int,
        tempo: float
    ) -> Dict[str, Any]:
        """
        Analyze audio using librosa CQT and harmonic enhancement

        Args:
            y: Audio waveform
            sr: Sample rate
            tempo: Tempo in BPM

        Returns:
            Dictionary containing note activations
        """
        logger.info("Using Librosa CQT + NN Filter for analysis...")

        # Calculate step parameters
        seconds_per_beat = 60.0 / tempo
        step_duration = seconds_per_beat / 4.0

        total_duration = librosa.get_duration(y=y, sr=sr)
        total_steps = int(math.ceil(total_duration / step_duration))
        target_steps = min(self.config.max_steps, ((total_steps + 15) // 16) * 16)

        logger.info(f"Processing {total_steps} steps (quantized to {target_steps})")

        # Constant-Q Transform (Piano Range: A0 to C8, 88 keys)
        logger.info("Computing CQT...")
        C = np.abs(librosa.cqt(
            y,
            sr=sr,
            fmin=librosa.note_to_hz('A0'),
            n_bins=88,
            bins_per_octave=12,
            hop_length=self.config.hop_length
        ))

        # Harmonic Enhancement using NN Filter
        if self.config.use_harmonic_enhancement:
            logger.info("Applying harmonic enhancement (NN Filter)...")
            C_harm = librosa.decompose.nn_filter(
                C,
                aggregate=np.median,
                metric='cosine'
            )
        else:
            C_harm = C

        # Convert to dB scale
        C_db = librosa.amplitude_to_db(C_harm, ref=np.max)
        max_db = np.max(C_db)
        threshold_db = max_db - self.config.threshold_db

        logger.info(f"Using threshold: {threshold_db:.2f} dB")

        # Map frames to steps
        frames_per_sec = sr / self.config.hop_length
        frames_per_step = step_duration * frames_per_sec

        active_notes_data = {}

        logger.info("Extracting note activations...")
        for step in range(target_steps):
            start_frame = int(step * frames_per_step)
            end_frame = int((step + 1) * frames_per_step)

            if start_frame >= C_db.shape[1]:
                break

            # Extract spectrum for this step (max pooling)
            if start_frame == end_frame:
                step_spectrum = C_db[:, start_frame]
            else:
                end_frame = min(end_frame, C_db.shape[1])
                step_spectrum = np.max(C_db[:, start_frame:end_frame], axis=1)

            # Find peaks (active notes)
            peaks, properties = find_peaks(
                step_spectrum,
                height=threshold_db,
                distance=1
            )

            for bin_idx in peaks:
                freq = librosa.cqt_frequencies(
                    n_bins=88,
                    fmin=librosa.note_to_hz('A0'),
                    bins_per_octave=12
                )[bin_idx]
                note = librosa.hz_to_note(freq)
                mag = step_spectrum[bin_idx]

                if note not in active_notes_data:
                    active_notes_data[note] = {"steps": set(), "magnitudes": []}

                active_notes_data[note]["steps"].add(step)
                active_notes_data[note]["magnitudes"].append(mag)

        logger.info(f"Detected notes in {len(active_notes_data)} pitches")

        return {
            "tempo": tempo,
            "target_steps": target_steps,
            "active_notes_data": active_notes_data,
            "step_duration": step_duration,
            "threshold_db": threshold_db
        }

    def build_track_data(
        self,
        analysis_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Build final track data structure from analysis results

        Args:
            analysis_result: Dictionary from analysis methods

        Returns:
            Complete track data structure ready for JSON export
        """
        logger.info("Building track data structure...")

        tempo = analysis_result["tempo"]
        target_steps = analysis_result["target_steps"]
        active_notes_data = analysis_result["active_notes_data"]
        threshold_db = analysis_result.get("threshold_db", -self.config.threshold_db)

        final_tracks = []
        base_c4_midi = librosa.note_to_midi('C4')

        for note in PIANO_NOTES:
            detected_data = active_notes_data.get(note)

            pattern = [False] * target_steps
            track_vol = -5
            is_visible = False

            if detected_data:
                # Fill pattern
                for s in detected_data["steps"]:
                    if s < target_steps:
                        pattern[s] = True

                # Calculate dynamic volume based on magnitude
                avg_mag = np.mean(detected_data["magnitudes"])

                if isinstance(threshold_db, (int, float)) and threshold_db < 0:
                    # dB-based normalization
                    norm_vol = (avg_mag - threshold_db) / self.config.threshold_db
                    track_vol = round(-30 + (norm_vol * 30), 1)
                else:
                    # Amplitude-based normalization
                    track_vol = round(-30 + (avg_mag * 30), 1)

                track_vol = max(-40, min(0, track_vol))
                is_visible = True

            try:
                midi_val = librosa.note_to_midi(note)
                semitones = int(midi_val - base_c4_midi)
            except:
                semitones = 0

            track = {
                "id": f"piano-{note}",
                "name": note,
                "type": "piano",
                "steps": pattern,
                "mute": False,
                "solo": False,
                "volume": track_vol,
                "pan": 0,
                "settings": {
                    "pitch": semitones,
                    "decay": 0.5,
                    "attack": 0.01,
                    "distortion": 0,
                    "sustain": 0.3,
                    "release": 0.8,
                    "cutoff": 20000,
                    "resonance": 1
                },
                "hidden": not is_visible
            }
            final_tracks.append(track)

        # Fallback: if no notes detected, show middle range
        if all(t['hidden'] for t in final_tracks):
            logger.warning("No notes detected. Defaulting to C3-C5 visibility.")
            for t in final_tracks:
                try:
                    m = librosa.note_to_midi(t['name'])
                    if 48 <= m <= 72:  # C3 to C5
                        t['hidden'] = False
                except:
                    pass

        visible_tracks = sum(1 for t in final_tracks if not t['hidden'])
        logger.info(f"Built {len(final_tracks)} tracks ({visible_tracks} visible)")

        result = {
            "bpm": round(tempo),
            "stepCount": target_steps,
            "tracks": final_tracks
        }

        return result

    def convert(self, file_path: str) -> Dict[str, Any]:
        """
        Main conversion method

        Args:
            file_path: Path to audio file

        Returns:
            Complete track data structure
        """
        logger.info(f"Starting conversion using method: {self.config.method}")

        # Load audio and detect tempo
        y, sr = self.load_audio(file_path)
        tempo = self.detect_tempo(y, sr)

        # Choose analysis method
        if self.config.method == 'basic_pitch':
            analysis_result = self.analyze_with_basic_pitch(file_path, tempo)
        elif self.config.method == 'pop2piano':
            analysis_result = self.analyze_with_pop2piano(file_path, tempo)
        else:  # librosa
            analysis_result = self.analyze_with_librosa(y, sr, tempo)

        # Build final track structure
        result = self.build_track_data(analysis_result)

        logger.info("Conversion completed successfully!")
        return result


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description='Convert audio files to beat patterns using ML models and audio analysis',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage with default settings
  python audio_to_beats.py input.mp3

  # Use Basic Pitch for better accuracy
  python audio_to_beats.py input.mp3 --method basic_pitch

  # Use Pop2Piano for piano-focused transcription
  python audio_to_beats.py input.mp3 --method pop2piano

  # Override tempo and set custom output
  python audio_to_beats.py input.mp3 --bpm 128 --output custom_beats.json

  # Adjust sensitivity for softer notes
  python audio_to_beats.py input.mp3 --threshold 30 --max-steps 512
        """
    )

    parser.add_argument(
        'input_file',
        nargs='?',
        default=DEFAULT_AUDIO_FILE,
        help=f'Input audio file (default: {DEFAULT_AUDIO_FILE})'
    )

    parser.add_argument(
        '-o', '--output',
        default=DEFAULT_OUTPUT_FILE,
        help=f'Output JSON file (default: {DEFAULT_OUTPUT_FILE})'
    )

    parser.add_argument(
        '-m', '--method',
        choices=['librosa', 'basic_pitch', 'pop2piano'],
        default='librosa',
        help='Analysis method (default: librosa)'
    )

    parser.add_argument(
        '--bpm',
        type=float,
        help='Override tempo detection with specific BPM'
    )

    parser.add_argument(
        '--max-steps',
        type=int,
        default=DEFAULT_MAX_STEPS,
        help=f'Maximum number of steps (default: {DEFAULT_MAX_STEPS})'
    )

    parser.add_argument(
        '--threshold',
        type=float,
        default=DEFAULT_THRESHOLD_DB,
        help=f'Detection threshold in dB (default: {DEFAULT_THRESHOLD_DB})'
    )

    parser.add_argument(
        '--min-note-duration',
        type=float,
        default=DEFAULT_MIN_NOTE_DURATION,
        help=f'Minimum note duration in seconds (default: {DEFAULT_MIN_NOTE_DURATION})'
    )

    parser.add_argument(
        '--no-harmonic-enhancement',
        action='store_true',
        help='Disable harmonic enhancement (NN filter)'
    )

    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )

    args = parser.parse_args()

    # Configure logging
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    # Check input file
    if not os.path.exists(args.input_file):
        logger.error(f"Input file not found: {args.input_file}")
        sys.exit(1)

    # Create configuration
    try:
        config = AudioAnalysisConfig(
            method=args.method,
            bpm_override=args.bpm,
            max_steps=args.max_steps,
            threshold_db=args.threshold,
            min_note_duration=args.min_note_duration,
            use_harmonic_enhancement=not args.no_harmonic_enhancement
        )
    except (ValueError, RuntimeError) as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)

    # Run conversion
    try:
        converter = AudioToBeatsConverter(config)
        result = converter.convert(args.input_file)

        # Save output
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, cls=NumpyEncoder)

        logger.info(f"Successfully generated {output_path}")
        logger.info(f"  - BPM: {result['bpm']}")
        logger.info(f"  - Steps: {result['stepCount']}")
        logger.info(f"  - Tracks: {len(result['tracks'])}")
        logger.info(f"  - Visible tracks: {sum(1 for t in result['tracks'] if not t['hidden'])}")

    except Exception as e:
        logger.error(f"Conversion failed: {e}", exc_info=args.verbose)
        sys.exit(1)


if __name__ == "__main__":
    main()
