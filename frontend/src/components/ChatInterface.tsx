import { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAudio } from '../hooks/useAudio';
import ChatMessage from './ChatMessage';
import { Mic, Send, MicOff } from 'lucide-react';

interface Message {
  text: string;
  translation?: string;
  audioUrl?: string;
  isUser: boolean;
}

interface ChatInterfaceProps {
  scenario: string;
}

const INITIAL_MESSAGES: { [key: string]: { text: string; translation: string } } = {
  restaurant: {
    text: "Willkommen im Restaurant! Wie kann ich Ihnen helfen?",
    translation: "Welcome to the restaurant! How can I help you?"
  },
  supermarket: {
    text: "Willkommen im Supermarkt! Wonach suchen Sie?",
    translation: "Welcome to the supermarket! What are you looking for?"
  },
  train: {
    text: "Willkommen am Bahnhof! Wie kann ich Ihnen helfen?",
    translation: "Welcome to the train station! How can I help you?"
  },
  conversation: {
    text: "Willkommen! Worüber möchten Sie sprechen?",
    translation: "Welcome! What would you like to talk about?"
  }
};

const ChatInterface = ({ scenario }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { audioRef, play, stop } = useAudio({});

  useEffect(() => {
    // Initialize chat with scenario-specific greeting
    const initialMessage = INITIAL_MESSAGES[scenario] || INITIAL_MESSAGES.conversation;
    setMessages([{
      text: initialMessage.text,
      translation: initialMessage.translation,
      isUser: false,
      audioUrl: undefined
    }]);

    // Cleanup function
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        stopRecording();
      }
      stop();
    };
  }, [scenario]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      // Stop any playing audio before sending new message
      stop();

      const userMessage: Message = { text: inputText, isUser: true };
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setIsLoading(true);

      const response = await apiService.sendMessage(scenario, inputText);

      if (!response?.text || !response?.translation || !response?.audio) {
        throw new Error('Invalid response from server');
      }

      const audioUrl = `data:audio/mp3;base64,${response.audio}`;
      const botMessage: Message = {
        text: response.text,
        translation: response.translation,
        audioUrl: audioUrl,
        isUser: false
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Auto-play the response audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        text: 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.',
        translation: 'Sorry, there was an error. Please try again.',
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setIsLoading(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const response = await apiService.sendAudio(scenario, audioBlob);

          if (!response?.text || !response?.translation || !response?.audio) {
            throw new Error('Invalid response from server');
          }

          const botMessage: Message = {
            text: response.text,
            translation: response.translation,
            audioUrl: `data:audio/mp3;base64,${response.audio}`,
            isUser: false
          };
          setMessages(prev => [...prev, botMessage]);
        } catch (error) {
          console.error('Error sending audio:', error);
          setMessages(prev => [...prev, { 
            text: 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.',
            translation: 'Sorry, there was an error. Please try again.',
            isUser: false 
          }]);
        } finally {
          setIsLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-2 sm:p-4 max-w-4xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto mb-2 sm:mb-4 space-y-2 sm:space-y-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            text={message.text}
            translation={message.translation || ''}
            audioUrl={message.audioUrl}
            isUser={message.isUser}
          />
        ))}
        {isLoading && (
          <div className="flex justify-center items-center py-2 sm:py-4">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center space-x-2 p-2 sm:p-4 border-t">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-full flex-shrink-0 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-200`}
          disabled={isLoading}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? <MicOff size={18} className="sm:w-5 sm:h-5" /> : <Mic size={18} className="sm:w-5 sm:h-5" />}
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message in German..."
          className="flex-1 p-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
          disabled={isLoading || isRecording}
        />
        <button
          onClick={handleSendMessage}
          className="p-2 rounded-full flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
          disabled={isLoading || !inputText.trim() || isRecording}
          title="Send message"
        >
          <Send size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;