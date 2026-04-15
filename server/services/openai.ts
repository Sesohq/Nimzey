import OpenAI from "openai";
import Replicate from "replicate";
import { DesignFeedbackSchema, DesignClassificationSchema, ReferenceCritiqueFeedbackSchema, type DesignFeedback, type DesignClassification, type Annotation, type UserIntent, type ReferenceCritiqueFeedback } from "@shared/schema";
import type { ReferenceAsset } from "./supabase";

// Helper function to download image from URL and convert to base64
async function urlToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    if (!response.ok) {
      console.error(`Failed to fetch image from ${url}: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return null;
  }
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

// Sanitize text to remove any accidental reference mentions
function sanitizeReferenceMentions(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // Remove patterns like "Reference 1", "reference 2", "like Reference 3", etc.
  let sanitized = text
    .replace(/\b[Rr]eference\s*#?\d+/gi, 'professional examples')
    .replace(/\b[Rr]ef\s*#?\d+/gi, 'professional examples')
    .replace(/compared\s+to\s+(the\s+)?references?/gi, 'by professional standards')
    .replace(/as\s+seen\s+in\s+(the\s+)?references?/gi, 'as seen in professional work')
    .replace(/like\s+(the\s+)?references?/gi, 'like professional work')
    .replace(/unlike\s+(the\s+)?references?/gi, 'unlike professional work')
    .replace(/in\s+(the\s+)?references?/gi, 'in professional work')
    .replace(/from\s+(the\s+)?references?/gi, 'from professional standards')
    .replace(/the\s+reference(s)?(\s+show)?/gi, 'professional work$2')
    .replace(/reference(s)?\s+demonstrate/gi, 'professional standards demonstrate')
    .replace(/\(\s*see\s+reference\s*\d*\s*\)/gi, '')
    .replace(/\[\s*reference\s*\d*\s*\]/gi, '');
  
  return sanitized.trim();
}

// Sanitize an array of strings
function sanitizeArray(arr: string[]): string[] {
  if (!Array.isArray(arr)) return arr;
  return arr.map(item => sanitizeReferenceMentions(item));
}

async function generateAnnotations(base64Image: string, feedback: any): Promise<Annotation[]> {
  try {
    const annotationPrompt = `You are a precise design annotation system. Your job is to place visual markers at EXACT locations of design issues.

## SPATIAL GRID REFERENCE
Imagine the image divided into a 10x10 grid:
- LEFT edge = 0%, RIGHT edge = 100% (x-axis)
- TOP edge = 0%, BOTTOM edge = 100% (y-axis)

QUADRANT GUIDE:
- Top-Left quadrant: x=0-50, y=0-50
- Top-Right quadrant: x=50-100, y=0-50  
- Bottom-Left quadrant: x=0-50, y=50-100
- Bottom-Right quadrant: x=50-100, y=50-100
- Center: x=40-60, y=40-60

## ANNOTATION PLACEMENT RULES

1. **ANCHOR TO SPECIFIC ELEMENTS**: Name the exact element you're marking (e.g., "the word 'RACING' in the header", "the car image in center-right", "the date text at bottom")

2. **MEASURE FROM ELEMENT CENTER**: Place your marker at the CENTER of the problematic element, not its edge

3. **BE PRECISE WITH COORDINATES**:
   - If text is in the top-left corner, x should be 5-25, y should be 5-25
   - If an element spans the full width centered, x should be ~50
   - If something is at the very bottom, y should be 85-95

4. **VALIDATE BEFORE RETURNING**: Ask yourself - if I drew a dot at (x,y), would it land ON the element I'm describing?

## REQUIRED FORMAT

For each annotation provide:
- label: Short issue name (3-4 words max)
- elementTarget: EXACT description of what element this marks (e.g., "Main headline 'SPEED' text", "Hero car image", "CTA button")
- x: X coordinate 0-100 (horizontal position from LEFT)
- y: Y coordinate 0-100 (vertical position from TOP)
- quadrant: Which quadrant contains this element (top-left, top-right, bottom-left, bottom-right, center)
- cause: The specific problem
- effect: Impact on the design
- description: Combined explanation

## EXAMPLE

For a headline "SUMMER SALE" positioned in the upper-center of the image:
{
  "label": "Cramped headline",
  "elementTarget": "SUMMER SALE headline text",
  "x": 50,
  "y": 15,
  "quadrant": "top-center",
  "cause": "Text sits only 8px from top edge",
  "effect": "Creates visual tension, lacks breathing room",
  "description": "Headline too close to edge → visual tension → needs more top margin"
}

## TASK

Analyze this design and create 3-6 precise annotations. For each issue:
1. Identify the exact element with the problem
2. Determine which quadrant it's in
3. Estimate precise x,y coordinates for the element's CENTER
4. Double-check: would a marker at (x,y) land ON this element?

Return JSON: {"annotations": [...]}

Context from previous analysis:
- Layout issues: ${feedback.layoutBalance || 'None noted'}
- Spacing issues: ${feedback.spacingDensity || 'None noted'}
- Hierarchy issues: ${feedback.visualHierarchy || 'None noted'}
- Key fixes needed: ${feedback.topFixes?.map((f: any) => f.fix || f.element || f).slice(0, 3).join('; ') || 'None noted'}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: annotationPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high" // Use high detail for better spatial accuracy
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
      temperature: 0.2, // Lower temperature for more consistent/precise positioning
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    let annotations = result.annotations || [];
    
    console.log(`Generated ${annotations.length} raw annotations:`, annotations);
    
    // Validate and sanitize coordinates
    annotations = annotations.map((ann: any, index: number) => {
      // Clamp coordinates to valid range
      let x = typeof ann.x === 'number' ? ann.x : 50;
      let y = typeof ann.y === 'number' ? ann.y : 50;
      
      // Ensure coordinates are within bounds (5-95 to avoid edge clipping)
      x = Math.max(5, Math.min(95, x));
      y = Math.max(5, Math.min(95, y));
      
      // Validate quadrant matches coordinates (simple sanity check)
      const quadrant = ann.quadrant || '';
      if (quadrant.includes('left') && x > 60) {
        console.log(`Annotation ${index}: quadrant says 'left' but x=${x}, adjusting`);
        x = Math.min(x, 45); // Shift left if quadrant says left
      }
      if (quadrant.includes('right') && x < 40) {
        console.log(`Annotation ${index}: quadrant says 'right' but x=${x}, adjusting`);
        x = Math.max(x, 55); // Shift right if quadrant says right
      }
      if (quadrant.includes('top') && y > 60) {
        console.log(`Annotation ${index}: quadrant says 'top' but y=${y}, adjusting`);
        y = Math.min(y, 45); // Shift up if quadrant says top
      }
      if (quadrant.includes('bottom') && y < 40) {
        console.log(`Annotation ${index}: quadrant says 'bottom' but y=${y}, adjusting`);
        y = Math.max(y, 55); // Shift down if quadrant says bottom
      }
      
      return {
        label: ann.label || `Issue ${index + 1}`,
        x: Math.round(x),
        y: Math.round(y),
        description: ann.description || `${ann.cause || ''} → ${ann.effect || ''}`.trim() || 'Design issue detected',
        elementTarget: ann.elementTarget,
        quadrant: ann.quadrant
      };
    });
    
    console.log(`Validated ${annotations.length} annotations:`, annotations);
    
    // If no annotations were generated but we have feedback, create fallback annotations
    if (annotations.length === 0 && (feedback.conceptIntent || feedback.layoutBalance || feedback.visualHierarchy || feedback.spacingDensity)) {
      console.log("No annotations generated, creating fallback annotations based on feedback");
      return createFallbackAnnotations(feedback);
    }
    
    return annotations;
  } catch (error) {
    console.error("Error generating annotations:", error);
    // Create fallback annotations if annotation generation fails
    return createFallbackAnnotations(feedback);
  }
}

