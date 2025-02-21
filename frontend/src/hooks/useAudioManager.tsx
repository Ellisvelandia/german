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

        // Set the source
        audioRef.current.src = audioSrc;

        // Find or create source element
        const sourceElement = audioRef.current.querySelector('source') || 
                            document.createElement('source');
        sourceElement.src = audioSrc;
        
        // Set appropriate MIME type
        if (audioSrc.startsWith('data:audio/mp3')) {
          sourceElement.type = 'audio/mp3';
        } else if (audioSrc.startsWith('data:audio/mpeg')) {
          sourceElement.type = 'audio/mpeg';
        } else {
          sourceElement.type = 'audio/mpeg'; // default type
        }

        // Ensure source element is in the audio element
        if (!audioRef.current.contains(sourceElement)) {
          audioRef.current.appendChild(sourceElement);
        }

        // Wait for the audio to be loaded
        await new Promise((resolve, reject) => {
          if (!audioRef.current) return reject('No audio reference');
          
          const handleLoad = () => {
            audioRef.current?.removeEventListener('loadeddata', handleLoad);
            resolve(true);
          };
          
          const handleError = () => {
            audioRef.current?.removeEventListener('error', handleError);
            console.error('Audio loading error:', audioRef.current?.error);
            reject(new Error(`Failed to load audio: ${audioRef.current?.error?.message}`));
          };
          
          audioRef.current.addEventListener('loadeddata', handleLoad);
          audioRef.current.addEventListener('error', handleError);
        });

        await play();
        
        cleanupRef = () => {
          if (audioSrc.startsWith('blob:')) {
            URL.revokeObjectURL(audioSrc);
          }
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







