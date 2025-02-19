import React from 'react';

interface ChatMessageProps {
  text: string;
  translation: string;
  audioUrl?: string;
  isUser: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ text, translation, audioUrl, isUser }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] rounded-lg p-3 ${isUser ? 'bg-blue-500 text-white' : 'bg-white'}`}>
        <div className="flex items-center space-x-2 mb-1">
          {!isUser && audioUrl && (
            <button
              className="p-1 hover:bg-gray-100 rounded-full"
              onClick={() => {
                const audio = new Audio(audioUrl);
                audio.play();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <p className="text-sm">{text}</p>
        </div>
        {!isUser && (
          <p className="text-xs text-gray-500 mt-1">{translation}</p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;