function createFallbackAnnotations(feedback: any): Annotation[] {
  const fallbackAnnotations: Annotation[] = [];
  
  // Create generic annotations based on feedback categories
  if (feedback.conceptIntent) {
    fallbackAnnotations.push({
      label: "Concept Issue",
      x: 50,
      y: 30,
      description: "Concept and intent could be clearer based on analysis"
    });
  }
  
  if (feedback.layoutBalance) {
    fallbackAnnotations.push({
      label: "Layout Issue", 
      x: 25,
      y: 60,
      description: "Layout and balance needs improvement in this area"
    });
  }
  
  if (feedback.visualHierarchy) {
    fallbackAnnotations.push({
      label: "Hierarchy Issue",
      x: 75,
      y: 40,
      description: "Visual hierarchy could be strengthened here"
    });
  }
  
  if (feedback.spacingDensity) {
    fallbackAnnotations.push({
      label: "Spacing Issue",
      x: 40,
      y: 70,
      description: "Spacing and density needs attention"
    });
  }
  
  console.log(`Created ${fallbackAnnotations.length} fallback annotations`);
  return fallbackAnnotations;
}

async function classifyDesignType(base64Image: string): Promise<DesignClassification> {
  const classificationPrompt = `You are a design classification expert. Analyze this image and classify it into ONE design type category. This classification will determine which scoring criteria to apply.

## DESIGN TYPE CATEGORIES

**1. collage_composite** - Layered photo compositions
- Multiple images combined/blended together
- Photo manipulations with effects layers
- Sports graphics with player cutouts + backgrounds
- Movie posters with composite elements
KEY CRITERIA TO EVALUATE: lighting consistency, edge blending quality, layer cohesion, color matching between elements

**2. clean_minimal** - Typography-focused, simple layouts  
- Minimal elements, lots of whitespace
- Text-heavy designs (logos, business cards, posters)
- Modern minimalist aesthetic
- Few or no photographic elements
KEY CRITERIA TO EVALUATE: font pairing, whitespace usage, alignment precision, typographic hierarchy

**3. photographic_editorial** - Photography-based layouts
- Magazine layouts, editorial spreads
- Product photography presentations
- Photo essays with text overlays
KEY CRITERIA TO EVALUATE: photo composition, color grading, subject focus, text-image balance

**4. graphic_illustrative** - Vector/illustration-based
- Illustrations, icons, infographics
- Cartoon/character art
- Geometric or abstract designs
KEY CRITERIA TO EVALUATE: shape harmony, color palette, visual rhythm, line consistency

**5. mixed_hybrid** - Combines multiple categories
- Uses 2+ styles together intentionally
KEY CRITERIA TO EVALUATE: style blending, visual cohesion, intentional contrast

## STYLISTIC CHOICE DETECTION

Identify intentional stylistic choices that might seem like "issues" but are deliberate:
- Grunge/distressed textures
- Intentional color clashing (brutalist style)
- Asymmetrical layouts for dynamic tension
- Low-fi or retro aesthetics
- Experimental typography treatments

For each stylistic choice, determine:
- Is it intentional (deliberate creative choice) or accidental (amateur mistake)?
- Does it strengthen or weaken the design's message?
- If questionable, suggest an alternative approach

## AUDIENCE CONTEXT INFERENCE
Based on visual cues, infer the likely:
- **Platform**: Where this will be displayed (Instagram, poster, billboard, website banner, magazine, app UI, etc.)
- **Audience**: Who is the target viewer (sports fans, business professionals, young adults, gamers, etc.)
- **Objective**: What action/emotion is intended (generate excitement, inform, convert, inspire, etc.)

## RETURN JSON FORMAT:
{
  "designType": "collage_composite" | "clean_minimal" | "photographic_editorial" | "graphic_illustrative" | "mixed_hybrid",
  "confidence": 85,
  "justification": "Brief explanation of why this category fits (1-2 sentences)",
  "audienceContext": {
    "platform": "Instagram/Social Media",
    "audience": "Motorsport fans, young adults 18-35",
    "objective": "Generate excitement for upcoming event"
  },
  "stylisticChoices": [
    {
      "choice": "Heavy grunge texture overlay",
      "intentional": true,
      "strengthensDesign": true,
      "alternativeApproach": null
    },
    {
      "choice": "Clashing orange and purple tones",
      "intentional": false,
      "strengthensDesign": false,
      "alternativeApproach": "Consider a complementary color scheme like orange/blue or use a triad with purple/green/orange properly balanced"
    }
  ],
  "contextCriteria": ["lighting_consistency", "edge_blending", "layer_cohesion", "color_matching"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: classificationPrompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.1, // Low temperature for consistency
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    console.log("Design classification:", result);
    
    // Validate and return
    return DesignClassificationSchema.parse(result);
  } catch (error) {
    console.error("Error classifying design:", error);
    // Return a safe default with all required fields
    return {
      designType: "mixed_hybrid",
      confidence: 50,
      justification: "Could not classify - using general criteria",
      contextCriteria: ["composition", "color_harmony", "typography", "spacing"],
      audienceContext: {
        platform: "Digital / Multi-platform",
        audience: "General audience",
        objective: "Visual communication"
      }
    };
  }
}

function getContextSpecificRubric(designType: string): string {
  const rubrics: Record<string, string> = {
    collage_composite: `
## COLLAGE/COMPOSITE-SPECIFIC CRITERIA (prioritize these)

**Lighting Consistency (Critical)**
- Do all elements share the same light direction and quality?
- Are shadows consistent across composited elements?
- Score Impact: Mismatched lighting = Major Issue (-5.0)

**Edge Blending Quality (Critical)**  
- Are cutout edges clean with no halos/fringing?
- Do elements blend naturally into the background?
- Score Impact: Visible edge issues = Moderate Issue (-3.0)

**Layer Cohesion (Important)**
- Do elements feel like they belong in the same scene?
- Is the depth/scale relationship believable?
- Score Impact: Incoherent layers = Moderate Issue (-3.0)

**Color Matching (Important)**
- Are color temperatures consistent across elements?
- Do composited photos have matching saturation/contrast?
- Score Impact: Color mismatches = Minor Issue (-1.5)`,

    clean_minimal: `
## CLEAN/MINIMAL-SPECIFIC CRITERIA (prioritize these)

**Typography Excellence (Critical)**
- Font pairing: Do the fonts complement each other?
- Kerning/tracking: Is letter spacing consistent and intentional?
- Score Impact: Poor typography = Major Issue (-5.0)

**Whitespace Usage (Critical)**
- Is negative space used intentionally to create breathing room?
- Does whitespace guide the eye effectively?
- Score Impact: Cramped layout = Moderate Issue (-4.0)

**Alignment Precision (Important)**
- Are elements aligned to an invisible grid?
- Is the alignment consistent throughout?
- Score Impact: Misaligned elements = Moderate Issue (-3.0)

**Visual Flow (Important)**
- Does the design have a clear reading order?
- Is the visual path intuitive?
- Score Impact: Confusing flow = Minor Issue (-2.0)`,

    photographic_editorial: `
## PHOTOGRAPHIC/EDITORIAL-SPECIFIC CRITERIA (prioritize these)

**Photo Composition (Critical)**
- Rule of thirds, leading lines, framing
- Subject placement and visual weight
- Score Impact: Poor composition = Major Issue (-5.0)

**Color Grading (Critical)**
- Is there a cohesive color treatment?
- Do highlights and shadows work together?
- Score Impact: Inconsistent grading = Moderate Issue (-3.0)

**Text-Image Balance (Important)**
- Does text complement without competing?
- Is text readable over image areas?
- Score Impact: Text/image conflict = Moderate Issue (-4.0)

**Subject Focus (Important)**
- Is the main subject clear and prominent?
- Are distracting elements minimized?
- Score Impact: Unfocused subject = Minor Issue (-2.0)`,

    graphic_illustrative: `
## GRAPHIC/ILLUSTRATIVE-SPECIFIC CRITERIA (prioritize these)

**Shape Harmony (Critical)**
- Do geometric shapes work together cohesively?
- Is there consistent shape language?
- Score Impact: Discordant shapes = Major Issue (-5.0)

**Color Palette (Critical)**
- Is the color scheme intentional and harmonious?
- Does color support the message?
- Score Impact: Poor palette = Moderate Issue (-4.0)

**Visual Rhythm (Important)**
- Is there pattern and repetition where appropriate?
- Does the design have visual beat/tempo?
- Score Impact: No rhythm = Minor Issue (-2.0)

**Line Consistency (Important)**
- Are stroke weights consistent?
- Do lines/edges have intentional weight variation?
- Score Impact: Inconsistent lines = Minor Issue (-1.5)`,

    mixed_hybrid: `
## HYBRID DESIGN CRITERIA (evaluate style blending)

**Style Cohesion (Critical)**
- Do the mixed styles complement each other?
- Is there a unifying visual thread?
- Score Impact: Style clash = Major Issue (-5.0)

**Intentional Contrast (Important)**
- If styles contrast, does it feel deliberate?
- Does the contrast serve the message?
- Score Impact: Accidental contrast = Moderate Issue (-3.0)

**Element Hierarchy (Important)**
- Is it clear which style dominates?
- Do mixed elements have clear roles?
- Score Impact: Confused hierarchy = Minor Issue (-2.0)`
  };

  return rubrics[designType] || rubrics.mixed_hybrid;
}

async function generateVisualAttentionHeatmap(base64Image: string): Promise<string | null> {
  try {
    console.log("Generating visual attention heatmap using GPT-4 Vision...");
    
    // Use GPT-4 Vision to analyze attention patterns and generate heatmap data
    const heatmapPrompt = `Analyze this image for visual attention patterns. You are a visual perception expert studying where human eyes naturally focus.

ANALYZE FOR:
1. High contrast areas (bright vs dark, color differences)
2. Text regions (especially large text, headers, calls-to-action)
3. Faces and human figures (if present)
4. Central regions vs periphery
5. Geometric shapes and edges
6. Color saturation hotspots

RETURN A JSON with percentage-based coordinates for high, medium, and low attention areas:
{
  "highAttention": [{"x": 50, "y": 30, "intensity": 0.9}, {"x": 25, "y": 70, "intensity": 0.8}],
  "mediumAttention": [{"x": 75, "y": 20, "intensity": 0.6}, {"x": 40, "y": 85, "intensity": 0.5}],
  "lowAttention": [{"x": 10, "y": 10, "intensity": 0.3}, {"x": 90, "y": 90, "intensity": 0.2}]
}

Where x,y are percentages (0-100) from top-left, and intensity is 0.0-1.0 for attention strength.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: heatmapPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const heatmapData = JSON.parse(response.choices[0].message.content || "{}");
    console.log("Generated heatmap data:", heatmapData);
    
    // Return the heatmap data as a JSON string that the frontend can use
    return JSON.stringify(heatmapData);
  } catch (error) {
    console.error("Error generating visual attention heatmap:", error);
    return null;
  }
}

