import React, { useState } from "react";

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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    {isPlaying ? (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
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
