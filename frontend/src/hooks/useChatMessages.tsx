import { useState, useRef } from "react";
import { apiService } from "../services/api";
import { Message } from "../types";

interface ChatResponse {
  text: string;
  translation: string;
}

export const useChatMessages = ({ scenario }: { scenario: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (text: string): Promise<ChatResponse> => {
    setIsLoading(true);
    try {
      const userMessage: Message = {
        text,
        isUser: true,
      };
      setMessages(prev => [...prev, userMessage]);

      const response = await apiService.sendMessage(scenario, text);
      const botMessage: Message = {
        text: response.text,
        translation: response.translation,
        isUser: false,
      };
      setMessages(prev => [...prev, botMessage]);

      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioResponse = async (audioBlob: Blob, text: string): Promise<ChatResponse> => {
    setIsLoading(true);
    try {
      const userMessage: Message = {
        text,
        isUser: true,
        isTranscribed: true,
      };
      setMessages(prev => [...prev, userMessage]);

      const response = await apiService.sendAudio(scenario, audioBlob);
      const botMessage: Message = {
        text: response.text,
        translation: response.translation,
        isUser: false,
      };
      setMessages(prev => [...prev, botMessage]);

      return response;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    messagesEndRef,
    handleSendMessage,
    handleAudioResponse,
  };
};
