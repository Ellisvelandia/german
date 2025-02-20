
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatInterface from './components/ChatInterface';
import ScenarioSelector from './components/ScenarioSelector';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<ScenarioSelector />} />
          <Route path="/restaurant" element={<ChatInterface scenario="restaurant" />} />
          <Route path="/shopping" element={<ChatInterface scenario="supermarket" />} />
          <Route path="/train" element={<ChatInterface scenario="train station" />} />
          <Route path="/conversation" element={<ChatInterface scenario="free conversation" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
