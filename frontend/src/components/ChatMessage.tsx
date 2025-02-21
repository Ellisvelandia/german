import { useState } from "react";
import { Play, Pause, Mic } from "lucide-react";
import { useAudioManager } from "../hooks/useAudioManager";

interface ChatMessageProps {
  text: string;
  translation: string;
  audioUrl?: string;
  isUser: boolean;
  isTranscribing?: boolean;
  isTranscribed?: boolean;
}

const ChatMessage = ({
  text,
  translation,
  audioUrl,
  isUser,
  isTranscribing = false,
  isTranscribed = false,
}: ChatMessageProps) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const { audioRef, isPlaying, playAudio, pauseAudio } = useAudioManager();

  const handlePlayAudio = async () => {
    if (!audioUrl) return;

    try {
      if (isPlaying) {
        pauseAudio();
      } else {
        await playAudio(audioUrl);
      }
    } catch (error) {
      console.error("Erro ao reproduzir áudio:", error);
      alert("Não foi possível reproduzir o áudio. Por favor, tente novamente.");
    }
  };

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } mb-3 px-2 sm:px-0 w-full`}
    >
      {!isUser && (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
          <img
            src="/asianwoman.png"
            alt="Mulher asiática"
            className="w-full h-full rounded-full"
          />
        </div>
      )}
      
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-3 ${
          isUser 
            ? "bg-blue-500 text-white ml-2" 
            : "bg-white border border-gray-100 shadow-sm"
        } ${isTranscribing ? "animate-pulse" : ""}`}
      >
        <div className={`space-y-2 ${isUser ? "text-white" : "text-gray-800"}`}>
          <div className="flex items-start gap-2">
            {isUser && isTranscribed && (
              <Mic className="w-4 h-4 text-blue-200 flex-shrink-0 mt-1" />
            )}
            <p className="text-sm leading-relaxed break-words flex-grow">
              {text}
            </p>
            {!isUser && audioUrl && (
              <button
                onClick={handlePlayAudio}
                className="flex-shrink-0 p-1.5 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                title="Ouvir pronúncia"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-blue-600" />
                ) : (
                  <Play className="h-4 w-4 text-blue-600" />
                )}
              </button>
            )}
          </div>

          {isTranscribing && (
            <p className="text-xs text-blue-200 italic">
              Transcrevendo áudio...
            </p>
          )}

          {!isUser && translation && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                {showTranslation ? (
                  <>
                    {translation}
                    <button
                      onClick={() => setShowTranslation(false)}
                      className="text-blue-600 text-xs ml-2 hover:underline"
                    >
                      Ocultar tradução
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowTranslation(true)}
                    className="text-blue-600 text-xs hover:underline"
                  >
                    Mostrar tradução
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <audio ref={audioRef} className="hidden">
        <source type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default ChatMessage;
