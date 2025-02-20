import { useState, useRef } from 'react';

interface UseAudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onTranscriptionChange?: (text: string) => void;
  onError?: (error: Error) => void;
}

export const useAudioRecorder = ({ onRecordingComplete, onTranscriptionChange, onError }: UseAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<typeof window.webkitSpeechRecognition | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'de-DE'; // Set to German

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: unknown) => (result as SpeechRecognitionResult)[0])
            .map(result => result.transcript)
            .join('');
          
          onTranscriptionChange?.(transcript);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          if (audioChunksRef.current.length === 0) {
            throw new Error('No audio data recorded');
          }
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          if (audioBlob.size === 0) {
            throw new Error('Recorded audio is empty');
          }
          onRecordingComplete(audioBlob);
        } catch (error) {
          console.error('Error processing recording:', error);
          const err = error instanceof Error ? error : new Error('Failed to process recording');
          onError?.(err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      const err = error instanceof Error ? error : new Error('Could not access microphone');
      onError?.(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}