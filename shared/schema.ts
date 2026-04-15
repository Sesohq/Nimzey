import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const designAnalyses = pgTable("design_analyses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  originalImageUrl: text("original_image_url").notNull(),
  revisedImageUrl: text("revised_image_url"),
  feedback: text("feedback").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDesignAnalysisSchema = createInsertSchema(designAnalyses).omit({
  id: true,
  createdAt: true,
});

export type DesignAnalysis = typeof designAnalyses.$inferSelect;
export type InsertDesignAnalysis = z.infer<typeof insertDesignAnalysisSchema>;

// API response types
export const AnnotationSchema = z.object({
  label: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  description: z.string(),
  cause: z.string().optional(),
  effect: z.string().optional(),
  elementTarget: z.string().optional(), // Specific element being annotated
  quadrant: z.string().optional() // Which quadrant the element is in
});

export const TutorialSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  channelTitle: z.string(),
  url: z.string()
});

export const ActionPlanStepSchema = z.object({
  element: z.string(),
  action: z.string(),
  measurement: z.string(),
  rationale: z.string(),
  timeEstimate: z.string().optional()
});

export const TopFixSchema = z.object({
  fix: z.string(),
  element: z.string().optional(),
  measurement: z.string().optional(),
  impact: z.string().optional(),
  tutorial: TutorialSchema.optional()
});

export const ScoreReasonSchema = z.object({
  reason: z.string(),
  element: z.string().optional()
});

export const VisualScoreSchema = z.object({
  score: z.number().min(1).max(99),
  tips: z.string(),
  reasons: z.array(ScoreReasonSchema).optional()
});

export const AudienceContextSchema = z.object({
  platform: z.string(),
  audience: z.string(),
  objective: z.string()
});

export const InstantVisualScoresSchema = z.object({
  layout: VisualScoreSchema,
  aesthetics: VisualScoreSchema,
  copy: VisualScoreSchema,
  color: VisualScoreSchema
});

export const DesignTypeEnum = z.enum([
  "collage_composite",
  "clean_minimal", 
  "photographic_editorial",
  "graphic_illustrative",
  "mixed_hybrid"
]);

export const StylisticChoiceSchema = z.object({
  choice: z.string(),
  intentional: z.boolean(),
  strengthensDesign: z.boolean(),
  alternativeApproach: z.string().optional()
});

export const DesignClassificationSchema = z.object({
  designType: DesignTypeEnum,
  confidence: z.number().min(0).max(100),
  justification: z.string(),
  stylisticChoices: z.array(StylisticChoiceSchema).optional(),
  contextCriteria: z.array(z.string()),
  audienceContext: AudienceContextSchema.optional()
});

export const DesignFeedbackSchema = z.object({
  classification: DesignClassificationSchema.optional(),
  instantScores: InstantVisualScoresSchema.optional(),
  conceptIntent: z.string(),
  layoutBalance: z.string(),
  spacingDensity: z.string(),
  visualHierarchy: z.string(),
  styleAlignment: z.string(),
  topFixes: z.array(TopFixSchema).length(3),
  advisorNote: z.string().optional(),
  scoreCalculation: z.object({
    startScore: z.number(),
    expertStrengths: z.number(),
    majorStrengths: z.number(),
    moderateStrengths: z.number(),
    intentionalDeviations: z.number(),
    minorIssues: z.number(),
    moderateIssues: z.number(),
    majorIssues: z.number(),
    expertStrengthPoints: z.number(),
    majorStrengthPoints: z.number(),
    moderateStrengthPoints: z.number(),
    minorIssueDeduction: z.number(),
    moderateIssueDeduction: z.number(),
    majorIssueDeduction: z.number(),
    rawScore: z.number(),
    hardCapNegativeApplied: z.boolean(),
    hardCapPositiveApplied: z.boolean(),
    finalScore: z.number().min(1).max(10),
    reasoning: z.string(),
  }),
  annotations: z.array(AnnotationSchema).optional(),
  heatmapUrl: z.string().optional()
});

export type Annotation = z.infer<typeof AnnotationSchema>;
export type DesignFeedback = z.infer<typeof DesignFeedbackSchema>;
export type DesignClassification = z.infer<typeof DesignClassificationSchema>;
export type StylisticChoice = z.infer<typeof StylisticChoiceSchema>;
export type DesignType = z.infer<typeof DesignTypeEnum>;
export type AudienceContext = z.infer<typeof AudienceContextSchema>;
export type ScoreReason = z.infer<typeof ScoreReasonSchema>;
export type ActionPlanStep = z.infer<typeof ActionPlanStepSchema>;
export type TopFix = z.infer<typeof TopFixSchema>;

// User Intent Schema - for context-aware feedback
export const DesignPurposeEnum = z.enum([
  "email_marketing",
  "paid_social_ad",
  "landing_page",
  "brand_awareness",
  "poster_print",
  "portfolio_piece",
  "ui_design",
  "other"
]);

export const PrimaryGoalEnum = z.enum([
  "click_through",
  "conversion",
  "brand_perception",
  "visual_exploration",
  "information_delivery",
  "engagement"
]);

export const UserIntentSchema = z.object({
  designPurpose: DesignPurposeEnum,
  primaryGoal: PrimaryGoalEnum
});

export type DesignPurpose = z.infer<typeof DesignPurposeEnum>;
export type PrimaryGoal = z.infer<typeof PrimaryGoalEnum>;
export type UserIntent = z.infer<typeof UserIntentSchema>;

// Reference-based critique types (now the primary critique format)
// Combined with instant scores and expert analysis for comprehensive feedback
export const ReferenceCritiqueFeedbackSchema = z.object({
  // Genre identification (mandatory first step)
  detectedGenre: z.string().optional(),
  genreNote: z.string().optional(),
  // Reference critique fields
  overallRead: z.string(),
  score: z.number().min(1).max(10),
  scoreReasoning: z.string(),
  whatWorks: z.array(z.string()).min(2).max(5),
  whatWeakens: z.array(z.string()).min(1).max(6),
  whatToTestNext: z.array(z.string()).min(2).max(4),
  comparisonNotes: z.string().optional(),
  annotations: z.array(AnnotationSchema).optional(),
  heatmapData: z.string().optional(),
  // Visual analysis - 4 pillars (Layout, Aesthetics, Copy, Color)
  instantScores: InstantVisualScoresSchema.optional(),
  // Expert analysis - 4 categories
  layoutBalance: z.string().optional(),
  spacingDensity: z.string().optional(),
  visualHierarchy: z.string().optional(),
  styleAlignment: z.string().optional(),
  // Additional expert fields
  conceptIntent: z.string().optional(),
  topFixes: z.array(TopFixSchema).optional(),
  advisorNote: z.string().optional(),
});

export type ReferenceCritiqueFeedback = z.infer<typeof ReferenceCritiqueFeedbackSchema>;
