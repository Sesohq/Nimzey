import { Button } from '@/components/ui/button';

interface HeaderProps {
  onNewProject: () => void;
  onExportImage: () => void;
}

export default function Header({ onNewProject, onExportImage }: HeaderProps) {
  return (
    <header className="bg-darkBg text-white p-3 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <h1 className="text-xl font-bold">FilterKit</h1>
        <span className="ml-2 text-sm text-gray-400">Node-Based Image Filters</span>
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
        <Button 
          size="sm" 
          variant="secondary"
          onClick={onExportImage}
        >
          Export Image
        </Button>
      </div>
    </header>
  );
}
