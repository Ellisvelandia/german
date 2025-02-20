import { useCallback } from 'react';
import { useAudio } from './useAudio';

interface UseAudioManagerReturn {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  error: Error | null;
  playAudio: (audioSrc: string) => Promise<void>;
  pauseAudio: () => void;
  stopAudio: () => void;
}

export const useAudioManager = (): UseAudioManagerReturn => {
  const { audioRef, isPlaying, play, pause, stop, error } = useAudio({});

  const playAudio = useCallback(async (audioSrc: string) => {
    if (!audioSrc) return;
    try {
      await play();
    } catch (err) {
      console.error('Error playing audio:', err);
      throw err;
    }
  }, [play]);

  const pauseAudio = useCallback(() => {
    pause();
  }, [pause]);

  const stopAudio = useCallback(() => {
    stop();
  }, [stop]);

  return {
    audioRef,
    isPlaying,
    error,
    playAudio,
    pauseAudio,
    stopAudio
  };
};