import { useState } from 'react';
import ChatMessage from './ChatMessage';
import { Mic, Send, MicOff } from 'lucide-react';
import { useChatMessages } from '../hooks/useChatMessages';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface ChatInterfaceProps {
  scenario: string;
}

const ChatInterface = ({ scenario }: ChatInterfaceProps) => {
  const [inputText, setInputText] = useState('');
  const [transcription, setTranscription] = useState('');
  const {
    messages,
    isLoading,
    messagesEndRef,
    handleSendMessage: sendMessage,
    handleAudioResponse
  } = useChatMessages({ scenario });

  const {
    isRecording,
    startRecording,
    stopRecording
  } = useAudioRecorder({
    onRecordingComplete: handleAudioResponse,
    onTranscriptionChange: (text) => setTranscription(text),
    onError: (error) => {
      console.error('Error recording audio:', error);
      alert('Could not access microphone. Please ensure microphone permissions are granted.');
    }
  });

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    try {
      await sendMessage(inputText);
      setInputText('');
    } catch (error) {
      if (error instanceof Error && error.message.includes('timed out')) {
        alert('The response is taking longer than expected. Please try again.');
      }
    }
  };

  const renderMessageList = () => (
    <div className="flex-1 overflow-y-auto mb-2 sm:mb-4 space-y-2 sm:space-y-4 p-4 rounded-lg bg-white shadow-sm">
      {messages.map((message, index) => (
        <div key={index} className="transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
          <ChatMessage
            text={message.text}
            translation={message.translation || ''}
            audioUrl={message.audioUrl}
            isUser={message.isUser}
          />
        </div>
      ))}
      {isRecording && transcription && (
        <div className="transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
          <ChatMessage
            text={transcription}
            translation="Live transcription"
            isUser={true}
          />
        </div>
      )}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-4 space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-gray-500">Generating response...</p>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  const renderInputArea = () => (
    <div className="flex flex-col gap-2">
      {isRecording && transcription && (
        <div className="p-3 bg-blue-50 rounded-lg text-gray-700 text-sm animate-fade-in">
          <strong>Transcribing:</strong> {transcription}
        </div>
      )}
      <div className="flex items-center gap-3 p-4 border-t border-gray-200 bg-white rounded-lg shadow-sm">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-3 rounded-full flex-shrink-0 ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isRecording ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
          disabled={isLoading}
          title={isRecording ? 'Stop recording' : 'Start recording'}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Type your message in German..."
            className="w-full p-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200 bg-gray-50"
            disabled={isLoading || isRecording}
            aria-label="Message input"
          />
          {inputText.trim() && (
            <div className="absolute right-3 top-3 text-xs text-gray-400">
              Press Enter to send
            </div>
          )}
        </div>
        <button
          onClick={handleSendMessage}
          className={`p-3 rounded-full flex-shrink-0 ${!inputText.trim() || isLoading || isRecording ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          disabled={isLoading || !inputText.trim() || isRecording}
          title="Send message"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-2 sm:p-4 max-w-4xl mx-auto w-full bg-gray-50">
      {renderMessageList()}
      {renderInputArea()}
    </div>
  );
};

export default ChatInterface;