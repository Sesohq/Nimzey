import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InstantVisualScoresSchema, ScoreReasonSchema } from "@shared/schema";
import type { z } from "zod";

type InstantScores = z.infer<typeof InstantVisualScoresSchema>;
type ScoreReason = z.infer<typeof ScoreReasonSchema>;

interface ScoreCircleProps {
  score: number;
  label: string;
  tips: string;
  reasons?: ScoreReason[];
  icon: string;
  gradient: string;
}

function ScoreCircle({ score, label, tips, reasons, icon, gradient }: ScoreCircleProps) {
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { text: "Excellent", color: "text-emerald-400" };
    if (score >= 60) return { text: "Good", color: "text-amber-400" };
    if (score >= 40) return { text: "Fair", color: "text-orange-400" };
    return { text: "Needs Work", color: "text-red-400" };
  };

  const status = getScoreStatus(score);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button 
            className="group relative flex flex-col items-center cursor-pointer focus:outline-none"
            data-testid={`score-card-${label.toLowerCase()}`}
            aria-label={`${label} score: ${score} out of 99. ${tips}`}
          >
            <div className="relative">
              <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-white/10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(255,90,30,0.5)]"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF5A1E" />
                    <stop offset="50%" stopColor="#FF8C3C" />
                    <stop offset="100%" stopColor="#FFA726" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white tracking-tight">{score}</span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="text-sm font-semibold text-white/90 tracking-wide">{label}</span>
              <p className={`text-xs font-medium ${status.color}`}>{status.text}</p>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-sm p-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl"
          data-testid={`score-tooltip-${label.toLowerCase()}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{icon}</span>
            <span className="font-semibold text-white">{label}</span>
            <span className={`ml-auto text-sm font-bold ${status.color}`}>{score}/99</span>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">{tips}</p>
          {reasons && reasons.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Key factors</p>
              <ul className="space-y-1.5">
                {reasons.map((reason, idx) => (
                  <li key={idx} className="text-xs text-white/80 flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">→</span>
                    <span>
                      {reason.element && <strong className="text-white">{reason.element}:</strong>} {reason.reason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface InstantScoresProps {
  scores: InstantScores;
}

export default function InstantScores({ scores }: InstantScoresProps) {
  const scoreConfig = [
    { key: 'layout', label: 'Layout', icon: '📐', gradient: 'from-orange-500 to-orange-600' },
    { key: 'aesthetics', label: 'Aesthetics', icon: '✨', gradient: 'from-orange-400 to-orange-500' },
    { key: 'copy', label: 'Copy', icon: '📝', gradient: 'from-orange-500 to-amber-500' },
    { key: 'color', label: 'Color', icon: '🎨', gradient: 'from-amber-500 to-orange-600' },
  ];

  const avgScore = Math.round(
    (scores.layout.score + scores.aesthetics.score + scores.copy.score + scores.color.score) / 4
  );

  return (
    <div 
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-8"
      data-testid="instant-scores-container"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-600/20 via-transparent to-transparent bg-[#0f0f0f]" />
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Visual Analysis</h3>
            <p className="text-sm text-white/50 mt-1">Instant design breakdown</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="text-sm text-white/60">Overall</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              {avgScore}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {scoreConfig.map((config) => {
            const scoreData = scores[config.key as keyof InstantScores];
            return (
              <ScoreCircle
                key={config.key}
                score={scoreData.score}
                label={config.label}
                tips={scoreData.tips}
                reasons={scoreData.reasons}
                icon={config.icon}
                gradient={config.gradient}
              />
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-center text-white/40">
            Hover over each score for detailed breakdown and improvement tips
          </p>
        </div>
      </div>
    </div>
  );
}
