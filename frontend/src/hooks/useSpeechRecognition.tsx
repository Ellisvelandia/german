import { useState, useRef, useCallback } from "react";

interface SpeechRecognitionHookProps {
  onRecordingComplete: (file: File) => void;
  onTranscriptionChange?: (text: string) => void;
  onError?: (error: Error) => void;
}

interface SpeechRecognitionHookReturn {
  isRecording: boolean;
  toggleRecording: () => Promise<void>;
  stopRecording: () => void;
  error: Error | null;
}

export const useSpeechRecognition = (
  { onRecordingComplete, onTranscriptionChange, onError }: SpeechRecognitionHookProps
): SpeechRecognitionHookReturn => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const supportedType = isSafari ? "audio/mp4" : "audio/webm;codecs=opus";
        const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedType });

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
              .map((result: any) => result[0])
              .map(result => result.transcript)
              .join('');
            
            onTranscriptionChange?.(transcript);
          };

          recognition.onerror = (event: any) => {
            const err = new Error(`Speech recognition error: ${event.error}`);
            setError(err);
            onError?.(err);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        }

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: supportedType });
          if (audioBlob.size > 0) {
            const file = new File([audioBlob], "recording.webm", { type: supportedType });
            onRecordingComplete(file);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        setIsRecording(false);
        const err = error instanceof Error ? error : new Error('Failed to start recording');
        setError(err);
        onError?.(err);
      }
    }
  }, [isRecording, onRecordingComplete, onTranscriptionChange, onError, stopRecording]);

  return {
    isRecording,
    toggleRecording,
    stopRecording,
    error
  };
};

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}
