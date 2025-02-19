
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function App() {
  const [selectedScenario, setSelectedScenario] = useState('restaurant');

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-800">Lex AI</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className={`${selectedScenario === 'restaurant' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    onClick={() => setSelectedScenario('restaurant')}
                  >
                    Restaurant
                  </Link>
                  <Link
                    to="/shopping"
                    className={`${selectedScenario === 'shopping' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    onClick={() => setSelectedScenario('shopping')}
                  >
                    Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
              <Routes>
                <Route path="/" element={<ChatInterface scenario="restaurant" />} />
                <Route path="/shopping" element={<ChatInterface scenario="supermarket" />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
}

import { useRef } from 'react';
import { apiService } from './services/api';
import ChatMessage from './components/ChatMessage';

interface Message {
  text: string;
  translation?: string;
  audioUrl?: string;
  isUser: boolean;
}

function ChatInterface({ scenario }: { scenario: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = { text: inputText, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      const response = await apiService.sendMessage(scenario, inputText);
      const botMessage: Message = {
        text: response.text,
        translation: response.translation,
        audioUrl: `data:audio/mp3;base64,${response.audio}`,
        isUser: false
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const response = await apiService.sendAudio(scenario, audioBlob);
          const botMessage: Message = {
            text: response.text,
            translation: response.translation,
            audioUrl: `data:audio/mp3;base64,${response.audio}`,
            isUser: false
          };
          setMessages(prev => [...prev, botMessage]);
        } catch (error) {
          console.error('Error sending audio:', error);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            text={message.text}
            translation={message.translation || ''}
            audioUrl={message.audioUrl}
            isUser={message.isUser}
          />
        ))}
      </div>
      <div className="flex items-center space-x-4">
        <button
          className={`p-2 ${isRecording ? 'bg-red-500' : 'bg-blue-500'} text-white rounded-full hover:opacity-80`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          <span className="sr-only">{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          onClick={handleSendMessage}
        >
          <span className="sr-only">Send</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default App;
