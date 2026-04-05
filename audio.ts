
/**
 * "Soft & Organic" Audio Engine
 * Focused on warm, tactile, and non-intrusive UI sounds.
 * 
 * POLICY:
 * - Default: OFF (Muted)
 * - Typing: MUTED (Too noisy for calm UI)
 * - Small Clicks: MUTED (Use only for significant actions)
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let soundEnabled = false; // DEFAULT OFF

// --- API ---

export const setSoundEnabled = (enabled: boolean) => {
    soundEnabled = enabled;
    try {
        if (typeof window !== 'undefined') {
            localStorage.setItem('templr_sound_enabled', JSON.stringify(enabled));
        }
    } catch(e) {}
    
    // Resume context if enabling
    if (enabled && audioCtx?.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
};

export const getSoundEnabled = (): boolean => {
    try {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('templr_sound_enabled');
            if (saved !== null) {
                soundEnabled = JSON.parse(saved);
            }
        }
    } catch (e) {
        soundEnabled = false;
    }
    return soundEnabled;
};

// Initialize State immediately - WRAPPED IN TRY/CATCH for safety
try {
    getSoundEnabled();
} catch(e) {
    // Silent fail
}

const initAudio = () => {
  if (!soundEnabled) return;
  if (!audioCtx) {
    try {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtor) {
          audioCtx = new AudioCtor();
          
          // Master Channel
          masterGain = audioCtx.createGain();
          masterGain.gain.value = 0.3; // Lower global volume for subtlety
          
          // Soft Limiter to prevent harsh peaks
          const compressor = audioCtx.createDynamicsCompressor();
          compressor.threshold.value = -10;
          compressor.ratio.value = 4;
          masterGain.connect(compressor);
          compressor.connect(audioCtx.destination);
      }
    } catch (e) {
      // Audio not supported, silence is fine.
    }
  }
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
};

// --- Sound Functions ---

export const playClickSound = () => {
  if (!soundEnabled) return;
  // Intentionally muted for standard clicks to reduce noise as per "Calm UI" rules
  // We only init audio if we actually want to play something later
};

export const playLikeSound = () => {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;

  // "Warm Heartbeat" / "Double Pop"
  const playThud = (time: number, freq: number) => {
      try {
          const osc = audioCtx!.createOscillator();
          const gain = audioCtx!.createGain();
          osc.type = 'triangle'; // Richer tone
          osc.connect(gain);
          gain.connect(masterGain!);

          osc.frequency.setValueAtTime(freq, time);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.1);

          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.5, time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

          osc.start(time);
          osc.stop(time + 0.2);
      } catch(e) {}
  };

  playThud(t, 300);
  playThud(t + 0.1, 400); 
};

export const playSuccessSound = () => {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;

  // "Ethereal Chime"
  const chord = [440, 554.37, 659.25]; // A Major
  
  chord.forEach((freq, i) => {
      try {
          const osc = audioCtx!.createOscillator();
          const gain = audioCtx!.createGain();
          osc.type = 'sine';
          osc.connect(gain);
          gain.connect(masterGain!);

          const startTime = t + i * 0.05;

          osc.frequency.value = freq;
          
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5); 

          osc.start(startTime);
          osc.stop(startTime + 2);
      } catch(e) {}
  });
};

export const playNotificationSound = () => {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;

  // "Water Droplet"
  try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(masterGain);

      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.2);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.6, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

      osc.start(t);
      osc.stop(t + 0.3);
  } catch(e) {}
};

export const playOpenModalSound = () => {
    // Muted to keep UI calm
};

export const playCloseModalSound = () => {
    // Muted to keep UI calm
};

export const playTypingSound = () => {
    // STRICTLY MUTED per instructions
};
