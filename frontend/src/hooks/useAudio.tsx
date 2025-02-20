import { useEffect, useRef, useState } from 'react';

interface UseAudioProps {
  audioSrc?: string;
  autoplay?: boolean;
}

interface UseAudioReturn {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  error: Error | null;
}

export const useAudio = ({ audioSrc, autoplay = false }: UseAudioProps): UseAudioReturn => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioSrc) {
      audio.src = audioSrc;
      if (autoplay) {
        audio.play().catch(() => {
          const err = new Error("Autoplay was prevented. Please interact with the page to play audio.");
          setError(err);
        });
      }
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audioSrc, autoplay]);

  const play = async () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        await audio.play();
        setIsPlaying(true);
        setError(null);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to play audio');
        setError(err);
        throw err;
      }
    }
  };

  const pause = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const stop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return {
    audioRef: audioRef as React.RefObject<HTMLAudioElement>,
    isPlaying,
    play,
    pause,
    stop,
    error
  };
};