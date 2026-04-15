import { useState } from "react";
import { Sparkles, Zap, BarChart3, RefreshCw, BookOpen, Layout, Crosshair, TrendingUp, Palette, Quote, Clock, ChevronRight, ArrowRight, AlertCircle, Eye, LogIn, LogOut, History, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import nimzeyLogo from "@assets/Nimzrey_Text_Logo_1765844796791.png";
import UploadZone from "@/components/upload-zone";
import ReferenceCritiqueDisplay from "@/components/reference-critique-display";
import AnnotatedImage from "@/components/annotated-image";
import VisualAttentionHeatmap from "@/components/visual-attention-heatmap";
import InstantScores from "@/components/instant-scores";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { ReferenceCritiqueFeedback, DesignAnalysis } from "@shared/schema";

interface AnalysisResult {
  id: number;
  originalImageUrl: string;
  feedback: ReferenceCritiqueFeedback;
  referencesUsed: number;
  createdAt: string;
}

interface PastAnalysis {
  id: number;
  userId: string | null;
  originalImageUrl: string;
  revisedImageUrl: string | null;
  feedback: ReferenceCritiqueFeedback;
  createdAt: Date;
}

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'annotations' | 'heatmap'>('annotations');
  const [showPastReviews, setShowPastReviews] = useState(false);
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const { data: pastAnalyses, isLoading: pastLoading } = useQuery<PastAnalysis[]>({
    queryKey: ['/api/my-analyses'],
    enabled: isAuthenticated,
  });

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const handleAnalysisError = () => {
    setIsAnalyzing(false);
  };

  const handleTryAnother = () => {
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={nimzeyLogo} alt="Nimzey" className="h-8" />
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">Features</a>
              
              {isAuthenticated && (
                <button
                  onClick={() => setShowPastReviews(!showPastReviews)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-past-reviews"
                >
                  <History className="w-4 h-4" />
                  Past Reviews
                </button>
              )}
              
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {user?.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-orange-500" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground">{user?.firstName || 'User'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = '/api/logout'}
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => window.location.href = '/api/login'}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
                  data-testid="button-login"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>
      {/* Past Reviews Panel */}
      {showPastReviews && isAuthenticated && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowPastReviews(false)}>
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-background border-l border-white/10 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-background border-b border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <History className="w-5 h-5 text-orange-500" />
                  Past Reviews
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowPastReviews(false)}>
                  ✕
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {pastLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <span>Loading past reviews...</span>
                </div>
              ) : pastAnalyses && pastAnalyses.length > 0 ? (
                pastAnalyses.map((analysis) => (
                  <button
                    key={analysis.id}
                    onClick={() => {
                      setAnalysisResult({
                        id: analysis.id,
                        originalImageUrl: analysis.originalImageUrl,
                        feedback: analysis.feedback,
                        referencesUsed: 10,
                        createdAt: new Date(analysis.createdAt).toISOString()
                      });
                      setShowPastReviews(false);
                    }}
                    className="w-full text-left glass-subtle rounded-xl p-4 hover:bg-white/10 transition-colors"
                    data-testid={`past-review-${analysis.id}`}
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={analysis.originalImageUrl} 
                          alt="Design" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-orange-500">{analysis.feedback.score}/10</span>
                          {analysis.feedback.detectedGenre && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 truncate">
                              {analysis.feedback.detectedGenre}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {analysis.feedback.overallRead}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                  <History className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">No past reviews yet</p>
                  <p className="text-sm">Upload a design to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Hero Section - Only show when no analysis */}
      {!analysisResult && (
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-orange-500/15 to-transparent" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">AI-Powered Design Analysis</span>
            </div>

            <div className="flex justify-center mb-8">
              <div className="card">
                <div className="loader">
                  <span className="text-foreground font-poppins">Design</span>
                  <div className="words">
                    <span className="word">Feedback</span>
                    <span className="word">Analysis</span>
                    <span className="word">Insight</span>
                    <span className="word">Feedback</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Get instant, expert-level design critiques powered by AI. Upload your design and receive actionable feedback with visual annotations.
            </p>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Instant analysis</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>Reference-based critique</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4 text-orange-400" />
                <span>Visual heatmaps</span>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* Main Application */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {!analysisResult && (
          <div className="max-w-3xl mx-auto">
            <UploadZone 
              onAnalysisStart={() => setIsAnalyzing(true)}
              onAnalysisComplete={handleAnalysisComplete}
              onAnalysisError={handleAnalysisError}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}

        {analysisResult && (
          <div className="space-y-8">
            {/* Floating Analyze Another Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleTryAnother}
                variant="outline"
                size="sm"
                className="gap-2 glass"
                data-testid="button-analyze-another"
              >
                <RefreshCw className="w-4 h-4" />
                Analyze Another
              </Button>
            </div>

            {/* 1. Visual Analysis - 4 Pillars at VERY TOP */}
            {analysisResult.feedback.instantScores && (
              <InstantScores scores={analysisResult.feedback.instantScores} />
            )}

            {/* 2. Visual Analysis - Unified Image View + Issues Sidebar */}
            <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
              {/* Image Container with View Mode Toggle */}
              <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-xl">
                <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {viewMode === 'annotations' ? (
                      <>
                        <Eye className="w-4 h-4 text-orange-500" />
                        Annotated Design
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 text-orange-400" />
                        Visual Attention
                      </>
                    )}
                  </h3>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
                    <Button
                      variant={viewMode === 'annotations' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('annotations')}
                      className={`gap-2 ${viewMode === 'annotations' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                      data-testid="button-view-annotations"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Annotations
                    </Button>
                    <Button
                      variant={viewMode === 'heatmap' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('heatmap')}
                      className={`gap-2 ${viewMode === 'heatmap' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                      data-testid="button-view-heatmap"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Heatmap
                    </Button>
                  </div>
                </div>
                {viewMode === 'annotations' ? (
                  <AnnotatedImage
                    imageUrl={analysisResult.originalImageUrl}
                    annotations={analysisResult.feedback.annotations}
                    alt="Original design with visual annotations"
                  />
                ) : (
                  <VisualAttentionHeatmap
                    originalImageUrl={analysisResult.originalImageUrl}
                    heatmapUrl={analysisResult.feedback.heatmapData}
                    alt="Visual attention heatmap"
                  />
                )}
              </div>

              {/* Issues Breakdown Sidebar */}
              {analysisResult.feedback.annotations && analysisResult.feedback.annotations.length > 0 && (
                <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-xl h-fit lg:sticky lg:top-24">
                  <div className="p-4 border-b border-border bg-muted/30">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Issues Breakdown
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analysisResult.feedback.annotations.length} issue{analysisResult.feedback.annotations.length !== 1 ? 's' : ''} detected
                    </p>
                  </div>
                  <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                    {analysisResult.feedback.annotations.map((annotation, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer bg-slate-50 dark:bg-white/5 border border-transparent hover:bg-slate-100 dark:hover:bg-white/10 hover:border-orange-200 dark:hover:border-orange-500/30"
                        data-testid={`issue-item-${index}`}
                      >
                        <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{annotation.label}</p>
                          {annotation.elementTarget && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5 font-medium">→ {annotation.elementTarget}</p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5 leading-relaxed">{annotation.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Reference Critique Display */}
            <div className="max-w-4xl mx-auto">
              <ReferenceCritiqueDisplay 
                feedback={analysisResult.feedback}
                referencesUsed={analysisResult.referencesUsed}
              />
            </div>

            {/* 4. Expert Analysis - 4 Categories at BOTTOM */}
            {(analysisResult.feedback.layoutBalance || analysisResult.feedback.spacingDensity || 
              analysisResult.feedback.visualHierarchy || analysisResult.feedback.styleAlignment) && (
              <div className="max-w-4xl mx-auto rounded-2xl dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-6 backdrop-blur-sm bg-[#29282880]" data-testid="section-expert-analysis">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <Layout className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Expert Analysis</h4>
                    <p className="text-sm text-slate-500 dark:text-white/50">Four-pillar design critique</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {analysisResult.feedback.layoutBalance && (
                    <div className="group relative rounded-xl p-5 transition-all duration-300 hover:scale-[1.01] bg-orange-500/10 border border-slate-200 dark:border-white/5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Layout className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-slate-900 dark:text-white mb-2">Layout & Balance</h5>
                          <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{analysisResult.feedback.layoutBalance}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analysisResult.feedback.spacingDensity && (
                    <div className="group relative rounded-xl p-5 transition-all duration-300 hover:scale-[1.01] bg-orange-500/10 border border-slate-200 dark:border-white/5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Crosshair className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-slate-900 dark:text-white mb-2">Spacing & Density</h5>
                          <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{analysisResult.feedback.spacingDensity}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analysisResult.feedback.visualHierarchy && (
                    <div className="group relative rounded-xl p-5 transition-all duration-300 hover:scale-[1.01] bg-amber-500/10 border border-slate-200 dark:border-white/5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-slate-900 dark:text-white mb-2">Visual Hierarchy</h5>
                          <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{analysisResult.feedback.visualHierarchy}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analysisResult.feedback.styleAlignment && (
                    <div className="group relative rounded-xl p-5 transition-all duration-300 hover:scale-[1.01] bg-amber-500/10 border border-slate-200 dark:border-white/5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Palette className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-slate-900 dark:text-white mb-2">Style Alignment</h5>
                          <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{analysisResult.feedback.styleAlignment}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. Quick Wins / Top Fixes */}
            {analysisResult.feedback.topFixes && analysisResult.feedback.topFixes.length > 0 && (
              <div className="max-w-4xl mx-auto rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-6 backdrop-blur-sm" data-testid="section-quick-wins">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Quick Wins</h4>
                      <p className="text-sm text-slate-500 dark:text-white/50">High-impact improvements</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">15-30 min</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {analysisResult.feedback.topFixes.map((item, index) => (
                    <div 
                      key={index} 
                      className="group relative rounded-xl bg-gradient-to-r from-slate-50 to-transparent dark:from-white/5 dark:to-transparent p-5 border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-300"
                      data-testid={`action-plan-item-${index}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                          <span className="text-sm font-bold text-white">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed mb-3">
                            {item.fix}
                          </p>
                          {(item.element || item.measurement || item.impact) && (
                            <div className="flex flex-wrap gap-2">
                              {item.element && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  {item.element}
                                </span>
                              )}
                              {item.measurement && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                  {item.measurement}
                                </span>
                              )}
                              {item.impact && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <ArrowRight className="w-3 h-3" />
                                  {item.impact}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-white/20 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Advisor Note */}
            {analysisResult.feedback.advisorNote && (
              <div 
                className="max-w-4xl mx-auto relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 p-6"
                data-testid="advisor-note-section"
              >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Quote className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">If This Were My Design...</h4>
                      <p className="text-sm text-white/60">Personal creative direction</p>
                    </div>
                  </div>
                  <p className="text-white/90 leading-relaxed italic pl-4 border-l-2 border-white/30" data-testid="advisor-note-content">
                    "{analysisResult.feedback.advisorNote}"
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features Section */}
        {!analysisResult && (
          <section id="features" className="mt-32 py-16">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Why Nimzey</span>
              </div>
              <h3 className="text-4xl font-bold text-foreground mb-4">
                Design feedback that actually helps
              </h3>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Stop guessing. Get actionable, expert-level feedback that transforms your designs.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-orange-500/5 to-orange-600/5 border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/25">
                    <BookOpen className="text-white w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-3">Reference-Based Critique</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Your design is compared against curated professional references for meaningful, contextual feedback.
                  </p>
                </div>
              </div>

              <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/25">
                    <Eye className="text-white w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-3">Visual Attention Maps</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    See exactly where viewers look first with professional eye-tracking style heatmaps.
                  </p>
                </div>
              </div>

              <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-green-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25">
                    <Zap className="text-white w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-3">Actionable Fixes</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Get specific, measurable improvements with clear what works, what weakens, and what to test next.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      {/* Footer */}
      <footer className="relative border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <img src={nimzeyLogo} alt="Nimzey" className="h-6" />
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2024 Nimzey. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
