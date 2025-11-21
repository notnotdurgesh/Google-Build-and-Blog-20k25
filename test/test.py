import asyncio
import os
import wave
import argparse
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

# Configuration
MODEL_ID = 'models/lyria-realtime-exp'
OUTPUT_FILE = 'lyria_session_output.wav'
API_VERSION = 'v1alpha'

# Ensure API Key is set
api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("ERROR: API Key not found in environment variables.")
    print("Please set it in PowerShell using:")
    print("   $env:GOOGLE_API_KEY='your_actual_api_key_here'")
    print("Or in Command Prompt:")
    print("   set GOOGLE_API_KEY=your_actual_api_key_here")
    exit(1)

class AudioRecorder:
    def __init__(self, filename):
        self.filename = filename
        self.audio_data = bytearray()
        self.chunk_count = 0

    def add_data(self, data):
        self.audio_data.extend(data)
        self.chunk_count += 1
        if self.chunk_count % 50 == 0:
            print(f"Received {self.chunk_count} chunks...")

    def save(self):
        print(f"Saving {len(self.audio_data)} bytes to {self.filename}...")
        try:
            with wave.open(self.filename, 'wb') as wf:
                wf.setnchannels(2)  # Stereo
                wf.setsampwidth(2)  # 16-bit PCM
                wf.setframerate(48000)  # 48kHz
                wf.writeframes(self.audio_data)
            print(f"Successfully saved audio to {self.filename}")
        except Exception as e:
            print(f"Error saving audio file: {e}")

async def receive_audio_loop(session, recorder, stop_event):
    """Background task to process incoming audio stream."""
    print("Starting audio reception loop...")
    try:
        async for message in session.receive():
            if stop_event.is_set():
                break
            
            if message.server_content and message.server_content.audio_chunks:
                for chunk in message.server_content.audio_chunks:
                    recorder.add_data(chunk.data)
            
    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"Error in receive loop: {e}")
    finally:
        print("Audio reception loop ended.")

async def run_music_generation(prompt_text, input_audio_path=None, duration=10):
    client = genai.Client(api_key=api_key, http_options={'api_version': API_VERSION})
    recorder = AudioRecorder(OUTPUT_FILE)
    stop_event = asyncio.Event()

    print(f"Connecting to {MODEL_ID}...")
    
    # Connect to the session
    async with (
        client.aio.live.music.connect(model=MODEL_ID) as session,
        asyncio.TaskGroup() as tg,
    ):
        # Start receiving audio in the background
        receiver_task = tg.create_task(receive_audio_loop(session, recorder, stop_event))

        try:
            # Set configuration
            await session.set_music_generation_config(
                config=types.LiveMusicGenerationConfig(
                    bpm=120,
                    temperature=1.0,
                    music_generation_mode=types.MusicGenerationMode.QUALITY
                )
            )

            # Handle Audio Input (Context) if provided
            if input_audio_path:
                if os.path.exists(input_audio_path):
                    print(f"Loading audio context from {input_audio_path}...")
                    try:
                        with open(input_audio_path, 'rb') as f:
                            audio_data = f.read()
                        
                        print(f"Sending {len(audio_data)} bytes of audio context...")
                        # Send audio input to establish context/remix source
                        # Using generic send method for input
                        await session.send(input={'data': audio_data, 'mime_type': 'audio/wav'})
                        print("Audio context sent.")
                    except Exception as e:
                        print(f"Error sending audio context: {e}")
                else:
                    print(f"Warning: Input audio file {input_audio_path} not found. Proceeding with text only.")

            # Set Prompts
            print(f"Setting prompt: '{prompt_text}'")
            await session.set_weighted_prompts(
                prompts=[
                    types.WeightedPrompt(text=prompt_text, weight=1.0),
                ]
            )

            # Start playing
            print("Sending Play command...")
            await session.play()
            
            # Let it generate
            print(f"Generating for {duration} seconds...")
            await asyncio.sleep(duration)

        except Exception as e:
            print(f"An error occurred during the session: {e}")
        
        finally:
            # Clean shutdown
            print("\nStopping session...")
            stop_event.set()
            receiver_task.cancel()
            try:
                await receiver_task
            except asyncio.CancelledError:
                pass
            
            recorder.save()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Lyria RealTime Music Generation")
    parser.add_argument("--text", type=str, default="mexican funk with tacky music", help="Text prompt for music generation")
    parser.add_argument("--audio", type=str, help="Path to input audio file for context (optional)")
    parser.add_argument("--duration", type=int, default=10, help="Duration of generation in seconds")
    
    args = parser.parse_args()
    
    print("Starting Lyria RealTime Session...")
    asyncio.run(run_music_generation(args.text, args.audio, args.duration))
    print("Session Complete.")
