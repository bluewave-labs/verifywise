#!/usr/bin/env node
/**
 * Local TTS Narration Generator for VerifyWise Demo Video
 *
 * This script generates narration audio using local TTS models.
 *
 * SETUP OPTIONS:
 *
 * Option 1: Coqui TTS (Recommended - High Quality)
 * ------------------------------------------------
 * pip install TTS
 * # Test with: tts --list_models
 * # Use: tts --model_name tts_models/en/ljspeech/tacotron2-DDC --text "Hello" --out_path test.wav
 *
 * Option 2: Piper TTS (Fast, Lightweight)
 * ---------------------------------------
 * # Install from: https://github.com/rhasspy/piper
 * # Download voices from: https://huggingface.co/rhasspy/piper-voices
 * # Use: echo "Hello" | piper --model en_US-lessac-medium --output_file test.wav
 *
 * Option 3: OpenAI-compatible local server (LocalAI, Ollama with TTS)
 * -------------------------------------------------------------------
 * # LocalAI: https://localai.io/
 * # Run: local-ai run --models-path ./models
 * # API endpoint: http://localhost:8080/v1/audio/speech
 *
 * Option 4: macOS say command (Basic, built-in)
 * ---------------------------------------------
 * # Use: say -o output.aiff "Hello world" && ffmpeg -i output.aiff output.mp3
 *
 * Option 5: Bark (Neural, very high quality but slow)
 * ---------------------------------------------------
 * # pip install git+https://github.com/suno-ai/bark.git
 * # Use the bark Python API
 */

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Video narration script with timestamps (in seconds)
// Video timing: INTRO(3s) + PROBLEM(4s) + SOLUTION(4s) + 5 x (Title 3s + Demo 9s) + VALUE_PROP(4s) + OUTRO(4s) = 79s
const narrationScript = [
  {
    startTime: 0,
    duration: 3,
    text: "VerifyWise. AI Governance Made Simple.",
  },
  {
    startTime: 3,
    duration: 5,
    text: "Shadow AI. Compliance gaps. Security risks. AI governance is critical.",
  },
  {
    startTime: 8,
    duration: 4,
    text: "VerifyWise is the solution. One platform for complete AI governance.",
  },
  // Use Case 1: Title at 12s, Demo at 15s
  {
    startTime: 12,
    duration: 3,
    text: "Register and Track AI Models.",
  },
  {
    startTime: 15,
    duration: 8,
    text: "Maintain a complete inventory of all AI models. Track versions, deployments, and compliance in one location.",
  },
  // Use Case 2: Title at 23s, Demo at 26s
  {
    startTime: 23,
    duration: 3,
    text: "Detect Shadow AI.",
  },
  {
    startTime: 26,
    duration: 8,
    text: "Scan repositories to find untracked AI libraries. Get visibility into shadow AI before it becomes a risk.",
  },
  // Use Case 3: Title at 34s, Demo at 37s
  {
    startTime: 34,
    duration: 3,
    text: "EU AI Act Compliance.",
  },
  {
    startTime: 37,
    duration: 8,
    text: "Track progress against regulatory requirements. Built-in frameworks for EU AI Act and ISO standards.",
  },
  // Use Case 4: Title at 45s, Demo at 48s
  {
    startTime: 45,
    duration: 3,
    text: "Evaluate LLM Safety.",
  },
  {
    startTime: 48,
    duration: 8,
    text: "Run safety evaluations on your models. Test for toxicity, bias, and prompt injection vulnerabilities.",
  },
  // Use Case 5: Title at 56s, Demo at 59s
  {
    startTime: 56,
    duration: 3,
    text: "Assess and Mitigate Risks.",
  },
  {
    startTime: 59,
    duration: 8,
    text: "Identify, track, and resolve AI-related risks. Assign owners and monitor mitigation progress.",
  },
  // VALUE_PROP at 67s, OUTRO at 71s
  {
    startTime: 67,
    duration: 4,
    text: "Faster compliance. Full audit coverage. Complete visibility.",
  },
  {
    startTime: 71,
    duration: 4,
    text: "Start your AI governance journey at verifywise.ai",
  },
];

// TTS Configuration
const TTS_ENGINE = process.env.TTS_ENGINE || 'piper'; // Options: 'coqui', 'piper', 'localai', 'macos'
const OUTPUT_DIR = path.join(__dirname, '..', 'public');

// Local Piper paths (using pip-installed piper-tts)
const PIPER_BINARY = 'piper'; // Uses system piper from pip install piper-tts
const PIPER_MODEL = path.join(__dirname, '..', 'tools', 'voices', 'en_US-lessac-medium.onnx');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// TTS Engine functions using execFileSync for safety
const ttsEngines = {
  // macOS built-in TTS (basic quality)
  macos: (text, outputPath) => {
    const tempAiff = outputPath.replace('.mp3', '.aiff');
    // Use execFileSync with separate arguments to prevent injection
    execFileSync('say', ['-v', 'Samantha', '-o', tempAiff, text]);
    execFileSync('ffmpeg', ['-y', '-i', tempAiff, '-acodec', 'libmp3lame', '-ab', '192k', outputPath]);
    fs.unlinkSync(tempAiff);
  },

  // Coqui TTS (high quality)
  coqui: (text, outputPath) => {
    const tempWav = outputPath.replace('.mp3', '.wav');
    execFileSync('tts', [
      '--model_name', 'tts_models/en/ljspeech/tacotron2-DDC',
      '--text', text,
      '--out_path', tempWav
    ]);
    execFileSync('ffmpeg', ['-y', '-i', tempWav, '-acodec', 'libmp3lame', '-ab', '192k', outputPath]);
    fs.unlinkSync(tempWav);
  },

  // Piper TTS (fast, good quality) - using local binary
  piper: (text, outputPath) => {
    const tempWav = outputPath.replace('.mp3', '.wav');
    // Use spawnSync with stdin for piping text
    const result = spawnSync(PIPER_BINARY, [
      '--model', PIPER_MODEL,
      '--output_file', tempWav
    ], {
      input: text,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`Piper exited with code ${result.status}: ${result.stderr?.toString() || 'Unknown error'}`);
    }
    execFileSync('ffmpeg', ['-y', '-i', tempWav, '-acodec', 'libmp3lame', '-ab', '192k', outputPath]);
    fs.unlinkSync(tempWav);
  },

  // LocalAI API (OpenAI-compatible)
  localai: async (text, outputPath) => {
    const response = await fetch('http://localhost:8080/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy',
      }),
    });
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
  },
};

