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
      throw new Error('Failed to send message');
    }

    return response.json();
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
      throw new Error('Failed to send audio');
    }

    return response.json();
  }
}

export const apiService = new ApiService();