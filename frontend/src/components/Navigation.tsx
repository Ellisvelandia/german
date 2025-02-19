import { Link } from 'react-router-dom';

interface NavigationProps {
  selectedScenario: string;
  setSelectedScenario: (scenario: string) => void;
}

const Navigation = ({ selectedScenario, setSelectedScenario }: NavigationProps) => {
  return (
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
  );
};

export default Navigation;