// Generate individual audio segments
async function generateSegments() {
  console.log(`Using TTS engine: ${TTS_ENGINE}`);
  console.log('Generating narration segments...\n');

  const segmentFiles = [];

  for (let i = 0; i < narrationScript.length; i++) {
    const segment = narrationScript[i];
    const filename = `segment_${String(i).padStart(2, '0')}.mp3`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    console.log(`[${i + 1}/${narrationScript.length}] Generating: "${segment.text.substring(0, 50)}..."`);

    try {
      if (TTS_ENGINE === 'localai') {
        await ttsEngines[TTS_ENGINE](segment.text, outputPath);
      } else {
        ttsEngines[TTS_ENGINE](segment.text, outputPath);
      }
      segmentFiles.push({ ...segment, file: filename, path: outputPath });
      console.log(`  ✓ Saved to ${filename}`);
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
    }
  }

  return segmentFiles;
}

// Create ffmpeg concat file and merge segments
function mergeSegments(segments) {
  console.log('\nMerging segments with timing...');

  const totalDuration = 75; // Total video duration in seconds (adjusted for narration)
  const concatListPath = path.join(OUTPUT_DIR, 'concat_list.txt');
  const outputPath = path.join(OUTPUT_DIR, 'narration.mp3');

  // Build concat list with silence files
  let concatContent = '';
  let silenceIndex = 0;

  segments.forEach((seg, i) => {
    // Calculate silence needed before this segment
    const prevEndTime = i === 0 ? 0 : segments[i - 1].startTime + segments[i - 1].duration;
    const silenceDuration = seg.startTime - prevEndTime;

    if (silenceDuration > 0) {
      // Generate silence file
      const silencePath = path.join(OUTPUT_DIR, `silence_${silenceIndex}.mp3`);
      execFileSync('ffmpeg', [
        '-y', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`,
        '-t', String(silenceDuration),
        '-acodec', 'libmp3lame', '-ab', '192k',
        silencePath
      ]);
      concatContent += `file '${silencePath}'\n`;
      silenceIndex++;
    }

    concatContent += `file '${seg.path}'\n`;
  });

  // Add trailing silence
  const lastSegment = segments[segments.length - 1];
  const trailingSilence = totalDuration - (lastSegment.startTime + lastSegment.duration);
  if (trailingSilence > 0) {
    const silencePath = path.join(OUTPUT_DIR, `silence_${silenceIndex}.mp3`);
    execFileSync('ffmpeg', [
      '-y', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`,
      '-t', String(trailingSilence),
      '-acodec', 'libmp3lame', '-ab', '192k',
      silencePath
    ]);
    concatContent += `file '${silencePath}'\n`;
  }

  // Write concat list
  fs.writeFileSync(concatListPath, concatContent);

  // Merge using ffmpeg concat demuxer
  try {
    execFileSync('ffmpeg', [
      '-y', '-f', 'concat', '-safe', '0',
      '-i', concatListPath,
      '-acodec', 'libmp3lame', '-ab', '192k',
      outputPath
    ]);

    console.log(`\n✓ Final narration saved to: ${outputPath}`);
    console.log('\nTo use in video, uncomment this line in DemoVideo.jsx:');
    console.log('  <Audio src={staticFile("narration.mp3")} />');

    // Cleanup temp files
    fs.unlinkSync(concatListPath);
    for (let i = 0; i < silenceIndex + 1; i++) {
      const silencePath = path.join(OUTPUT_DIR, `silence_${i}.mp3`);
      if (fs.existsSync(silencePath)) fs.unlinkSync(silencePath);
    }
  } catch (error) {
    console.error('Error merging segments:', error.message);
    console.log('\nAlternatively, you can manually combine segments in an audio editor.');
  }
}

// Main execution
async function main() {
  console.log('='.repeat(60));
  console.log('VerifyWise Demo Video - Narration Generator');
  console.log('='.repeat(60));
  console.log('\nNarration script:');
  narrationScript.forEach((seg, i) => {
    console.log(`  ${i + 1}. [${seg.startTime}s-${seg.startTime + seg.duration}s] ${seg.text.substring(0, 40)}...`);
  });
  console.log('\n');

  try {
    const segments = await generateSegments();
    if (segments.length > 0) {
      mergeSegments(segments);
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure you have the required TTS engine installed.');
    console.log('See the top of this file for installation instructions.');
  }
}

main();
