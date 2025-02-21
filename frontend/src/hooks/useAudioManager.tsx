import { useCallback } from 'react';
import { useAudio } from './useAudio';

export const useAudioManager = () => {
  const { audioRef, isPlaying, play, pause, stop, error } = useAudio({});
  let cleanupRef: (() => void) | undefined;

  const playAudio = useCallback(async (audioSrc: string) => {
    if (!audioSrc) return;
    try {
      if (audioRef.current) {
        // Reset the audio element
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        if (cleanupRef) {
          cleanupRef();
        }

        // Convert base64 to blob if needed
        let audioUrl = audioSrc;
        if (audioSrc.startsWith('data:audio')) {
          const base64Data = audioSrc.split(',')[1];
          const audioBlob = await fetch(`data:audio/mpeg;base64,${base64Data}`).then(r => r.blob());
          audioUrl = URL.createObjectURL(audioBlob);
        }

        // Set the source
        audioRef.current.src = audioUrl;

        // Find or create source element
        let sourceElement = audioRef.current.querySelector('source');
        if (!sourceElement) {
          sourceElement = document.createElement('source');
          audioRef.current.appendChild(sourceElement);
        }
        
        sourceElement.src = audioUrl;
        sourceElement.type = 'audio/mpeg';

        // Wait for the audio to be loaded
        await new Promise((resolve, reject) => {
          if (!audioRef.current) return reject('No audio reference');
          
          const handleLoad = () => {
            audioRef.current?.removeEventListener('loadeddata', handleLoad);
            resolve(true);
          };
          
          const handleError = (e: Event) => {
            audioRef.current?.removeEventListener('error', handleError);
            const mediaError = (e.target as HTMLAudioElement).error;
            reject(new Error(`Failed to load audio: ${mediaError?.message}`));
          };
          
          audioRef.current.addEventListener('loadeddata', handleLoad);
          audioRef.current.addEventListener('error', handleError);
        });

        await play();
        
        // Cleanup blob URL if created
        if (audioUrl.startsWith('blob:')) {
          cleanupRef = () => {
            URL.revokeObjectURL(audioUrl);
          };
        }
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
    if (cleanupRef) {
      cleanupRef();
      cleanupRef = undefined;
    }
  }, [stop]);

  return {
    audioRef,
    isPlaying,
    playAudio,
    pauseAudio,
    stopAudio,
    error
  };
};







