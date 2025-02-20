import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface ChatMessageProps {
  text: string;
  translation: string;
  audioUrl?: string;
  isUser: boolean;
}

const ChatMessage = ({
  text,
  translation,
  audioUrl,
  isUser,
}: ChatMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && audioUrl && !isUser) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      audioRef.current.play().catch(error => {
        console.error('Error auto-playing audio:', error);
      });
      setIsPlaying(true);
    }
  }, [audioUrl, isUser]);

  const handlePlayAudio = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          await audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error('Error playing/pausing audio:', error);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioError = (error: Event) => {
    console.error('Audio playback error:', error);
    setIsPlaying(false);
  };
  const toggleTranslation = () => {
    setShowTranslation((prev) => !prev);
  };

  // Function to clean text from emojis and special symbols
  const cleanText = (input: string) => {
    return input.replace(/[^\p{L}\p{N}\s.,!?-]/gu, "").trim();
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 px-2 sm:px-0 w-full`}>
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
        className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-3 sm:p-5 ${isUser ? "bg-blue-500 text-white" : "bg-white shadow-lg"}`}
      >
        {isUser ? (
          <p className="text-sm sm:text-base leading-relaxed break-words">
            {cleanText(text)}
          </p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start space-x-2">
              <p className="text-base sm:text-xl font-medium text-gray-800 leading-relaxed break-words flex-grow">
                {cleanText(text)}
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
                  {cleanText(translation)}{" "}
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
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleAudioEnded}
                onError={(e: React.SyntheticEvent<HTMLAudioElement, Event>) => handleAudioError(e.nativeEvent)}
                preload="auto"
                className="hidden"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
