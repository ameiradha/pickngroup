/**
 * Web Audio API Synth for high-fidelity interactive feedback
 * No external file downloads required, completely offline-safe and reliable!
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Standard and vendor prefixed names
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  
  // Try to resume if suspended (due to browser autoplay policies)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Ignore errors, will try again on next user gesture
    });
  }
  
  return audioCtx;
}

/**
 * Play a physical wooden tick or a metallic click
 */
export function playTickSound(type: 'tick' | 'synth' | 'woodblock' | 'none', volume: number = 0.5) {
  if (type === 'none' || volume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Double check state
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;
  
  // Master gain node
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume * 0.4, now);
  masterGain.connect(ctx.destination);

  if (type === 'tick') {
    // High-passed brief noise click + decay sine
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);
    
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.05);

  } else if (type === 'woodblock') {
    // Hollow physical thud
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.linearRampToValueAtTime(800, now + 0.06);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.linearRampToValueAtTime(1050, now + 0.06);
    
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(masterGain);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.07);
    osc2.stop(now + 0.07);

  } else if (type === 'synth') {
    // Retro bubbly pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);
    
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

/**
 * Play full triumph theme when someone wins
 */
export function playWinSound(type: 'fanfare' | 'chime' | 'laser' | 'none', volume: number = 0.5) {
  if (type === 'none' || volume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume * 0.35, now);
  masterGain.connect(ctx.destination);

  if (type === 'fanfare') {
    // Brass style triumphant chords: Major triads ascending
    // Chord 1: C4 (261.63), E4 (329.63), G4 (392.00)
    // Chord 2: F4 (349.23), A4 (440.00), C5 (523.25)
    // Chord 3: G4 (392.00), B4 (493.88), D5 (587.33)
    // Final sustained note: C5 (523.25) + E5 (659.25) + G5 (783.99)
    
    const playNote = (freq: number, start: number, duration: number, isFinal: boolean = false) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = isFinal ? 'triangle' : 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      
      if (isFinal) {
        gain.gain.setValueAtTime(0.3, start + duration - 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      } else {
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      }
      
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Arpeggio / Chords rhythm
    const steps = [
      { freqs: [261.63, 329.63, 392.00], time: 0.0, dur: 0.15 },
      { freqs: [349.23, 440.00, 523.25], time: 0.18, dur: 0.15 },
      { freqs: [392.00, 493.88, 587.33], time: 0.36, dur: 0.2 },
      { freqs: [523.25, 659.25, 783.99, 1046.50], time: 0.6, dur: 1.5, final: true }
    ];

    steps.forEach((step) => {
      step.freqs.forEach((f) => {
        playNote(f, now + step.time, step.dur, step.final);
      });
    });

  } else if (type === 'chime') {
    // Sparkling wind chimes / magic scale arpeggio
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
    
    scale.forEach((freq, idx) => {
      const delay = idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.25, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
      
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.45);
    });

  } else if (type === 'laser') {
    // Sci-fi sweep ups and downs
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.6);
    
    // Add simple low pass filter to make it less harsh
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    osc.start(now);
    osc.stop(now + 0.61);
  }
}
