import React, { useState } from 'react';
import { FaShoppingCart, FaUtensils, FaTrain, FaComments } from 'react-icons/fa';
import { startConversationWithText } from '../../services/apiService';
import RolePlayPage from '../RolePlayPage/RolePlayPage';
import Button from '../common/Button';
import Icon from '../common/Icon';
import './ScenarioSelector.css';

const ScenarioSelector = () => {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [audioSrc, setAudioSrc] = useState(null);
  const [germanText, setGermanText] = useState('');
  const [englishText, setEnglishText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRolePlayPage, setShowRolePlayPage] = useState(false);

  const scenarios = [
    { name: 'supermarket', icon: <FaShoppingCart /> },
    { name: 'restaurant', icon: <FaUtensils /> },
    { name: 'train station', icon: <FaTrain /> },
    { name: 'free conversation', icon: <FaComments /> },
  ];

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);
  };

  const handleStartRolePlay = async () => {
    if (!selectedScenario) {
      alert('Please select a scenario first.');
      return;
    }

    setIsLoading(true);

    try {
      // Get audio and texts from the API
      const { audio, germanText, englishText } = await startConversationWithText(selectedScenario);
      const audioUrl = URL.createObjectURL(audio);

      // Store texts in state
      setAudioSrc(audioUrl);
      setGermanText(germanText);
      setEnglishText(englishText);

      setShowRolePlayPage(true);
    } catch (error) {
      console.error('Error starting role play:', error);
      alert('Failed to start role play. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="scenario-selector">
      <div>
        <img src="/logo.png" alt="Logo" className="logo" />
      </div>
      <h2>Choose your scenario</h2>
      <div className="scenario-buttons">
        {scenarios.map((scenario, index) => (
          <Button
            key={index}
            className={`scenario-button ${selectedScenario === scenario.name ? 'selected' : ''}`}
            onClick={() => handleScenarioSelect(scenario.name)}
          >
            <Icon icon={scenario.icon} color={selectedScenario === scenario.name ? '#FF4081' : '#007bff'} />
            <span>{scenario.name}</span>
          </Button>
        ))}
      </div>

      <Button className="start-button" onClick={handleStartRolePlay} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Start Role-play'}
      </Button>

      {showRolePlayPage && (
        <RolePlayPage
          selectedScenario={selectedScenario}
          audioSrc={audioSrc}
          german={germanText}
          english={englishText}
        />
      )}
    </div>
  );
};

export default ScenarioSelector;
