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

const INITIAL_MESSAGES: { [key: string]: string } = {
  restaurant: "Willkommen im Restaurant! Wie kann ich Ihnen helfen?",
  supermarket: "Willkommen im Supermarkt! Wonach suchen Sie?"
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
    const initialMessage = INITIAL_MESSAGES[scenario] || "Willkommen! Wie kann ich Ihnen helfen?";
    setMessages([{
      text: initialMessage,
      translation: "Welcome! How can I help you?",
      isUser: false,
      audioUrl: undefined
    }]);
  }, [scenario]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Stop any playing audio before sending new message
    stop();

    const userMessage: Message = { text: inputText, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await apiService.sendMessage(scenario, inputText);

      // Ensure we have all required fields from the response
      if (!response.text || !response.translation || !response.audio) {
        throw new Error('Invalid response: missing required fields');
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
        play();
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
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsLoading(true);
        try {
          const response = await apiService.sendAudio(scenario, audioBlob);

          // Ensure we have all required fields from the response
          if (!response.text || !response.translation || !response.audio) {
            throw new Error('Invalid response: missing required fields');
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
    <div className="h-full flex flex-col p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
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
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center space-x-2 p-4 border-t">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          disabled={isLoading}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message in German..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading || isRecording}
        />
        <button
          onClick={handleSendMessage}
          className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
          disabled={isLoading || !inputText.trim() || isRecording}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;