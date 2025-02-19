import React, { useState } from "react";
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
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
          <img
            src="/woman.png"
            alt="ai woman"
            className="w-full h-full rounded-full"
          />
        </div>
      )}
      <div
        className={`max-w-[70%] rounded-lg p-5 ${
          isUser ? "bg-blue-500 text-white" : "bg-white shadow-lg"
        }`}
      >
        {isUser ? (
          <p className="text-base leading-relaxed break-words">{text}</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xl font-medium text-gray-800 leading-relaxed break-words">
              {text}
            </p>
            <div className="h-px bg-gray-200 my-2" />
            <p className="text-base text-gray-600 leading-relaxed italic break-words">
              {translation}
            </p>
            {audioUrl && (
              <div className="mt-2 flex items-center">
                <button
                  onClick={handlePlayAudio}
                  className="flex items-center justify-center p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Play className="h-5 w-5 text-blue-600" />
                  )}
                </button>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
