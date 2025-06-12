import { Button } from '@/components/ui/button';
import nimzeyLogo from '@/assets/nimzey-logo.png';

interface HeaderProps {
  onNewProject: () => void;
}

export default function Header({ onNewProject }: HeaderProps) {
  return (
    <header className="bg-darkBg text-white p-3 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <img src={nimzeyLogo} alt="NIMZEY" className="h-8 w-8 mr-3" />
        <h1 className="text-xl font-bold">NIMZEY</h1>
        <span className="ml-2 text-sm text-gray-400">Inspiration App</span>
      </div>
      <div className="flex space-x-4">
        <Button 
          size="sm" 
          variant="default" 
          className="bg-primary hover:bg-primary/90"
          onClick={onNewProject}
        >
          New Project
        </Button>

      </div>
    </header>
  );
}
