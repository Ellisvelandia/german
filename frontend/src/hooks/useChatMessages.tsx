import { useState, useRef, useEffect } from "react";
import { apiService } from "../services/api";
import { useAudio } from "./useAudio";

interface Message {
  text: string; // Cleaned text (no emojis/special symbols)
  translation?: string; // Cleaned translation (no emojis/special symbols)
  audioUrl?: string; // Generated from cleaned text
  isUser: boolean;
}

interface UseChatMessagesProps {
  scenario: string;
}

const INITIAL_MESSAGES: Record<string, { text: string; translation: string }> =
  {
    restaurant: {
      text: "Willkommen im Restaurant! Wie kann ich Ihnen helfen?",
      translation: "Welcome to the restaurant! How can I help you?",
    },
    supermarket: {
      text: "Willkommen im Supermarkt! Wonach suchen Sie?",
      translation: "Welcome to the supermarket! What are you looking for?",
    },
    train: {
      text: "Willkommen am Bahnhof! Wie kann ich Ihnen helfen?",
      translation: "Welcome to the train station! How can I help you?",
    },
    conversation: {
      text: "Willkommen! Worüber möchten Sie sprechen?",
      translation: "Welcome! What would you like to talk about?",
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
      const audioUrl = `data:audio/mp3;base64,${response.audio}`; // Audio is already from cleaned text via API
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

  const handleAudioResponse = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      const response = await apiService.sendAudio(scenario, audioBlob);

      if (!response?.text || !response?.translation || !response?.audio) {
        throw new Error("Invalid response from server");
      }

      const cleanedResponseText = cleanText(response.text); // Clean AI response text
      const cleanedTranslation = cleanText(response.translation); // Clean translation
      const audioUrl = `data:audio/mp3;base64,${response.audio}`; // Audio from API
      const botMessage: Message = {
        text: cleanedResponseText,
        translation: cleanedTranslation,
        audioUrl,
        isUser: false,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending audio:", error);
      addErrorMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const addErrorMessage = () => {
    const errorText =
      "Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.";
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
