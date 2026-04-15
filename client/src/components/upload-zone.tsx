import { useState, useRef } from "react";
import { CloudUpload, X, Sparkles, Target, Zap, FileImage, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DesignPurpose, PrimaryGoal } from "@shared/schema";

interface UploadZoneProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: any) => void;
  onAnalysisError: () => void;
  onFileSelected?: (file: File) => void;
  isAnalyzing: boolean;
}

const PURPOSE_OPTIONS: { value: DesignPurpose; label: string; description: string; icon: string }[] = [
  { value: "email_marketing", label: "Email Marketing", description: "Newsletter, promo email, drip campaign", icon: "📧" },
  { value: "paid_social_ad", label: "Paid Social Ad", description: "Facebook, Instagram, TikTok ads", icon: "📱" },
  { value: "landing_page", label: "Landing Page", description: "Hero section, conversion page", icon: "🌐" },
  { value: "brand_awareness", label: "Brand / Awareness", description: "Brand campaign, awareness piece", icon: "✨" },
  { value: "poster_print", label: "Poster / Print", description: "Physical posters, flyers, billboards", icon: "🖼️" },
  { value: "portfolio_piece", label: "Portfolio Piece", description: "Personal project, creative exploration", icon: "💼" },
  { value: "ui_design", label: "UI Design", description: "App interface, dashboard, web UI", icon: "💻" },
  { value: "other", label: "Other", description: "General design feedback", icon: "🎯" },
];

const GOAL_OPTIONS: { value: PrimaryGoal; label: string; description: string; icon: string }[] = [
  { value: "click_through", label: "Click-through", description: "Get users to click", icon: "👆" },
  { value: "conversion", label: "Conversion", description: "Drive purchases or signups", icon: "💰" },
  { value: "brand_perception", label: "Brand Perception", description: "Build brand image", icon: "🏆" },
  { value: "visual_exploration", label: "Visual Exploration", description: "Creative experimentation", icon: "🎨" },
  { value: "information_delivery", label: "Information Delivery", description: "Communicate information clearly", icon: "📊" },
  { value: "engagement", label: "Engagement", description: "Likes, shares, comments", icon: "❤️" },
];

export default function UploadZone({ onAnalysisStart, onAnalysisComplete, onAnalysisError, onFileSelected, isAnalyzing }: UploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [designPurpose, setDesignPurpose] = useState<DesignPurpose | null>(null);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG, JPG, JPEG, or WebP image.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onFileSelected?.(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    if (!designPurpose || !primaryGoal) {
      toast({
        title: "Please select design context",
        description: "Tell us what this design is for so we can give relevant feedback.",
        variant: "destructive",
      });
      return;
    }

    onAnalysisStart();

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('designPurpose', designPurpose);
      formData.append('primaryGoal', primaryGoal);

      const response = await apiRequest('POST', '/api/analyze-design', formData);
      const result = await response.json();

      onAnalysisComplete(result);
      
      toast({
        title: "Analysis complete!",
        description: "Your design has been analyzed successfully.",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      onAnalysisError();
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze design. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-8 backdrop-blur-sm shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 mb-4 shadow-lg shadow-orange-500/25">
            <CloudUpload className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Upload Your Design</h3>
          <p className="text-slate-600 dark:text-white/60">Drag and drop your image or click to browse</p>
        </div>

        {!selectedFile && (
          <div
            className={`relative group border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
              isDragOver
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                : 'border-slate-300 dark:border-white/20 hover:border-orange-400 dark:hover:border-orange-500/50 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isDragOver 
                  ? 'bg-orange-100 dark:bg-orange-500/20' 
                  : 'bg-slate-100 dark:bg-white/5 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20'
              }`}>
                <FileImage className={`w-10 h-10 transition-colors duration-300 ${
                  isDragOver 
                    ? 'text-orange-500' 
                    : 'text-slate-400 group-hover:text-orange-500'
                }`} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800 dark:text-white">Drop your design here</p>
                <p className="text-sm text-slate-500 dark:text-white/50 mt-1">PNG, JPG, JPEG, WebP up to 10MB</p>
              </div>
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 gap-2" data-testid="button-choose-file">
                Choose File
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {selectedFile && !isAnalyzing && (
          <div className="space-y-6">
            {/* File Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/10 border border-slate-200 dark:border-white/10">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-white/10 flex-shrink-0 ring-2 ring-orange-500/20">
                {previewUrl && (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{selectedFile.name}</p>
                <p className="text-sm text-slate-500 dark:text-white/50">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"
                data-testid="button-remove-file"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Intent Selector */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/30 dark:from-slate-800/50 dark:via-orange-900/20 dark:to-amber-900/20 p-6 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Tell us about your design</h4>
                  <p className="text-sm text-slate-500 dark:text-white/50">Get context-aware feedback, not generic advice</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-white/70">What is this design for?</label>
                  <Select value={designPurpose || ""} onValueChange={(value) => setDesignPurpose(value as DesignPurpose)}>
                    <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10" data-testid="select-design-purpose">
                      <SelectValue placeholder="Select design type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PURPOSE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} data-testid={`option-purpose-${option.value}`}>
                          <div className="flex items-center gap-2">
                            <span>{option.icon}</span>
                            <span className="font-medium">{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-white/70">Primary goal?</label>
                  <Select value={primaryGoal || ""} onValueChange={(value) => setPrimaryGoal(value as PrimaryGoal)}>
                    <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10" data-testid="select-primary-goal">
                      <SelectValue placeholder="Select goal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} data-testid={`option-goal-${option.value}`}>
                          <div className="flex items-center gap-2">
                            <span>{option.icon}</span>
                            <span className="font-medium">{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {designPurpose && primaryGoal && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <Zap className="w-4 h-4" />
                    <span>
                      <strong>Context set:</strong> Analyzing as a {PURPOSE_OPTIONS.find(p => p.value === designPurpose)?.label} optimized for {GOAL_OPTIONS.find(g => g.value === primaryGoal)?.label.toLowerCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            <div className="text-center pt-2">
              <Button 
                onClick={handleAnalyze}
                disabled={!designPurpose || !primaryGoal}
                className="btn-premium px-10 py-6 text-lg gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                data-testid="button-analyze-design"
              >
                <Sparkles className="w-5 h-5" />
                Analyze Design
                <ArrowRight className="w-5 h-5" />
              </Button>
              {(!designPurpose || !primaryGoal) && (
                <p className="text-xs text-slate-500 dark:text-white/40 mt-3">Select design type and goal to continue</p>
              )}
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-16">
            <div className="flex justify-center mb-8">
              <div className="spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-slate-900 dark:text-white">Analyzing your design...</p>
              <p className="text-slate-500 dark:text-white/50">Our AI is examining layout, color, typography, and hierarchy</p>
            </div>
            <div className="mt-8 flex justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
