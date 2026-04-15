import { 
  Layout, 
  Sparkles, 
  Type, 
  Palette, 
  Target, 
  Users, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Lightbulb,
  Crosshair,
  ArrowRight,
  Quote,
  TrendingUp,
  Clock,
  ChevronRight
} from "lucide-react";
import type { DesignFeedback } from "@shared/schema";
import InstantScores from "./instant-scores";

interface FeedbackDisplayProps {
  feedback: DesignFeedback;
}

const designTypeLabels: Record<string, string> = {
  collage_composite: "Collage / Composite",
  clean_minimal: "Clean / Minimal",
  photographic_editorial: "Photographic / Editorial",
  graphic_illustrative: "Graphic / Illustrative",
  mixed_hybrid: "Mixed / Hybrid"
};

const designTypeEmoji: Record<string, string> = {
  collage_composite: "🎨",
  clean_minimal: "✨",
  photographic_editorial: "📸",
  graphic_illustrative: "🖌️",
  mixed_hybrid: "🔀"
};

export default function FeedbackDisplay({ feedback }: FeedbackDisplayProps) {
  const categories = [
    {
      title: "Layout & Balance",
      content: feedback.layoutBalance,
      icon: Layout,
      gradient: "from-orange-500 to-orange-600",
      bgGlow: "bg-orange-500/10",
    },
    {
      title: "Spacing & Density", 
      content: feedback.spacingDensity,
      icon: Crosshair,
      gradient: "from-orange-500 to-amber-600",
      bgGlow: "bg-orange-500/10",
    },
    {
      title: "Visual Hierarchy",
      content: feedback.visualHierarchy,
      icon: TrendingUp,
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/10",
    },
    {
      title: "Style Alignment",
      content: feedback.styleAlignment,
      icon: Palette,
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/10",
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return "from-emerald-400 to-green-500";
    if (score >= 6) return "from-amber-400 to-yellow-500";
    if (score >= 4) return "from-orange-400 to-red-500";
    return "from-red-400 to-rose-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "Exceptional";
    if (score >= 8) return "Excellent";
    if (score >= 7) return "Good";
    if (score >= 6) return "Above Average";
    if (score >= 5) return "Average";
    if (score >= 4) return "Below Average";
    if (score >= 3) return "Needs Work";
    if (score >= 2) return "Poor";
    return "Critical Issues";
  };

  return (
    <div className="space-y-6">
      {/* Hero Score Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-600/20 via-transparent to-transparent" />
        
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-4">
            <div className={`text-7xl font-black bg-gradient-to-r ${getScoreColor(feedback.scoreCalculation.finalScore)} bg-clip-text text-transparent drop-shadow-lg`}>
              {feedback.scoreCalculation.finalScore}
              <span className="text-3xl text-white/40">/10</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 mb-4">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-white">
              {getScoreLabel(feedback.scoreCalculation.finalScore)}
            </span>
          </div>
          <p className="text-sm text-white/60 max-w-lg leading-relaxed">
            {feedback.scoreCalculation.reasoning}
          </p>
        </div>
      </div>

      {/* Design Classification & Context */}
      {feedback.classification && (
        <div className="rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-6 backdrop-blur-sm" data-testid="section-design-classification">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{designTypeEmoji[feedback.classification.designType] || "🎯"}</span>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-white/50">Design Type</span>
                <p className="font-semibold text-slate-900 dark:text-white" data-testid="design-type-label">
                  {designTypeLabels[feedback.classification.designType] || feedback.classification.designType}
                </p>
              </div>
            </div>
            {feedback.classification.confidence >= 70 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {feedback.classification.confidence}% match
                </span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed mb-4">
            {feedback.classification.justification}
          </p>
          
          {/* Audience Context Pills */}
          {feedback.classification?.audienceContext && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
              {feedback.classification.audienceContext.platform && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Target className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-blue-600/60 dark:text-blue-400/60">Platform</span>
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300" data-testid="audience-platform">
                      {feedback.classification.audienceContext.platform}
                    </p>
                  </div>
                </div>
              )}
              {feedback.classification.audienceContext.audience && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-600/60 dark:text-emerald-400/60">Audience</span>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300" data-testid="audience-target">
                      {feedback.classification.audienceContext.audience}
                    </p>
                  </div>
                </div>
              )}
              {feedback.classification.audienceContext.objective && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-amber-600/60 dark:text-amber-400/60">Objective</span>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300" data-testid="audience-objective">
                      {feedback.classification.audienceContext.objective}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Stylistic Choices */}
          {feedback.classification.stylisticChoices && feedback.classification.stylisticChoices.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Stylistic Choices Detected</span>
              </div>
              <div className="space-y-2">
                {feedback.classification.stylisticChoices.map((choice, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                    {choice.strengthensDesign ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{choice.choice}</span>
                      <span className="text-sm text-slate-500 dark:text-white/50">
                        {" "}— {choice.intentional ? "Intentional" : "Possibly unintentional"}
                      </span>
                      {choice.alternativeApproach && (
                        <p className="text-xs text-slate-500 dark:text-white/40 mt-1 italic">
                          💡 {choice.alternativeApproach}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instant Visual Scores */}
      {feedback.instantScores && <InstantScores scores={feedback.instantScores} />}

      {/* Expert Critique Grid */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-6 backdrop-blur-sm" data-testid="section-expert-analysis">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Type className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Expert Analysis</h4>
            <p className="text-sm text-slate-500 dark:text-white/50">Four-pillar design critique</p>
          </div>
        </div>

        <div className="grid gap-4">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div 
                key={index} 
                className={`group relative rounded-xl p-5 transition-all duration-300 hover:scale-[1.01] ${category.bgGlow} border border-slate-200 dark:border-white/5`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-slate-900 dark:text-white mb-2">{category.title}</h5>
                    <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{category.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Concept Intent */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-white/10 p-6" data-testid="section-concept-intent">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Crosshair className="w-4 h-4 text-orange-500" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">Concept & Intent</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">
          {feedback.conceptIntent}
        </p>
      </div>

      {/* Top 3 Fixes - Action Plan */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-6 backdrop-blur-sm" data-testid="section-quick-wins">
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
          {feedback.topFixes.map((item, index) => (
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" data-testid={`action-element-${index}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {item.element}
                        </span>
                      )}
                      {item.measurement && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20" data-testid={`action-measurement-${index}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          {item.measurement}
                        </span>
                      )}
                      {item.impact && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" data-testid={`action-impact-${index}`}>
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

      {/* Advisor Note */}
      {feedback.advisorNote && (
        <div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 p-6"
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
              "{feedback.advisorNote}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