// Helper function to get intent-specific scoring context
function getIntentScoringContext(userIntent?: UserIntent): string {
  if (!userIntent) return '';
  
  const purposeContexts: Record<string, string> = {
    email_marketing: `
## EMAIL MARKETING CONTEXT (USER-SPECIFIED)
This is an EMAIL AD. Apply email-specific standards:
- **Density IS acceptable**: In email marketing, visual density signals value and urgency
- **Competing headlines + price IS intentional**: Eye-flicker between headline and price drives conversions
- **Urgency tactics ARE effective**: Compression, overlap, and crowding can increase perceived value
- Do NOT penalize deliberate performance marketing tactics as "design flaws"
- Judge by: Does it stop the scroll? Is the CTA clear? Will it convert?

## WHAT WORKS FOR EMAIL ADS:
- Huge headlines that dominate ✓
- Price prominence competing with headline ✓
- Dense product displays signaling value ✓
- High contrast for skimmability ✓
- Urgency visual language ✓`,
    
    paid_social_ad: `
## PAID SOCIAL AD CONTEXT (USER-SPECIFIED)
This is a SOCIAL MEDIA AD optimized for performance.
- **Scroll-stopping aggression IS the goal**: Bold, high-contrast designs work
- **Quick comprehension (<2 sec)** is more important than visual refinement
- Dense layouts can signal abundance and value
- Judge by: Will it stop the scroll? Is the message instant? Will it drive clicks?

## WHAT WORKS FOR SOCIAL ADS:
- Bold, attention-grabbing visuals ✓
- Immediate value proposition ✓
- Strong CTAs ✓
- High contrast for feed visibility ✓`,
    
    landing_page: `
## LANDING PAGE CONTEXT (USER-SPECIFIED)
This is a LANDING PAGE / HERO SECTION for conversion.
- Clear value proposition above the fold
- Strong visual hierarchy guiding to CTA
- Balanced density - not too sparse, not overwhelming
- Judge by: Is the value clear? Does it guide toward action?`,
    
    brand_awareness: `
## BRAND AWARENESS CONTEXT (USER-SPECIFIED)
This is a BRAND / AWARENESS piece.
- Emotional impact and memorability matter most
- Polish and craft should be higher
- Vibe and aesthetic consistency are paramount
- Judge by: Is it memorable? Does it build brand equity?`,
    
    poster_print: `
## POSTER / PRINT CONTEXT (USER-SPECIFIED)
This is a PHYSICAL POSTER or print design.
- Apply traditional design standards: breathing room, visual balance
- Typography must work at distance
- Clean hierarchy and readable at a glance
- Judge by: Does it work at scale? Is it visually balanced?`,
    
    portfolio_piece: `
## PORTFOLIO / CREATIVE EXPLORATION CONTEXT (USER-SPECIFIED)
This is a creative exploration or portfolio piece.
- Artistic expression and craft matter most
- Unconventional choices may be intentional
- Judge by: Is the creative vision executed well?`,
    
    ui_design: `
## UI DESIGN CONTEXT (USER-SPECIFIED)
This is an APP or WEB INTERFACE design.
- Usability and clarity are paramount
- Consistency with platform conventions matters
- Accessibility and readability are critical
- Judge by: Is it usable? Is it consistent? Is it accessible?`,
    
    other: ''
  };
  
  const goalContexts: Record<string, string> = {
    click_through: `
### PRIMARY GOAL: CLICK-THROUGH
Success = Getting users to click. CTR-optimized designs should have:
- Clear, prominent CTA
- Curiosity-inducing visuals
- Minimal friction to the click action
**Respect intentional urgency tactics that drive clicks.**`,
    
    conversion: `
### PRIMARY GOAL: CONVERSION
Success = Driving purchases or signups. Conversion-optimized designs should have:
- Trust signals and credibility
- Clear value proposition
- Urgency or scarcity cues
- Prominent pricing/offers
**Price prominence and urgency tactics are GOOD here, not flaws.**`,
    
    brand_perception: `
### PRIMARY GOAL: BRAND PERCEPTION
Success = Building brand image and recall. Brand-focused designs should have:
- Consistent brand elements
- Emotional resonance
- Polish and craft
- Memorable creative`,
    
    visual_exploration: `
### PRIMARY GOAL: CREATIVE EXPLORATION
Success = Artistic expression and experimentation. Judge for:
- Creative vision execution
- Intentional rule-breaking
- Artistic merit`,
    
    information_delivery: `
### PRIMARY GOAL: INFORMATION DELIVERY
Success = Clear communication of information. Judge for:
- Readability and clarity
- Information hierarchy
- Ease of scanning
- Logical organization`,
    
    engagement: `
### PRIMARY GOAL: ENGAGEMENT
Success = Generating likes, shares, comments. Engagement designs should:
- Stop the scroll
- Provoke reaction
- Be shareable
- Create curiosity`
  };
  
  const purposeContext = purposeContexts[userIntent.designPurpose] || '';
  const goalContext = goalContexts[userIntent.primaryGoal] || '';
  
  return `
${purposeContext}

${goalContext}

## CONTEXT-AWARE SCORING ADJUSTMENT
When scoring, recognize that deliberate tactics for this use case should NOT be penalized:
- If a design choice serves the stated goal effectively, acknowledge it with "This works because..."
- If a tradeoff was made for effectiveness, frame it as: "This tradeoff is acceptable because..."
- Be the helpful peer who understands PERFORMANCE design, not just aesthetic design

## SCORING RECALIBRATION FOR ${userIntent.designPurpose.toUpperCase().replace('_', ' ')}:
- Don't apply poster/editorial standards to performance ads
- A dense email that converts is a GOOD email (7-8/10 territory)
- A scroll-stopping social ad with high contrast is doing its job well
- Judge intent achievement, not abstract aesthetics
`;
}

