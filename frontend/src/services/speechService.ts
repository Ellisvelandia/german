import axios from 'axios';

const API_BASE_URL = 'http://localhost:8002';

export const initializeSpeechRecognition = (lang = 'pt-BR') => { // Changed from 'de-DE' to 'pt-BR'
  if (!('webkitSpeechRecognition' in window)) {
    throw new Error('Speech recognition not supported');
  }

  const recognition = new (window as any).webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;
  recognition.maxAlternatives = 1;

  return recognition;
};

export const saveAudioLocally = (recordedFile: Blob) => {
  if (!recordedFile) return;

  const fileName = `recording_${new Date().toISOString().replace(/:/g, '-')}.webm`;
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(recordedFile);
  downloadLink.download = fileName;
  downloadLink.click();

  setTimeout(() => {
    URL.revokeObjectURL(downloadLink.href);
  }, 100);
};

export const initializeMicrophone = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (err) {
    return false;
  }
};

interface ConversationResponse {
  audio: string;
  germanText: string;
  englishText: string;
}

export const startConversationWithAudio = async (scenarioName: string, audioFile: Blob): Promise<{
  audio: Blob;
  germanText: string;
  englishText: string;
}> => {
  try {
    const formData = new FormData();
    formData.append('scenarioName', scenarioName);
    formData.append('audio', audioFile);

    const response = await axios.post<ConversationResponse>(
      `${API_BASE_URL}/api/conversation/audio`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const { audio, germanText, englishText } = response.data;
    const audioBlob = new Blob(
      [Uint8Array.from(atob(audio), c => c.charCodeAt(0))],
      { type: 'audio/mpeg' }
    );

    return {
      audio: audioBlob,
      germanText,
      englishText
    };
  } catch (error) {
    throw error;
  }
};

export const startConversationWithText = async (scenarioName: string, text: string): Promise<{
  audio: Blob;
  germanText: string;
  englishText: string;
}> => {
  try {
    const response = await axios.post<ConversationResponse>(
      `${API_BASE_URL}/api/conversation`,
      { scenario: scenarioName, message: text },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { audio, germanText, englishText } = response.data;
    const audioBlob = new Blob(
      [Uint8Array.from(atob(audio), c => c.charCodeAt(0))],
      { type: 'audio/mpeg' }
    );

    return {
      audio: audioBlob,
      germanText,
      englishText
    };
  } catch (error) {
    throw error;
  }
};
