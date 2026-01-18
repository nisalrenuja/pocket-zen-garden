import { useRef, useCallback } from 'react';
import { useThrottledCallback } from './useThrottledCallback';

type SoundName = 'grab' | 'magic' | 'wind';

const SOUNDS: Record<SoundName, string> = {
  grab: '/sounds/grab.wav',
  magic: '/sounds/magic.wav',
  wind: '/sounds/wind.wav',
};

const THROTTLE_MS = { grab: 200, magic: 300, wind: 500 };

export function useAudioFeedback() {
  const contextRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Partial<Record<SoundName, AudioBuffer>>>({});

  const getContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    if (contextRef.current.state === 'suspended') {
      contextRef.current.resume();
    }
    return contextRef.current;
  }, []);

  const loadSound = useCallback(async (name: SoundName) => {
    if (buffersRef.current[name]) return;
    try {
      const ctx = getContext();
      const response = await fetch(SOUNDS[name]);
      const arrayBuffer = await response.arrayBuffer();
      buffersRef.current[name] = await ctx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.error(`Failed to load ${name}:`, e);
    }
  }, [getContext]);

  const play = useCallback((name: SoundName, volume: number, pitch: number) => {
    const ctx = contextRef.current;
    const buffer = buffersRef.current[name];
    if (!ctx || !buffer) return;

    if (ctx.state === 'suspended') ctx.resume();

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.playbackRate.value = pitch;
    gain.gain.value = volume;
    source.connect(gain).connect(ctx.destination);
    source.start();
  }, []);

  const preloadSounds = useCallback(() => {
    Object.keys(SOUNDS).forEach(name => loadSound(name as SoundName));
  }, [loadSound]);

  const initAudio = useCallback(() => getContext(), [getContext]);

  const playGrab = useThrottledCallback(() => play('grab', 0.4, 1.2), THROTTLE_MS.grab);
  const playRelease = useThrottledCallback(() => play('grab', 0.3, 0.8), THROTTLE_MS.grab);
  const playMagic = useThrottledCallback(() => play('magic', 0.3, 1.0), THROTTLE_MS.magic);
  const playWind = useThrottledCallback(() => play('wind', 0.15, 1.0), THROTTLE_MS.wind);

  return { initAudio, preloadSounds, playGrab, playRelease, playMagic, playWind };
}
