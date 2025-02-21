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
  let cleanupRef: (() => void) | undefined;

  const playAudio = useCallback(async (audioSrc: string) => {
    if (!audioSrc) return;
    try {
      if (audioRef.current) {
        // Reset the audio element
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        // Cleanup previous URL if exists
        if (cleanupRef) {
          cleanupRef();
        }

        // Verify and clean the audio source format
        if (!audioSrc.startsWith('data:audio/')) {
          throw new Error('Invalid audio format');
        }

        // Create a new Blob from the base64 data
        const base64Data = audioSrc.split(',')[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }
        
        const audioBlob = new Blob([uint8Array], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        audioRef.current.src = audioUrl;
        
        // Wait for the audio to be loaded before playing
        await new Promise((resolve, reject) => {
          if (!audioRef.current) return reject('No audio element');
          
          audioRef.current.onloadeddata = resolve;
          audioRef.current.onerror = () => {
            console.error('Audio loading error:', audioRef.current?.error);
            reject(audioRef.current?.error || 'Failed to load audio');
          };
        });

        await play();
        
        // Store cleanup function
        cleanupRef = () => {
          URL.revokeObjectURL(audioUrl);
        };
      }
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

