import { useState, useRef, useCallback } from "react";

interface SpeechRecognitionHookProps {
  onRecordingComplete: (file: File) => void;
  onError?: (error: Error) => void;
}

interface SpeechRecognitionHookReturn {
  isRecording: boolean;
  toggleRecording: () => Promise<void>;
  error: Error | null;
}

export const useSpeechRecognition = (
  { onRecordingComplete, onError }: SpeechRecognitionHookProps
): SpeechRecognitionHookReturn => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const tracks = stream.getAudioTracks();
        tracks.forEach(track => track.getSettings());

        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const supportedType = isSafari ? "audio/mp4" : "audio/webm;codecs=opus";
        const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedType });

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

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
  }, [isRecording, onRecordingComplete, onError]);

  return { isRecording, toggleRecording, error };
};
