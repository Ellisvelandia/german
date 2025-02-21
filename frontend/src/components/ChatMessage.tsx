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
      console.error("Error playing/pausing audio:", error);
      // More specific error message
      alert("Não foi possível reproduzir o áudio. Por favor, tente novamente mais tarde.");
    }
  };

  const toggleTranslation = () => {
    setShowTranslation((prev) => !prev);
  };

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } mb-4 px-2 sm:px-0 w-full`}
    >
      {!isUser && (
        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
          <img
            src="/asianwoman.png"
            alt="ai woman"
            className="w-full h-full rounded-full"
          />
        </div>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-3 sm:p-5 ${
          isUser ? "bg-blue-500 text-white" : "bg-white shadow-lg"
        } ${isTranscribing ? "animate-pulse" : ""}`}
      >
        {isUser ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              {isTranscribed && (
                <Mic className="w-4 h-4 text-blue-200 flex-shrink-0 mt-1" />
              )}
              <p className="text-sm sm:text-base leading-relaxed break-words">
                {text}
              </p>
            </div>
            {isTranscribing && (
              <p className="text-xs text-blue-200 italic">
                Transcribing audio...
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start space-x-2">
              <p className="text-base sm:text-xl font-medium text-gray-800 leading-relaxed break-words flex-grow">
                {text}
              </p>
              {audioUrl && (
                <button
                  onClick={handlePlayAudio}
                  className="flex-shrink-0 flex items-center justify-center p-1.5 sm:p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors ml-2"
                  title="Play pronunciation"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  ) : (
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  )}
                </button>
              )}
            </div>
            <div className="h-px bg-gray-200" />
            <div className="text-sm sm:text-base text-gray-600 leading-relaxed italic break-words">
              {showTranslation ? (
                <>
                  {translation}
                  <button
                    onClick={toggleTranslation}
                    className="text-blue-600 underline ml-2 text-sm sm:text-base hover:text-blue-700"
                  >
                    Hide Translation
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleTranslation}
                  className="text-blue-600 underline text-sm sm:text-base hover:text-blue-700"
                >
                  Show Translation
                </button>
              )}
            </div>
            <audio ref={audioRef} className="hidden" preload="auto">
              <source type="audio/mpeg" />
            </audio>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
