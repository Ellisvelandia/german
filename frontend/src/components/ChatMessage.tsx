import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { useAudioManager } from "../hooks/useAudioManager";

interface ChatMessageProps {
  text: string; // Pre-cleaned text (no emojis/special symbols)
  translation: string; // Pre-cleaned translation (no emojis/special symbols)
  audioUrl?: string; // Generated from pre-cleaned text
  isUser: boolean;
  isTranscribing?: boolean;
}

const ChatMessage = ({
  text,
  translation,
  audioUrl,
  isUser,
  isTranscribing = false,
}: ChatMessageProps) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const { audioRef, isPlaying, playAudio, pauseAudio } = useAudioManager();

  const handlePlayAudio = async () => {
    try {
      if (isPlaying) {
        pauseAudio();
      } else if (audioUrl) {
        await playAudio(audioUrl);
      }
    } catch (error) {
      console.error("Error playing/pausing audio:", error);
    }
  };

  const toggleTranslation = () => {
    setShowTranslation((prev) => !prev);
  };

  // Note: cleanText is no longer needed here because text and translation are pre-cleaned
  // before being passed as props from the message creation logic (e.g., useChatMessages).

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
            <p className="text-sm sm:text-base leading-relaxed break-words">
              {text} {/* Display pre-cleaned user text */}
            </p>
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
                {text} {/* Display pre-cleaned AI text */}
              </p>
              {audioUrl && (
                <button
                  onClick={handlePlayAudio}
                  className="flex-shrink-0 flex items-center justify-center p-1.5 sm:p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors ml-2"
                  title="Play pronunciation"
                  disabled={!audioUrl}
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
                  {translation} {/* Display pre-cleaned translation */}
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
            <audio ref={audioRef} className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
