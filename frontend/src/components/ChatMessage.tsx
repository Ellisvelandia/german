import React from "react";

interface ChatMessageProps {
  text: string;
  translation: string;
  audioUrl?: string;
  isUser: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  text,
  translation,
  audioUrl,
  isUser,
}) => {
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
            {audioUrl && <audio src={audioUrl} autoPlay className="hidden" />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
