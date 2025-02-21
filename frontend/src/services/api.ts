interface ConversationResponse {
  text: string;
  translation: string;
  audioData: string; // Changed from 'audio' to be more descriptive
}

export class ApiService {
  private baseUrl = 'http://localhost:8002'
  private controller: AbortController | null = null;

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    // Cancel any pending requests
    if (this.controller) {
      this.controller.abort();
    }
    this.controller = new AbortController();

    const timeoutId = setTimeout(() => {
      this.controller?.abort();
    }, 15000); // 15 seconds timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: this.controller.signal,
        headers: {
          ...options.headers,
          'Connection': 'keep-alive',
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw new Error(`Network error: ${error.message}`);
      }
      throw error;
    }
  }

  async sendMessage(scenario: string, message: string): Promise<ConversationResponse> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenario,
        message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || response.statusText);
    }

    return response.json();
  }

  async sendAudio(scenario: string, audioBlob: Blob): Promise<ConversationResponse> {
    // Compress audio before sending
    const compressedAudio = await this.compressAudio(audioBlob);
    
    const formData = new FormData();
    formData.append('audio', compressedAudio);
    formData.append('scenarioName', scenario);

    const response = await this.fetchWithTimeout(`${this.baseUrl}/converse/audio`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to send audio: ${response.statusText}`);
    }

    return response.json();
  }

  private async compressAudio(audioBlob: Blob): Promise<Blob> {
    // Convert to mp3 with lower bitrate
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Use Web Audio API to compress
    const offlineContext = new OfflineAudioContext(
      1,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    const renderedBuffer = await offlineContext.startRendering();
    const wavBlob = await this.bufferToWav(renderedBuffer, { sampleRate: 16000 });
    
    return new Blob([wavBlob], { type: 'audio/wav' });
  }

  private bufferToWav(buffer: AudioBuffer, options?: { sampleRate: number }): Promise<Blob> {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = options?.sampleRate || 16000; // Use provided sample rate or default to 16000
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return Promise.resolve(new Blob([arrayBuffer], { type: 'audio/wav' }));
  }
}


export const apiService = new ApiService();
