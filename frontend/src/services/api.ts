interface ConversationResponse {
  text: string;
  translation: string;
  audio: string;
}

export class ApiService {
  private baseUrl = 'http://localhost:8002'

  async sendMessage(scenario: string, message: string): Promise<ConversationResponse> {
    const response = await fetch(`${this.baseUrl}/api/conversation`, {
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
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map backend response fields to frontend expected fields
    const mappedData = {
      text: data.germanText || data.text,
      translation: data.englishText || data.translation,
      audio: data.audio
    };
    
    // Validate response data
    if (!mappedData.text || typeof mappedData.text !== 'string') {
      throw new Error('Invalid response: missing or invalid text');
    }
    if (!mappedData.translation || typeof mappedData.translation !== 'string') {
      throw new Error('Invalid response: missing or invalid translation');
    }
    if (!mappedData.audio || typeof mappedData.audio !== 'string') {
      throw new Error('Invalid response: missing or invalid audio');
    }

    return mappedData;
  }

  async sendAudio(scenario: string, audioBlob: Blob): Promise<ConversationResponse> {
    try {
      // Validate audio blob
      if (!(audioBlob instanceof Blob)) {
        throw new Error('Invalid audio data');
      }
      if (audioBlob.size === 0) {
        throw new Error('Empty audio data');
      }

      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('scenarioName', scenario);

      const response = await fetch(`${this.baseUrl}/converse/audio`, {
        method: 'POST',
        body: formData,
      });

      // Check if the server is available
      if (response.status === 404) {
        throw new Error('Audio processing service is not available');
      }

      if (!response.ok) {
        throw new Error(`Failed to send audio: ${response.statusText}`);
      }

      const data = await response.json();

      // Map backend response fields to frontend expected fields
      const mappedData = {
        text: data.germanText || data.text,
        translation: data.englishText || data.translation,
        audio: data.audio
      };

      // Validate response data
      if (!mappedData.text || typeof mappedData.text !== 'string') {
        throw new Error('Invalid response: missing or invalid text');
      }
      if (!mappedData.translation || typeof mappedData.translation !== 'string') {
        throw new Error('Invalid response: missing or invalid translation');
      }
      if (!mappedData.audio || typeof mappedData.audio !== 'string') {
        throw new Error('Invalid response: missing or invalid audio');
      }

      return mappedData;
    } catch (error) {
      throw error;
    }
  }
}


export const apiService = new ApiService();