export async function analyzeDesignWithVision(base64Image: string, userIntent?: UserIntent): Promise<DesignFeedback> {
  // STAGE 1: Classify design type first for context-aware scoring
  console.log("Stage 1: Classifying design type...");
  console.log("User provided intent:", userIntent);
  const classification = await classifyDesignType(base64Image);
  console.log(`Design classified as: ${classification.designType} (${classification.confidence}% confidence)`);
  
  // Get context-specific rubric based on design type
  const contextRubric = getContextSpecificRubric(classification.designType);
  
  // Build stylistic context for the prompt
  const stylisticContext = classification.stylisticChoices?.length 
    ? `\n## DETECTED STYLISTIC CHOICES (factor these into scoring):\n${classification.stylisticChoices.map(s => 
        `- "${s.choice}": ${s.intentional ? 'INTENTIONAL' : 'possibly unintentional'}, ${s.strengthensDesign ? 'strengthens design' : 'may weaken design'}${s.alternativeApproach ? ` - Alternative: ${s.alternativeApproach}` : ''}`
      ).join('\n')}`
    : '';

  // Get intent-specific scoring context if user provided intent
  const intentContext = getIntentScoringContext(userIntent);

  const prompt = `You are "Critique-GPT," a senior creative-director AI with 15+ years at top agencies.
Goal – deliver CONSISTENT and accurate 1-10 scores that reflect design mastery. The same image should receive the same score every time.

## DESIGN TYPE CLASSIFICATION (PRE-ANALYZED)
This design has been classified as: **${classification.designType}**
Confidence: ${classification.confidence}%
Reason: ${classification.justification}
${stylisticContext}
${intentContext}

## SCORING CONSISTENCY RULES (CRITICAL)
1. Use the rubric-based checklist below - go through each criterion systematically
2. Before finalizing each score, compare against the reference anchors
3. Your final 1-10 score MUST be derived from the average of your 4 instant scores:
   - Average 1-47 → 1-4/10 final
   - Average 48-57 → 5/10 final
   - Average 58-67 → 6/10 final
   - Average 68-77 → 7/10 final
   - Average 78-87 → 8/10 final
   - Average 88-97 → 9/10 final
   - Average 98-99 → 10/10 final
   EXAMPLE: If your instant scores are Layout:71, Aesthetics:74, Copy:68, Color:72 (avg 71.25) → final score MUST be 7/10
4. Document your reasoning explicitly for reproducibility

${contextRubric}

---
### Reference anchors (use these to calibrate - compare your scoring)

**2/10** – Too simple, no clear composition
**3/10** – Cool typography but bland unused background; OR fun composition but low-res assets & weak colour  
**4/10** – Good palette but cramped type & pointless effects; OR nice 3D text but unfinished feel
**6/10** – Strong face lighting with good details; OR solid base with minor excess effects
**8/10** – Simple idea with great execution & crisp work
**9/10** – Excellent colour scheme, type exploration, lighting & composition; OR expert blending with confident layout

---
### Instant Visual Scores (FIRST - before expert analysis)

Before the detailed critique, provide 4 quick visual scores (1-99 scale):

**1. Layout (1-99)** - Composition, element positioning, grid alignment, visual flow
- 90-99: Masterful composition, perfect balance
- 70-89: Strong layout, minor adjustments needed
- 50-69: Adequate but noticeable issues
- 30-49: Poor structure, significant problems
- 1-29: Severely flawed composition

**2. Aesthetics (1-99)** - Overall vibe, artistic direction, style consistency, visual appeal
- 90-99: Exceptional artistic vision, polished execution
- 70-89: Strong aesthetic direction, cohesive look
- 50-69: Decent vibe but lacks refinement
- 30-49: Weak aesthetic choices, unclear direction
- 1-29: Poor visual appeal, conflicting styles

**3. Copy (1-99)** - Text clarity, readability, message effectiveness, audience targeting
- 90-99: Crystal clear, perfectly targets audience
- 70-89: Clear message, good readability
- 50-69: Understandable but room for improvement
- 30-49: Confusing or hard to read
- 1-29: Illegible or completely off-target
- Note: If design has no text/copy, score based on visual messaging clarity

**4. Color (1-99)** - Color scheme harmony, contrast quality, brand alignment
- 90-99: Perfect palette, expert color theory
- 70-89: Solid color choices, good contrast
- 50-69: Acceptable but could be stronger
- 30-49: Poor color choices, weak contrast
- 1-29: Terrible color scheme, visibility issues

For each score, provide:
- "tips": Concise 2-3 sentence explanation
- "reasons": Array of 1-2 specific reasons that justify this score, referencing concrete elements

Example:
{
  "score": 72,
  "tips": "Layout is functional but the header crowds the top edge. Consider adding breathing room.",
  "reasons": [
    {"reason": "Header text 'SPANISH GP 2025' sits only 12px from top edge", "element": "Header text"},
    {"reason": "Driver image is well-positioned as focal point", "element": "Driver cutout"}
  ]
}

---
### Scoring rubric

#### Step 1 – Concept & Intent  
Infer the designer's theme/goal in ≤ 2 sentences.

#### Step 2 – Four-pillar critique (one of them note-only)  
_Tag each bullet with **Expert (+3)**, **Major (+2)**, **Moderate (+1)**, **Intentional (0)**, **Minor (-0.5)**, **Moderate Issue (-1)**, **Major / Beginner (-2 to -3)**._

**For every bullet: tag internally for scoring, but do NOT show the tag or point value in the final output.**

1. **Layout & Balance**  
   • Grids, symmetry, weight distribution.

2. **Spacing & Density**  
   • Breathing room, crowding, margins.

3. **Visual Hierarchy**  
   • Focal points, reading order, rhythm.

4. **Style Alignment** *(NOTE-ONLY – max +1)*  
   • Colour palette, typography, brand fit.  
   • Can add **+1** total if exceptional; otherwise 0.  
   • Do **not** deduct issues here—score them in the other pillars.  
   • **Decorative micro-type (≤ 3% of canvas height or placed on outer edges) is acceptable texture; do not score it as a spacing or contrast issue unless it carries essential information.**

#### Step 3 – Score maths (pillar-weighted)

| Tag → Base pts | Layout & Balance | Spacing & Density | Visual Hierarchy | Style Alignment |
|----------------|------------------|-------------------|------------------|-----------------|
| Expert Strength | +1.0 | +1.0 | +1.0 | +0.3 (max) |
| Major Strength  | +0.6 | +0.6 | +0.6 | +0.2 (max) |
| Moderate Str.   | +0.3 | +0.3 | +0.3 | +0.1 (max) |
| Minor Issue     | –1.5 | –2.0 | –1.5 | N/A |
| Moderate Issue  | –3.0 | –4.0 | –3.0 | N/A |
| Major / Beginner| –5.0 | –6.0 | –5.0 | N/A |

\`\`\`text
# Compute
Start = 3.5
Final = Start
        + Σ(pillar-weighted strengths)
        – Σ(pillar-weighted issues)

# Professional standards - prioritize craft over flash
Readability and technical execution are paramount.
Text that's hard to read = automatic Moderate Issue (-4.0 for spacing).
Cramped or overlapping elements = Major Issue (-6.0 for spacing).
Poor contrast = Moderate Issue (-3.0 for hierarchy).
Amateur typography = Moderate Issue (-3.0 for hierarchy).
Any element that interferes with readability = automatic point deduction.

# Hard-caps (much stricter professional standards)
- Negative cap : any readability issues OR amateur execution → Final ≤ 4  
- Positive cap : to exceed 5, design needs ≥ 2 total *Expert + Major* strengths **and** 0 Major Issues;  
                to exceed 6, needs ≥ 3 Expert/Major strengths **and** 0 Moderate Issues;
                to exceed 7, needs ≥ 4 Expert/Major strengths, 0 issues, AND exceptional polish;
                to exceed 8, needs ≥ 5 Expert strengths, 0 issues, AND commercial-grade execution;
                10/10 only if ≥ 6 Expert strengths and award-worthy execution.  
  Otherwise set Final = min(Final, 5, 6, 7, or 8).

# Critical perspective: Judge like a senior creative director
Be harsh on common amateur mistakes:
- Text overlapping images without proper contrast
- Poor spacing and cramped layouts
- Weak visual hierarchy
- Elements that compete for attention
- Technical execution flaws

Clamp 1-10 and round.
\`\`\`

#### Step 4 – Top 3 Fixes (ACTION PLAN FORMAT)
Give the three highest-impact improvements as a mini action plan. Each fix MUST include:
- **element**: The specific element to modify (e.g., "Spanish GP 2025 header text", "driver cutout image")
- **measurement**: Exact adjustment in px or % (e.g., "24-32px", "5-8%", "reduce by 15%")
- **impact**: What this fix will achieve (e.g., "reduces edge tension", "improves scan flow")

Example:
{"fix": "Add 24-32px padding to header text", "element": "Spanish GP 2025 header", "measurement": "24-32px top padding", "impact": "Reduces edge tension and improves breathing room"}

#### Step 5 – Advisor Note ("If this were my design...")
Write a short first-person paragraph (2-4 sentences) giving your personal creative take:
"If this were my design, I'd [specific change]. This would [benefit]. The key is [insight]."

This should feel human and expert, not generic advice.

Think silently; output only the markdown block under "Output".

IMPORTANT: Return each analysis field as a single string with line breaks, not as arrays. Use \\n for line breaks within strings.

**ACTIONABLE FEEDBACK REQUIREMENTS:**
Every pillar analysis (layoutBalance, spacingDensity, visualHierarchy, styleAlignment) MUST include:
1. Specific element names (not "the text" but "the Spanish GP 2025 header")
2. Quantified measurements where applicable (px, %, direction)
3. Why it matters (cause → effect)

BAD: "Text is too close to the edge"
GOOD: "The 'Spanish GP 2025' header sits only ~12px from the top edge, creating visual tension. Adding 24-32px padding would let it breathe."

Please return your analysis in JSON format with the following structure:
{
  "instantScores": {
    "layout": {
      "score": 75,
      "tips": "Brief explanation of what's working or needs fixing",
      "reasons": [{"reason": "Specific reason with element name", "element": "Element name"}]
    },
    "aesthetics": {"score": 68, "tips": "...", "reasons": [...]},
    "copy": {"score": 82, "tips": "...", "reasons": [...]},
    "color": {"score": 71, "tips": "...", "reasons": [...]}
  },
  "conceptIntent": "In ≤ 2 sentences, state the implied intent or theme",
  "layoutBalance": "ACTIONABLE critique with element names and measurements. Use \\n for line breaks.",
  "spacingDensity": "ACTIONABLE critique with element names and measurements. Use \\n for line breaks.",
  "visualHierarchy": "ACTIONABLE critique with element names and measurements. Use \\n for line breaks.",
  "styleAlignment": "Single string with your Style Alignment analysis. Use \\n for line breaks between bullet points.",
  "topFixes": [
    {"fix": "Add 24-32px padding to header", "element": "Spanish GP 2025 header", "measurement": "24-32px top padding", "impact": "Reduces edge tension"},
    {"fix": "Increase contrast on byline text", "element": "Byline/date text", "measurement": "Add dark overlay or text shadow", "impact": "Meets WCAG AA contrast"},
    {"fix": "Scale down driver image", "element": "Driver cutout", "measurement": "Reduce by 5-8%", "impact": "Rebalances visual weight"}
  ],
  "advisorNote": "If this were my design, I'd anchor the headline to the helmet visor line and let the car reclaim motion dominance. The key is giving each element its own space to breathe while maintaining the dynamic energy.",
  "scoreCalculation": {
    "startScore": 5,
    "expertStrengths": 1,
    "majorStrengths": 2,
    "moderateStrengths": 1,
    "intentionalDeviations": 1,
    "minorIssues": 2,
    "moderateIssues": 1,
    "majorIssues": 0,
    "expertStrengthPoints": 3,
    "majorStrengthPoints": 4,
    "moderateStrengthPoints": 1,
    "minorIssueDeduction": 1,
    "moderateIssueDeduction": 1,
    "majorIssueDeduction": 0,
    "rawScore": 11,
    "hardCapNegativeApplied": false,
    "hardCapPositiveApplied": true,
    "finalScore": 8,
    "reasoning": "Reference ≥ 2 bullets that drove the score"
  }
}

**Example Clean Output Format:**
- **Layout & Balance** — The layered images keep attention centred, but the diagonal banner pulls weight left.
- **Spacing & Density** — Text breathes well except the bottom stats, which feel cramped.
- **Visual Hierarchy** — The player's face dominates, yet multiple focal points dilute impact.
- **Style Alignment** — Vibrant blue-orange palette fits the team brand; font choice feels slightly generic.

(No "Expert (+3)" or "Minor (-1)" prefixes in the final output.)`;

  try {
    console.log("Stage 2: Generating context-aware critique...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.2, // Low temperature for consistent scoring
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Normalize topFixes: ensure it's exactly 3 objects with fix property
    if (result.topFixes) {
      result.topFixes = result.topFixes
        .slice(0, 3) // Limit to 3 items
        .map((fix: any) => {
          // Convert string to object if needed
          if (typeof fix === 'string') {
            return { fix };
          }
          return fix;
        });
      
      // Pad with empty fixes if less than 3
      while (result.topFixes.length < 3) {
        result.topFixes.push({ fix: "Review overall design composition" });
      }
    }
    
    // Generate visual annotations for the feedback
    const annotations = await generateAnnotations(base64Image, result);
    
    // Generate visual attention heatmap
    const heatmapUrl = await generateVisualAttentionHeatmap(base64Image);
    
    console.log("Analysis complete - returning feedback with classification");
    
    // Return feedback with classification, annotations and heatmap
    return DesignFeedbackSchema.parse({
      ...result,
      classification,
      annotations,
      ...(heatmapUrl && { heatmapUrl })
    });
  } catch (error) {
    console.error("Error analyzing design:", error);
    throw new Error("Failed to analyze design: " + (error as Error).message);
  }
}

// Reference-based critique using curated poster references
export async function analyzeDesignWithReferences(
  base64Image: string,
  references: ReferenceAsset[]
): Promise<ReferenceCritiqueFeedback> {
  console.log(`Starting reference-based critique with ${references.length} references`);
  
  // Build reference context for the prompt
  const referenceContext = references.map((ref, i) => {
    const traitsStr = ref.traits ? Object.entries(ref.traits).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
    return `Reference ${i + 1} (${ref.reference_quality} quality):
- Notes: ${ref.reference_notes || 'No notes'}
- Personal Lens: ${ref.personal_lens || 'No lens provided'}
- Traits: ${traitsStr || 'No traits'}`;
  }).join('\n\n');

  const critiquePrompt = `You are a senior Creative Director reviewing a poster design. You MUST use the provided professional examples as your scoring benchmark.

## YOUR ROLE
- You are NOT a generic AI reviewer. You are opinionated and direct.
- CRITICALLY COMPARE the submitted design against the professional examples provided
- The professional examples ARE your quality standard - use them to judge if this design is better or worse
- Score honestly - if this design has issues the examples don't have, it scores LOWER
- Focus entirely on the SUBMITTED design in your OUTPUT, but judge it AGAINST the examples internally

## CRITIQUE TONE (MANDATORY)
You are a senior art director doing an internal crit — not a tool giving tips.
- Write like you're reviewing work in a real studio, not like a chatbot
- Reference notes from the examples show how a real CD thinks — match that voice
- Be frank, opinionated, direct. Say what's wrong and why.
- Don't hedge. Don't soften. Don't over-explain.
- Examples: "This doesn't work because..." / "The problem is..." / "What you actually need here is..."
- Sound like someone who has shipped work and knows what good looks like

## REFERENCE USAGE RULES (CRITICAL)
You have access to ${references.length} professional poster examples. Use them as follows:

**HOW TO USE REFERENCE NOTES:**
For each reference image, you will see Notes and Personal Lens. These are NOT just metadata — they are teaching you what to look for:
- The Notes explain WHY that specific image is strong, mixed, or weak
- They point out specific design qualities: "the negative space gives the headline room to breathe", "color hierarchy guides the eye", "the density creates urgency"
- READ these notes carefully. They show you what good/bad looks like in concrete terms.

**HOW TO APPLY THIS TO THE SUBMITTED DESIGN:**
After absorbing what the reference notes teach you:
- Ask: "Does this submission have the same quality of [thing noted in references]?"
- If a reference note says "great typography hierarchy" — check if the submission has that
- If a reference note says "the crowding weakens the focal point" — check if the submission has that problem
- Your evaluation criteria come FROM the reference notes, not from generic design principles

**REFERENCE CALIBRATION RULES:**
1. Use ALL provided references to calibrate your critique depth, language style, and quality thresholds
2. References are INTERNAL TRAINING SIGNALS ONLY — never cite, quote, or mention them
3. Absorb the quality level, craft standard, and compositional choices from references
4. Use reference quality levels to anchor your scoring (strong = 7-8, mixed = 5-6, weak = 3-4)
5. Your critique should reflect what a CD who has seen thousands of posters would say

## CRITIQUE LOGIC OVERRIDE (ROOT CAUSES, NOT SYMPTOMS)
You MUST diagnose ROOT CAUSES, not surface symptoms. This is what separates a $30/month tool from a free one.

BAD (surface symptom): "There are too many rocks in the foreground"
GOOD (root cause): "Visual congestion in the lower third creates competing focal points. The density comes from layering environment elements without hierarchy."

BAD (surface symptom): "The text is hard to read"
GOOD (root cause): "Contrast failure between headline and background. The type treatment lacks separation — no shadow, no container, no value shift."

BAD (surface symptom): "It feels busy"
GOOD (root cause): "Density is unstructured. Each element fights for attention without a clear entry point or visual anchor. There's no breathing room guiding the eye."

For EVERY piece of feedback, ask yourself: "What is the underlying design failure that causes this symptom?"

## REQUIRED FAILURE MODES TO CHECK (GENRE-DEPENDENT)
Before completing your critique, check these failure patterns - BUT APPLY THEM BASED ON GENRE:

**FOR MINIMALIST / CLEAN DESIGNS:**
1. **VISUAL CONGESTION** - Too many elements competing without hierarchy
2. **COMPETING FOCAL POINTS** - Multiple elements demanding equal attention
3. **DENSITY FROM LAYERS** - Environment/decoration elements creating clutter
4. **SPACE EARNING** - Does every element earn its presence?

**FOR COLLAGE / SPORTS TRIBUTE / MAXIMALIST DESIGNS:**
These checks DO NOT APPLY the same way. Instead check:
1. **COHESION FAILURE** - Do the layered elements feel unified or randomly placed?
2. **THEME DRIFT** - Are there elements that don't support the central subject/story?
3. **EXECUTION QUALITY** - Is the compositing/masking/blending professional?
4. **SUBJECT CLARITY** - Even in a busy composition, is the main subject identifiable?
5. **COLOR HARMONY** - Do the multiple elements share a cohesive color treatment?

**UNIVERSAL CHECKS (ALL GENRES):**
1. **ENTRY POINT** - Is there ONE clear place the eye lands first? (Main subject in collages)
2. **READING PATH** - After the entry point, is the flow intentional?
3. **ENVIRONMENT COHESION** - Do composited elements feel like they belong together?
4. **DUPLICATED EMOTIONAL BEATS** - Same energy repeated without purpose

**CRITICAL: Do NOT flag "too many elements" or "visual congestion" on collage/sports tribute designs unless the elements genuinely conflict with each other or undermine the subject.**

## STRUCTURE ENFORCEMENT
- Address SYSTEMIC issues ONCE comprehensively, not fragmented into minor tips
- If the core problem is "visual congestion," say it clearly ONCE with full context
- Don't repeat the same underlying issue across multiple bullets phrased differently
- Each point in whatWorks/whatWeakens should address a DISTINCT issue

## LANGUAGE CONSTRAINTS (MANDATORY)
NEVER use these weak phrases:
- "Consider..." / "You might want to..." / "Perhaps try..."
- "Slightly..." / "A bit..." / "Somewhat..."
- "Feels like..." / "Seems to..." / "Could be..."
- "Maybe..." / "I think..." / "You could explore..."

ALWAYS use these direct constructions:
- "This causes..." / "This breaks..." / "This prevents..."
- "The problem is..." / "What's failing here is..."
- "You need to..." / "Fix this by..." / "The solution is..."
- "Remove..." / "Reduce..." / "Increase..." / "Shift..."

## REFERENCE EXAMPLES (USE FOR SCORING, DO NOT MENTION)
Study these professional examples carefully. They set the bar for quality:
${referenceContext}

## SCORING METHODOLOGY (CRITICAL)
Before scoring, you MUST mentally answer:
1. Does this design's layout work as well as the best examples? If not, subtract points.
2. Does this design's typography/hierarchy match professional standards shown? If not, subtract points.
3. Does this design have issues (crowding, poor contrast, weak composition) that the examples avoid? If yes, subtract points.
4. Would this design look amateur next to the examples? If yes, score 5 or below.

The examples marked "strong" quality = what a 7-8 looks like.
The examples marked "weak" quality = what a 4-5 looks like.
Score the submitted design relative to where it falls on this spectrum.

## CRITICAL OUTPUT RULES
1. NEVER mention "reference", "Reference 1", "Reference 2", or any numbered reference
2. NEVER say "compared to the reference" or "as seen in the reference"
3. NEVER say "like the example" or "unlike the examples"
4. DO give specific, actionable suggestions based on professional standards
5. DO say things like "try repositioning the logos" or "consider removing some background elements"
6. DO describe what better looks like without citing external sources
7. BE direct and useful - this costs $30/month, give real feedback
8. Your scores MUST reflect how this design stacks up against professional work, not against amateur work

## OUTPUT FORMAT (strict JSON)
{
  "detectedGenre": "SPORTS TRIBUTE / PLAYER COLLAGE | MUSIC POSTER | FASHION EDITORIAL | COLLAGE ART | VINTAGE TRIBUTE | MAXIMALIST | MINIMALIST | OTHER",
  "genreNote": "1 sentence explaining why you categorized it this way and what criteria you're applying",
  "overallRead": "A 2-3 sentence gut reaction. What does this poster communicate at first glance? What's the immediate vibe?",
  "score": 7,
  "scoreReasoning": "Score X/10 because [specific observation about this design's strengths/weaknesses]. The [specific element] works because [reason], but [specific issue] holds it back. NOTE: If collage/maximalist genre, do NOT penalize for density - instead evaluate cohesion and execution.",
  "whatWorks": [
    "Specific strength in THIS design with element name (e.g., 'The bold headline creates immediate impact')",
    "Another strength with why it works",
    "2-5 items total - be specific to THIS design"
  ],
  "whatWeakens": [
    "Specific issue + concrete fix suggestion (e.g., 'The rocks in the foreground crowd the composition - try removing 2-3 or pushing them to the edges')",
    "Another issue + how to address it (e.g., 'Logo placement fights with the headline - consider moving it to top-left corner with 24px padding')",
    "3-6 items - each with an actionable improvement suggestion"
  ],
  "whatToTestNext": [
    "Specific experiment to try (e.g., 'Try a version with 30% less foreground elements to let the subject breathe')",
    "Another concrete variation (e.g., 'Test repositioning the date text to bottom-right to balance the composition')",
    "2-4 actionable experiments"
  ],
  "instantScores": {
    "layout": {"score": 72, "tips": "Specific tip for layout improvement", "reasons": [{"reason": "Element alignment is mostly consistent", "element": "Header grid"}]},
    "aesthetics": {"score": 68, "tips": "Specific tip for visual appeal", "reasons": [{"reason": "Color palette creates energy", "element": "Background gradient"}]},
    "copy": {"score": 55, "tips": "Specific tip for text/readability", "reasons": [{"reason": "Headline competes with subtext", "element": "Main title"}]},
    "color": {"score": 78, "tips": "Specific tip for color usage", "reasons": [{"reason": "Contrast is strong on CTA", "element": "Button"}]}
  },
  "layoutBalance": "3-4 sentences analyzing composition and positioning. Name specific elements. Include 1-2 concrete recommendations with measurements where possible. Example: 'The main subject sits slightly left of center, creating asymmetric tension. The bottom third feels heavy due to the overlapping logos. Consider shifting the subject 5-10% right and reducing logo scale by 15% to rebalance. The diagonal banner adds energy but competes with the headline - try angling it 15° instead of 45° for subtler movement.'",
  "spacingDensity": "3-4 sentences on whitespace and breathing room. Name cramped or sparse areas. Include specific fixes. Example: 'The top 20% of the canvas has excellent breathing room, letting the headline dominate. However, the bottom zone is overcrowded - the price tag, date, and venue text overlap dangerously. Add 16-24px vertical gaps between these elements. Consider removing the decorative border entirely to reclaim ~40px of margin.'",
  "visualHierarchy": "3-4 sentences on attention flow and focal points. Describe the reading order. Suggest improvements. Example: 'The eye lands on the car first (good), then fights between the driver name and event date (problem). The CTA button gets lost in the noise below. Increase headline size by 20% and reduce secondary text size by 15% to create clearer tiers. Add a subtle drop shadow to the CTA to lift it from the background.'",
  "styleAlignment": "3-4 sentences on aesthetic consistency and genre fit. Evaluate cohesion. Suggest refinements. Example: 'The racing aesthetic comes through with the motion blur and aggressive angles - this works. The font choice (Impact or similar) feels dated for 2024 motorsport design. Consider switching to a modern geometric sans like Bebas Neue or Oswald. The orange/blue palette is on-brand but the green accent feels out of place - try swapping for cyan or removing it.'",
  "conceptIntent": "2-3 sentences on what the design communicates and whether it succeeds",
  "topFixes": [
    {"fix": "Specific actionable fix with detail", "element": "Exact element name", "measurement": "Specific value like 24px or 15%", "impact": "What this achieves"},
    {"fix": "Second priority fix", "element": "Target element", "measurement": "Specific value", "impact": "Expected improvement"},
    {"fix": "Third priority fix", "element": "Target element", "measurement": "Specific value", "impact": "Expected improvement"}
  ],
  "advisorNote": "If this were my design, I'd [specific change with reasoning]. This would [concrete benefit]. The key is [design principle insight]."
}

## EXPERT ANALYSIS REQUIREMENTS
For layoutBalance, spacingDensity, visualHierarchy, and styleAlignment:
- Write 3-4 substantial sentences each
- Name specific elements from the design
- Include 1-2 concrete recommendations with measurements (px, %, degrees)
- Explain cause → effect (why the change helps)
- Be prescriptive: "try X", "consider Y", "swap Z for W"

## GENRE IDENTIFICATION (MANDATORY FIRST STEP)
Before critiquing ANYTHING, you MUST identify the design's genre/style category:

**RECOGNIZED INTENTIONAL GENRES:**
1. **SPORTS TRIBUTE / PLAYER COLLAGE** - Multi-element compositions celebrating athletes with city backdrops, team imagery, jersey numbers, landmarks, and layered typography. The ENTIRE POINT is maximalist layering. Having "too many elements" is the genre, not a flaw.

2. **MUSIC POSTER / CONCERT FLYER** - Expressive typography, chaotic energy, overlapping elements, distortion effects. Designed to feel loud and energetic.

3. **FASHION EDITORIAL** - Anti-grid layouts, cropped subjects, experimental typography, high contrast. Designed to feel avant-garde.

4. **COLLAGE / COMPOSITE ART** - Multiple images blended together, varied scales, montage effects. The layering IS the aesthetic.

5. **VINTAGE / RETRO TRIBUTE** - Nostalgic styling, deliberate "imperfections", era-specific design language.

6. **MAXIMALIST GRAPHIC DESIGN** - Intentionally dense, pattern-heavy, multi-element compositions. More is more.

7. **MINIMALIST / CLEAN** - Whitespace-forward, limited elements, typographic focus.

**CRITICAL RULE: GENRE DETERMINES CRITERIA**
- A SPORTS COLLAGE with multiple city buildings, team logos, and layered elements = CORRECT for that genre
- A MINIMALIST POSTER with multiple city buildings would be a problem
- YOU CANNOT apply minimalist standards to maximalist genres

**BEFORE ANY CRITICISM, ASK:**
"Is this element density/overlap/complexity INTENTIONAL for this genre?"
If YES → It's not a problem. Evaluate execution quality instead.
If NO → Then critique it as an issue.

## STYLISTIC INTENT DETECTION (MANDATORY)
After identifying genre, detect intentional stylistic choices:
- Exaggerated typography
- Overlapping elements (NORMAL in collages/sports graphics)
- Anti-grid placement
- High-density layout (EXPECTED in tribute posters)
- Cropped or obscured subjects
- Deliberately chaotic composition
- Repetition as a graphic device
- Motion / distortion text
- City/location elements as backdrop (STANDARD in sports tributes)
- Multiple logo placements (EXPECTED in sports graphics)
- Layered environmental elements (THE POINT of collage work)

**FOR SPORTS TRIBUTE / COLLAGE GENRES SPECIFICALLY:**
- Multiple buildings/landmarks = CORRECT (shows city connection)
- Team logos, jersey numbers, player imagery = CORRECT (shows team identity)
- Overlapping elements = CORRECT (creates depth and richness)
- Dense composition = CORRECT (maximalist aesthetic)
- Name typography with dimensional effects = CORRECT (celebratory style)

DO NOT PENALIZE these as "visual congestion" or "too many elements" - they ARE the design.

If these are intentional stylistic choices:
1. Do NOT penalize them as readability or spacing issues
2. Do NOT lower the score for density or overlap
3. Treat them as strengths when they support the intended vibe or audience
4. Only critique execution flaws, NOT the stylistic premise

WHEN NOT TO CRITICIZE OVERLAP:
If overlapping type and imagery reinforces movement, creates expressive energy, matches fashion/music/sports poster standards, or feels intentional and integrated → You cannot score it as a spacing, readability, or hierarchy problem.

HOW TO CRITIQUE MAXIMALIST / COLLAGE DESIGNS:
- Evaluate COHESION: Do the elements feel unified?
- Evaluate ENERGY: Does it capture the intended vibe?
- Evaluate EXECUTION: Are the compositing, masking, and blending professional?
- Evaluate THEME: Does every element support the central subject/story?
- Do NOT evaluate by minimalist standards (whitespace, "breathing room", "too busy")

## EXECUTION QUALITY GATE (CRITICAL)
Even if a design uses expressive, chaotic, or experimental styles, you MUST evaluate execution separately from intent. A stylistic choice is only valid if it is executed with skill. Chaos ≠ mastery by default.

Before allowing any design to score above 6/10, check ALL of the following:

1. TECHNICAL PRECISION
   - Clean masking (no fringing, no jagged edges)
   - Consistent lighting on subjects
   - Cohesive color grading
   - No low-resolution or stretched assets
   - No accidental tangents or awkward overlaps

2. CONTROLLED CHAOS
   Even in expressive layouts:
   - Text must feel placed, not random
   - Overlap must feel intentional, not accidental
   - Movement must feel directed, not sloppy
   - Repetition must feel designed, not copy-pasted

3. COHESION TEST
   Ask: "Does this look like something a real professional studio would ship?"
   If not → cap score at 5/10.

4. CRAFT THRESHOLD
   A design CANNOT exceed:
   - 6/10 unless execution is clean
   - 7/10 unless composition is cohesive
   - 8/10 unless technical skill is high
   - 9/10 unless it demonstrates mastery

5. INTENT ≠ IMMUNITY
   Even if a style is deliberate, you MUST still critique:
   - Bad spacing that breaks the flow
   - Sloppy hierarchy
   - Poor contrast
   - Ugly color choices
   - Amateur composition
   If ANY major technical issues exist → score MUST be 5 or below.

IMPORTANT: Do NOT confuse "expressive typography" with "poor craft."
A wild design with bad placement, no focal point, sloppy overlaps, bad photo treatment, inconsistent color → is a BAD design, NOT an expressive one.

Always enforce: INTENT = what the designer was trying to do. EXECUTION = whether they actually did it well.

## SCORING GUIDE (ANCHORED TO REFERENCE EXAMPLES)
- 9-10: EXCEEDS the best reference examples in craft and execution
- 7-8: ON PAR with strong reference examples - professional, polished
- 5-6: BELOW reference standard - has issues the examples avoid
- 3-4: SIGNIFICANTLY WEAKER than references - amateur execution
- 1-2: Would embarrass the designer if shown next to the references

REMEMBER: Most submitted designs will score 4-6. Scoring 7+ means it genuinely competes with professional work. Do NOT inflate scores to be nice.

## OUTPUT QUALITY GATE (SELF-CHECK BEFORE RETURNING)
Before returning your critique, verify it passes ALL of these checks:

1. **NO REPETITION** - If you've said the same thing twice (even phrased differently), consolidate or remove
2. **NO HEDGING** - Scan for weak language ("consider", "might", "slightly") — rewrite with direct language
3. **ROOT CAUSES IDENTIFIED** - Every "what weakens" bullet names the underlying failure, not just the symptom
4. **SPECIFICITY CHECK** - Every recommendation includes an element name and a measurement/action
5. **DISTINCT ISSUES** - Each bullet in whatWorks/whatWeakens addresses a genuinely different problem
6. **MISSED CLUTTER** - Did you call out visual congestion if it exists? If the design is cluttered and you didn't say so, your critique is invalid

If any check fails, rewrite that section before returning.

Analyze the submitted poster now. Mentally compare it to the reference examples, then give your critique WITHOUT mentioning the references. Be direct. Be useful. Give actionable recommendations.`;

  try {
    // Build message content with user's design + reference images
    const content: any[] = [
      { type: "text", text: critiquePrompt },
      { 
        type: "image_url", 
        image_url: { 
          url: `data:image/jpeg;base64,${base64Image}`,
          detail: "high"
        } 
      }
    ];

    // Download reference images and convert to base64 to avoid OpenAI timeout issues
    // Use "auto" detail so the AI can properly analyze and compare
    console.log(`Downloading ${references.length} reference images...`);
    const downloadPromises = references
      .filter(ref => ref.image_public_url)
      .map(ref => urlToBase64(ref.image_public_url!));
    
    const base64References = await Promise.all(downloadPromises);
    const validReferences = base64References.filter((b64): b64 is string => b64 !== null);
    console.log(`Successfully downloaded ${validReferences.length}/${references.length} reference images`);
    
    for (const base64Ref of validReferences) {
      content.push({
        type: "image_url",
        image_url: {
          url: base64Ref,
          detail: "auto" // Use auto detail for proper visual comparison
        }
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500,
      temperature: 0.3,
    });

    const rawResult = response.choices[0].message.content || "{}";
    console.log("Reference-based critique raw response:", rawResult);
    
    let result;
    try {
      result = JSON.parse(rawResult);
    } catch (parseError) {
      console.error("Failed to parse reference critique JSON:", parseError);
      throw new Error("AI returned invalid JSON response");
    }

    // Normalize arrays to meet schema requirements
    const normalizedResult = {
      ...result,
      whatWorks: Array.isArray(result.whatWorks) ? result.whatWorks.slice(0, 5) : ["Design submitted for review", "See detailed analysis"],
      whatWeakens: Array.isArray(result.whatWeakens) ? result.whatWeakens.slice(0, 6) : ["See detailed analysis"],
      whatToTestNext: Array.isArray(result.whatToTestNext) ? result.whatToTestNext.slice(0, 4) : ["Review composition", "Consider alternatives"],
    };
    
    // Ensure minimum items in arrays
    while (normalizedResult.whatWorks.length < 2) {
      normalizedResult.whatWorks.push("Design element reviewed");
    }
    while (normalizedResult.whatToTestNext.length < 2) {
      normalizedResult.whatToTestNext.push("Experiment with layout");
    }

    // Generate visual annotations based on the critique feedback
    console.log("Generating visual annotations for reference critique...");
    const annotationContext = {
      layoutBalance: normalizedResult.whatWeakens.slice(0, 3).join('; '),
      visualHierarchy: normalizedResult.whatWeakens.slice(0, 2).join('; '),
      spacingDensity: '',
      topFixes: normalizedResult.whatWeakens.map((w: string) => ({ fix: w }))
    };
    const annotations = await generateAnnotations(base64Image, annotationContext);
    
    // Generate visual attention heatmap
    console.log("Generating visual attention heatmap...");
    const heatmapData = await generateVisualAttentionHeatmap(base64Image);

    // Normalize topFixes
    let topFixes = normalizedResult.topFixes;
    if (Array.isArray(topFixes)) {
      topFixes = topFixes.slice(0, 3).map((fix: any) => {
        if (typeof fix === 'string') return { fix };
        return fix;
      });
      while (topFixes.length < 3) {
        topFixes.push({ fix: "Review overall design composition" });
      }
    } else {
      topFixes = [
        { fix: "Review layout balance" },
        { fix: "Check spacing consistency" },
        { fix: "Strengthen visual hierarchy" }
      ];
    }

    // Calculate score from instant scores average to ensure consistency
    let calculatedScore = 5;
    if (normalizedResult.instantScores) {
      const scores = normalizedResult.instantScores;
      const validScores = [scores.layout?.score, scores.aesthetics?.score, scores.copy?.score, scores.color?.score]
        .filter((s): s is number => typeof s === 'number');
      if (validScores.length > 0) {
        const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
        // Map average to 1-10 scale:
        // 1-47 → 1-4, 48-57 → 5, 58-67 → 6, 68-77 → 7, 78-87 → 8, 88-97 → 9, 98-99 → 10
        if (avg >= 98) calculatedScore = 10;
        else if (avg >= 88) calculatedScore = 9;
        else if (avg >= 78) calculatedScore = 8;
        else if (avg >= 68) calculatedScore = 7;
        else if (avg >= 58) calculatedScore = 6;
        else if (avg >= 48) calculatedScore = 5;
        else if (avg >= 38) calculatedScore = 4;
        else if (avg >= 28) calculatedScore = 3;
        else if (avg >= 18) calculatedScore = 2;
        else calculatedScore = 1;
        console.log(`Instant scores avg: ${avg.toFixed(1)} → calculated score: ${calculatedScore}/10`);
      }
    }

    // Apply sanitizer to remove any accidental reference mentions
    const finalResult = {
      overallRead: sanitizeReferenceMentions(normalizedResult.overallRead || "Analysis completed."),
      score: calculatedScore,
      scoreReasoning: sanitizeReferenceMentions(normalizedResult.scoreReasoning || "Score based on overall design quality."),
      whatWorks: sanitizeArray(normalizedResult.whatWorks),
      whatWeakens: sanitizeArray(normalizedResult.whatWeakens),
      whatToTestNext: sanitizeArray(normalizedResult.whatToTestNext),
      // comparisonNotes removed - we don't want to mention references
      annotations,
      heatmapData: heatmapData || undefined,
      // Visual analysis - 4 pillars
      instantScores: normalizedResult.instantScores || undefined,
      // Expert analysis - sanitized for reference mentions
      layoutBalance: sanitizeReferenceMentions(normalizedResult.layoutBalance) || undefined,
      spacingDensity: sanitizeReferenceMentions(normalizedResult.spacingDensity) || undefined,
      visualHierarchy: sanitizeReferenceMentions(normalizedResult.visualHierarchy) || undefined,
      styleAlignment: sanitizeReferenceMentions(normalizedResult.styleAlignment) || undefined,
      conceptIntent: sanitizeReferenceMentions(normalizedResult.conceptIntent) || undefined,
      topFixes: topFixes.map((fix: any) => ({
        ...fix,
        fix: sanitizeReferenceMentions(fix.fix),
        impact: fix.impact ? sanitizeReferenceMentions(fix.impact) : undefined
      })),
      advisorNote: sanitizeReferenceMentions(normalizedResult.advisorNote) || undefined,
    };

    console.log("Reference-based critique complete with visual data");
    return ReferenceCritiqueFeedbackSchema.parse(finalResult);
  } catch (error) {
    console.error("Error in reference-based critique:", error);
    throw new Error("Failed to analyze design with references: " + (error as Error).message);
  }
}

