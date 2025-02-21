import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, ShoppingCart, Train, MessageCircle } from 'lucide-react';

import { ReactNode } from 'react';

interface Scenario {
  id: string;
  name: string;
  icon: ReactNode;
  description: string;
  route: string;
}

const scenarios: Scenario[] = [
  {
    id: 'restaurant',
    name: 'Restaurante',
    icon: <Utensils className="h-8 w-8" />,
    description: 'Pratique fazer pedidos em português em um restaurante brasileiro',
    route: '/restaurant'
  },
  {
    id: 'supermarket',
    name: 'Supermercado',
    icon: <ShoppingCart className="h-8 w-8" />,
    description: 'Aprenda a fazer compras em português no supermercado',
    route: '/shopping'
  },
  {
    id: 'train',
    name: 'Estação de Trem',
    icon: <Train className="h-8 w-8" />,
    description: 'Navegue pelo transporte público em português',
    route: '/train'
  },
  {
    id: 'conversation',
    name: 'Conversa Livre',
    icon: <MessageCircle className="h-8 w-8" />,
    description: 'Pratique português em uma conversa aberta',
    route: '/conversation'
  }
];

const ScenarioSelector = () => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleScenarioSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario.id);
    navigate(scenario.route);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Escolha Seu Cenário de Aprendizado</h1>
          <p className="text-xl text-gray-600">Selecione um ambiente para praticar suas habilidades de conversação em português</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => handleScenarioSelect(scenario)}
              className={`${selectedScenario === scenario.id ? 'ring-2 ring-blue-500' : ''} 
                p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200
                flex flex-col items-center text-center cursor-pointer w-full border border-gray-200
                hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <div className={`${selectedScenario === scenario.id ? 'text-blue-500' : 'text-gray-600'} 
                mb-4 transition-colors duration-200`}>
                {scenario.icon}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{scenario.name}</h3>
              <p className="text-gray-500">{scenario.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScenarioSelector;
