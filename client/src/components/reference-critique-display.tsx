import { CheckCircle, AlertTriangle, Lightbulb, BookOpen, Star, Tag } from "lucide-react";
import type { ReferenceCritiqueFeedback } from "@shared/schema";

interface ReferenceCritiqueDisplayProps {
  feedback: ReferenceCritiqueFeedback;
  referencesUsed: number;
}

export default function ReferenceCritiqueDisplay({ feedback, referencesUsed }: ReferenceCritiqueDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-500";
    if (score >= 6) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 8) return "from-emerald-500 to-green-600";
    if (score >= 6) return "from-amber-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  return (
    <div className="space-y-6" data-testid="reference-critique-display">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
          <BookOpen className="text-white w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Reference-Based Critique</h3>
          <p className="text-sm text-muted-foreground">Compared against {referencesUsed} curated poster references</p>
        </div>
      </div>

      {feedback.detectedGenre && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20" data-testid="detected-genre">
          <Tag className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-500">Detected Style: {feedback.detectedGenre}</span>
          {feedback.genreNote && (
            <span className="text-sm text-muted-foreground ml-2">— {feedback.genreNote}</span>
          )}
        </div>
      )}

      <div className="glass-subtle rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Overall Read</h4>
            <p className="text-lg text-foreground leading-relaxed" data-testid="text-overall-read">{feedback.overallRead}</p>
          </div>
          <div className="ml-6 flex flex-col items-center">
            <div className={`text-4xl font-bold bg-gradient-to-r ${getScoreGradient(feedback.score)} bg-clip-text text-transparent`} data-testid="text-score">
              {feedback.score}
            </div>
            <div className="text-sm text-muted-foreground">/10</div>
          </div>
        </div>
        <div className="pt-4 border-t border-white/10">
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-score-reasoning">
            {feedback.scoreReasoning}
          </p>
        </div>
      </div>

      <div className="glass-subtle rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-emerald-500 mb-4">
          <CheckCircle className="w-5 h-5" />
          <h4 className="font-semibold">What Works</h4>
        </div>
        <ul className="space-y-3" data-testid="list-what-works">
          {feedback.whatWorks.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
              <span className="text-foreground leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-subtle rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-amber-500 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <h4 className="font-semibold">What Weakens the Poster</h4>
        </div>
        <ul className="space-y-3" data-testid="list-what-weakens">
          {feedback.whatWeakens.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
              <span className="text-foreground leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-subtle rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-orange-500 mb-4">
          <Lightbulb className="w-5 h-5" />
          <h4 className="font-semibold">What I'd Test Next</h4>
        </div>
        <ul className="space-y-3" data-testid="list-what-to-test">
          {feedback.whatToTestNext.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
              <span className="text-foreground leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {feedback.comparisonNotes && (
        <div className="glass-subtle rounded-2xl p-6">
          <div className="flex items-center gap-2 text-orange-500 mb-4">
            <Star className="w-5 h-5" />
            <h4 className="font-semibold">Reference Comparison</h4>
          </div>
          <p className="text-muted-foreground leading-relaxed" data-testid="text-comparison-notes">
            {feedback.comparisonNotes}
          </p>
        </div>
      )}
    </div>
  );
}
