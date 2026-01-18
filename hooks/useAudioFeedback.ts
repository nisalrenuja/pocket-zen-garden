import { useRef, useCallback } from 'react';
import { useThrottledCallback } from './useThrottledCallback';

export const useAudioFeedback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Cache for loaded buffers
  const buffersRef = useRef<{ [key: string]: AudioBuffer }>({});

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const loadSound = useCallback(async (url: string, name: string) => {
    try {
      if (!audioContextRef.current) initAudio();
      if (buffersRef.current[name]) return;

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      if (audioContextRef.current) {
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        buffersRef.current[name] = audioBuffer;
      }
    } catch (error) {
      console.error(`Failed to load sound ${name}:`, error);
    }
  }, [initAudio]);

  const playSound = useCallback((name: string, volume = 0.5, pitch = 1.0) => {
    if (!audioContextRef.current || !buffersRef.current[name]) return;

    // Restart context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffersRef.current[name];
    
    const gainNode = audioContextRef.current.createGain();
    gainNode.gain.value = volume;

    source.playbackRate.value = pitch;

    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    source.start(0);
  }, []);

  // Preload sounds
  const preloadSounds = useCallback(() => {
    loadSound('/sounds/grab.wav', 'grab');
    loadSound('/sounds/magic.wav', 'magic');
    loadSound('/sounds/wind.wav', 'wind');
  }, [loadSound]);

  // Throttled play functions to avoid spamming
  const playGrab = useThrottledCallback(() => playSound('grab', 0.4, 1.2), 200);
  const playRelease = useThrottledCallback(() => playSound('grab', 0.3, 0.8), 200);
  const playMagic = useThrottledCallback(() => playSound('magic', 0.3, 1.0), 300);
  const playWind = useThrottledCallback(() => playSound('wind', 0.15, 1.0), 500);

  return {
    initAudio,
    preloadSounds,
    playGrab,
    playRelease,
    playMagic,
    playWind
  };
};
