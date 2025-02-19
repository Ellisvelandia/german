import { useState, useCallback, useRef } from 'react';
import { useAudio } from './useAudio';

export const useAudioManager = () => {
  const audioRef = useAudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const playAudio = useCallback(async (audioSrc) => {
    if (!audioSrc || !audioRef.current) return;

    try {
      // Cancel any ongoing audio operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // First set the states
      setIsPlaying(false);
      setIsLoading(true);
      
      // Ensure previous audio is properly stopped
      if (audioRef.current.src) {
        await audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Clear and set new source
      audioRef.current.src = audioSrc;
      
      // Load the new audio with abort signal
      await audioRef.current.load();
      
      // Play the new audio with abort signal
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Audio operation was aborted');
      } else {
        console.error('Error playing audio:', err);
      }
      setIsPlaying(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [audioRef]);

  return {
    audioRef,
    isPlaying,
    isLoading,
    setIsPlaying,
    playAudio
  };
};