interface ConversationResponse {
  text: string;
  translation: string;
  audio: string;
}

export class ApiService {
  private baseUrl = 'http://localhost:8002'
  private timeout = 30000; // 30 seconds timeout

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. The server is taking longer than expected to respond. Please try again.');
        }
        throw new Error(`Network error: ${error.message}`);
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async sendMessage(scenario: string, message: string): Promise<ConversationResponse> {
    try {
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
        // Get detailed error message from server if available
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to send message: ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();
      
      // Map backend response fields to frontend expected fields
      const mappedData = {
        text: data.text || data.germanText || '',
        translation: data.translation || data.englishText || '',
        audio: data.audio || ''
      };
      
      // Add more detailed validation
      if (!mappedData.text || typeof mappedData.text !== 'string') {
        console.error('Invalid response data:', data);
        throw new Error('Server response missing required text field');
      }
      if (!mappedData.translation || typeof mappedData.translation !== 'string') {
        console.error('Invalid response data:', data);
        throw new Error('Server response missing required translation field');
      }
      if (typeof mappedData.audio !== 'string') {
        console.error('Invalid response data:', data);
        throw new Error('Server response has invalid audio format');
      }

      return mappedData;
    } catch (error) {
      console.error('API Error Details:', error);
      throw error;
    }
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
