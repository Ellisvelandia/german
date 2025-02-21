import { useState, useRef, useEffect } from "react";
import { apiService } from "../services/api";
import { useAudio } from "./useAudio";
import { Message } from "../types";

interface UseChatMessagesProps {
  scenario: string;
}

const INITIAL_MESSAGES: Record<string, { text: string; translation: string }> = {
  restaurant: {
    text: "Bem-vindo ao restaurante! Como posso ajudar?",
    translation: "Welcome to the restaurant! How can I help you?",
  },
  supermarket: {
    text: "Bem-vindo ao supermercado! O que você procura?",
    translation: "Welcome to the supermarket! What are you looking for?",
  },
  train: {
    text: "Bem-vindo à estação! Como posso ajudar?",
    translation: "Welcome to the station! How can I help you?",
  },
  conversation: {
    text: "Olá! Sobre o que você quer conversar?",
    translation: "Hi! What would you like to talk about?",
  },
};

// Utility function to clean text from emojis and special symbols
const cleanText = (input: string) => {
  return input.replace(/[^\p{L}\p{N}\s.,!?-]/gu, "").trim();
};

export const useChatMessages = ({ scenario }: UseChatMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { stop } = useAudio({});

  // Initialize with a cleaned initial message based on scenario
  useEffect(() => {
    const initialMessage =
      INITIAL_MESSAGES[scenario] || INITIAL_MESSAGES.conversation;
    const cleanedText = cleanText(initialMessage.text);
    const cleanedTranslation = cleanText(initialMessage.translation);
    setMessages([
      {
        text: cleanedText,
        translation: cleanedTranslation,
        isUser: false,
        audioUrl: undefined, // No audio for initial message
      },
    ]);
  }, [scenario]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim()) return;

    try {
      stop(); // Stop any playing audio
      const cleanedUserText = cleanText(inputText); // Clean user input
      const userMessage: Message = { text: cleanedUserText, isUser: true };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const response = await apiService.sendMessage(scenario, cleanedUserText); // Send cleaned text
      if (!response?.text || !response?.translation || !response?.audio) {
        throw new Error("Invalid response from server");
      }

      const cleanedResponseText = cleanText(response.text); // Clean AI response text
      const cleanedTranslation = cleanText(response.translation); // Clean translation
      const audioUrl = response.audio 
        ? `data:audio/mpeg;base64,${response.audio}`  // Changed from mp3 to mpeg
        : undefined;
      const botMessage: Message = {
        text: cleanedResponseText,
        translation: cleanedTranslation,
        audioUrl,
        isUser: false,
      };
      setMessages((prev) => [...prev, botMessage]);

      // No longer auto-playing audio here as it's handled by ChatMessage component
    } catch (error) {
      console.error("Error sending message:", error);
      addErrorMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioResponse = async (
    audioBlob: Blob,
    transcribedText: string
  ) => {
    try {
      setIsLoading(true);
      // First, add the transcribed user message
      const userMessage: Message = {
        text: transcribedText,
        isUser: true,
        isTranscribed: true, // Add this flag to indicate it was from voice
      };
      setMessages((prev) => [...prev, userMessage]);

      // Then process the audio response
      const response = await apiService.sendAudio(scenario, audioBlob);

      if (!response?.text || !response?.translation || !response?.audio) {
        throw new Error("Invalid response from server");
      }

      const botMessage: Message = {
        text: cleanText(response.text),
        translation: cleanText(response.translation),
        audioUrl: `data:audio/mp3;base64,${response.audio}`,
        isUser: false,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error processing audio:", error);
      addErrorMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const addErrorMessage = () => {
    const errorText =
      "Desculpe, ocorreu um erro. Por favor, tente novamente."; // Changed from German to Portuguese
    const errorTranslation = "Sorry, there was an error. Please try again.";
    setMessages((prev) => [
      ...prev,
      {
        text: cleanText(errorText), // Clean error message
        translation: cleanText(errorTranslation), // Clean error translation
        isUser: false,
      },
    ]);
  };

  return {
    messages,
    isLoading,
    messagesEndRef,
    handleSendMessage,
    handleAudioResponse,
    addErrorMessage,
  };
};
