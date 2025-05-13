import { Button } from '@/components/ui/button';

interface NodeControlsProps {
  onRemoveNode?: () => void;
  onMinimizeNode?: () => void;
}

export default function NodeControls({ onRemoveNode, onMinimizeNode }: NodeControlsProps) {
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveNode) {
      onRemoveNode();
    }
  };

  const handleMinimizeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMinimizeNode) {
      onMinimizeNode();
    }
  };

  return (
    <div className="flex space-x-1 absolute top-1 right-1">
      <Button 
        size="icon" 
        variant="ghost" 
        className="w-5 h-5 p-0 hover:bg-purple-700 rounded"
        onClick={handleMinimizeClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      </Button>
    </div>
  );
}
