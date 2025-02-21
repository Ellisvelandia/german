import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import { Mic, Send, MicOff, ArrowLeft, Info } from 'lucide-react';
import { useChatMessages } from '../hooks/useChatMessages';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioManager } from '../hooks/useAudioManager';

interface ChatInterfaceProps {
  scenario: string;
}

const ChatInterface = ({ scenario }: ChatInterfaceProps) => {
  const [inputText, setInputText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [showTip, setShowTip] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    messages,
    isLoading,
    messagesEndRef,
    handleSendMessage: sendMessage,
    handleAudioResponse,
  } = useChatMessages({ scenario });

  const {
    isRecording,
    toggleRecording,
    // Remove the unused 'error' destructuring
  } = useSpeechRecognition({
    onRecordingComplete: async (audioBlob) => {
      if (transcription.trim()) {
        setIsProcessing(true);
        try {
          await handleAudioResponse(audioBlob, transcription);
        } finally {
          setIsProcessing(false);
          setTranscription('');
        }
      }
    },
    onTranscriptionChange: (text) => setTranscription(text),
    onError: (error) => {
      console.error('Erro ao gravar áudio:', error);
      alert(error.message);
    },
  });

  const navigate = useNavigate();
  const { stopAudio } = useAudioManager();

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    try {
      stopAudio();
      await sendMessage(inputText);
      setInputText('');
    } catch (error) {
      if (error instanceof Error && error.message.includes('timed out')) {
        alert('A resposta está demorando mais que o esperado. Tente novamente.');
      }
    }
  };

  useEffect(() => {
    if (isRecording) {
      stopAudio();
    }
  }, [isRecording, stopAudio]);

  const handleBack = () => {
    navigate('/');
  };

  const getScenarioTitle = () => {
    const titles: Record<string, string> = {
      restaurant: 'Restaurante',
      supermarket: 'Supermercado',
      train: 'Estação de Trem',
      conversation: 'Conversa Livre'
    };
    return titles[scenario] || 'Conversa';
  };

  const renderMessageList = () => (
    <div className="flex-1 overflow-y-auto mb-2 sm:mb-4 space-y-2 sm:space-y-4 p-4 rounded-lg bg-white shadow-sm">
      {showTip && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-4 text-sm text-blue-700">
          <Info className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p>Dica: Você pode usar o microfone para falar em português ou digitar sua mensagem.</p>
            <button 
              onClick={() => setShowTip(false)}
              className="text-blue-600 text-xs hover:underline mt-1"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
      
      {messages.map((message, index) => (
        <div key={index} className="transition-all duration-300 ease-in-out transform hover:scale-[1.01]">
          <ChatMessage
            text={message.text}
            translation={message.translation || ''}
            audioUrl={message.audioUrl}
            isUser={message.isUser}
            isTranscribed={message.isTranscribed}
          />
        </div>
      ))}
      
      {isRecording && transcription && (
        <div className="transition-all duration-300 ease-in-out">
          <ChatMessage 
            text={transcription}
            translation=""
            isUser={true}
            isTranscribing={true}
          />
        </div>
      )}
      
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-4 space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-gray-500">Gerando resposta...</p>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  const renderInputArea = () => (
    <div className="flex flex-col gap-2">
      {(isRecording || transcription) && (
        <div className={`p-3 ${isProcessing ? 'bg-blue-100' : 'bg-blue-50'} rounded-lg text-gray-700 text-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <strong>
                {isRecording ? 'Gravando:' : isProcessing ? 'Enviando:' : 'Transcrito:'}
              </strong>
              <span className="flex-1">{transcription}</span>
            </div>
            {isRecording && transcription.trim() && (
              <button
                onClick={toggleRecording}
                className="text-blue-600 text-xs hover:underline px-2 py-1"
              >
                Enviar
              </button>
            )}
          </div>
          {isProcessing && (
            <div className="mt-2 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-xs text-blue-600">Processando áudio...</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 p-4 border-t border-gray-200 bg-white rounded-lg shadow-sm">
        <button
          onClick={toggleRecording}
          className={`p-3 rounded-full flex-shrink-0 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isRecording ? 'focus:ring-red-500' : 'focus:ring-blue-500'
          }`}
          disabled={isLoading || isProcessing}
          title={isRecording ? 'Parar e enviar' : 'Iniciar gravação'}
          aria-label={isRecording ? 'Parar e enviar' : 'Iniciar gravação'}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Digite sua mensagem em português..."
            className="w-full p-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200 bg-gray-50"
            disabled={isLoading || isRecording || isProcessing}
            aria-label="Campo de mensagem"
          />
          {inputText.trim() && (
            <div className="absolute right-3 top-3 text-xs text-gray-400">
              Pressione Enter para enviar
            </div>
          )}
        </div>

        <button
          onClick={handleSendMessage}
          className={`p-3 rounded-full flex-shrink-0 ${
            !inputText.trim() || isLoading || isRecording || isProcessing
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          disabled={!inputText.trim() || isLoading || isRecording || isProcessing}
          title="Enviar mensagem"
          aria-label="Enviar mensagem"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Voltar para página anterior"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {getScenarioTitle()}
          </h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col p-4 max-w-4xl mx-auto w-full">
        {renderMessageList()}
        {renderInputArea()}
      </main>
    </div>
  );
};

export default ChatInterface;
