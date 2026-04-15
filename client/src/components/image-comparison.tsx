import { Check } from "lucide-react";

interface ImageComparisonProps {
  title: string;
  imageUrl: string;
  icon: React.ReactNode;
  improvements?: string[];
}

export default function ImageComparison({ 
  title, 
  imageUrl, 
  icon, 
  improvements 
}: ImageComparisonProps) {
  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
      <h4 className="text-xl font-semibold text-foreground mb-4 flex items-center space-x-2">
        {icon}
        <span>{title}</span>
      </h4>
      
      <div className="bg-muted rounded-xl p-4 mb-4">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-auto rounded-lg shadow-sm max-h-96 object-contain mx-auto"
        />
      </div>

      {improvements && (
        <div className="p-4 bg-accent/10 rounded-xl">
          <h5 className="font-semibold text-foreground mb-3">Key Improvements Made</h5>
          <ul className="space-y-2">
            {improvements.map((improvement, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <Check className="text-accent w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
