
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ChatInterface from './components/ChatInterface';

function App() {
  const [selectedScenario, setSelectedScenario] = useState('restaurant');

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navigation
          selectedScenario={selectedScenario}
          setSelectedScenario={setSelectedScenario}
        />
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

export default App;
