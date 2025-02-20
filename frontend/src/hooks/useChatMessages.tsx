import { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAudio } from './useAudio';

interface Message {
  text: string;
  translation?: string;
  audioUrl?: string;
  isUser: boolean;
}

interface UseChatMessagesProps {
  scenario: string;
}

const INITIAL_MESSAGES: Record<string, { text: string; translation: string }> = {
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

export const useChatMessages = ({ scenario }: UseChatMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { audioRef, play, stop } = useAudio({});

  useEffect(() => {
    const initialMessage = INITIAL_MESSAGES[scenario] || INITIAL_MESSAGES.conversation;
    setMessages([{
      text: initialMessage.text,
      translation: initialMessage.translation,
      isUser: false,
      audioUrl: undefined
    }]);
  }, [scenario]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim()) return;

    try {
      stop(); // Stop any playing audio
      const userMessage: Message = { text: inputText, isUser: true };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      const response = await apiService.sendMessage(scenario, inputText);
      if (!response?.text || !response?.translation || !response?.audio) {
        throw new Error('Invalid response from server');
      }

      const audioUrl = `data:audio/mp3;base64,${response.audio}`;
      const botMessage: Message = {
        text: response.text,
        translation: response.translation,
        audioUrl,
        isUser: false
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Auto-play response audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addErrorMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioResponse = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
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
      addErrorMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const addErrorMessage = () => {
    setMessages(prev => [...prev, { 
      text: 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.',
      translation: 'Sorry, there was an error. Please try again.',
      isUser: false 
    }]);
  };

  return {
    messages,
    isLoading,
    messagesEndRef,
    handleSendMessage,
    handleAudioResponse,
    addErrorMessage
  };
};