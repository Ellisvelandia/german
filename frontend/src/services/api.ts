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
      text: data.germanText,
      translation: data.englishText,
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
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('scenarioName', scenario);

    const response = await fetch(`${this.baseUrl}/converse/audio`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to send audio: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response data
    if (!data.text || typeof data.text !== 'string') {
      throw new Error('Invalid response: missing or invalid text');
    }
    if (!data.translation || typeof data.translation !== 'string') {
      throw new Error('Invalid response: missing or invalid translation');
    }
    if (!data.audio || typeof data.audio !== 'string') {
      throw new Error('Invalid response: missing or invalid audio');
    }

    return data;
  }
}

export const apiService = new ApiService();