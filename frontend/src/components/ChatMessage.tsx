import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface ChatMessageProps {
  text: string;
  translation: string;
  audioUrl?: string;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let isCurrentAudio = true;

    const playAudio = async () => {
      if (!audioUrl || !audioRef.current || isUser) {
        console.log("Skipping auto-play: No audio URL, ref, or user message");
        return;
      }

      console.log("Attempting to play audio with URL:", audioUrl); // Log URL for debugging

      try {
        audioRef.current.src = audioUrl;
        await audioRef.current.load();

        if (isCurrentAudio) {
          await audioRef.current.play();
          setIsPlaying(true);
          console.log("Audio playback started successfully");
        }
      } catch (error) {
        console.error("Error auto-playing audio:", error);
        if (isCurrentAudio) {
          setIsPlaying(false);
        }
      }
    };

    playAudio();

    return () => {
      isCurrentAudio = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [audioUrl, isUser]);

  const handlePlayAudio = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          await audioRef.current.pause();
          console.log("Audio paused");
        } else {
          await audioRef.current.play();
          console.log("Audio played manually");
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error("Error playing/pausing audio:", error);
        setIsPlaying(false); // Reset on error
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    console.log("Audio playback ended");
  };

  const handleAudioError = (event: Event) => {
    const audioElement = event.target as HTMLAudioElement;
    const error = audioElement.error;
    if (error) {
      console.error("Audio playback error code:", error.code);
      console.error("Audio playback error message:", error.message);
      switch (error.code) {
        case 1:
          console.error("Cause: Audio playback was aborted.");
          break;
        case 2:
          console.error("Cause: Network error while loading audio.");
          alert("Network issue: Could not load audio. Check your connection.");
          break;
        case 3:
          console.error("Cause: Error decoding the audio file.");
          alert("Audio file error: The file may be corrupted or unsupported.");
          break;
        case 4:
          console.error("Cause: Audio source not supported or invalid URL.");
          alert("Invalid audio: The URL may be incorrect or inaccessible.");
          break;
        default:
          console.error("Cause: Unknown audio error.");
      }
    } else {
      console.error(
        "Audio playback error (no error details available):",
        event
      );
    }
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
              {cleanText(text)}
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
                {cleanText(text)}
              </p>
              {audioUrl && (
                <button
                  onClick={handlePlayAudio}
                  className="flex-shrink-0 flex items-center justify-center p-1.5 sm:p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors ml-2"
                  title="Play pronunciation"
                  disabled={!audioUrl} // Disable if no URL
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
                onError={(e: React.SyntheticEvent<HTMLAudioElement, Event>) =>
                  handleAudioError(e.nativeEvent)
                }
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
