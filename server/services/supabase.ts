import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type for reference_assets table
export interface ReferenceAsset {
  id: string;
  image_public_url: string;
  intent: string;
  goal: string;
  traits: Record<string, any>;
  reference_quality: 'strong' | 'mixed' | 'weak';
  reference_notes: string;
  personal_lens: string;
  created_at: string;
}

// Quality weight mapping for proper sorting
const QUALITY_WEIGHTS: Record<string, number> = {
  'strong': 1,
  'mixed': 2,
  'weak': 3
};

// Fetch reference assets for a given intent, biased by quality
export async function fetchReferenceAssets(
  intent: string,
  limit: number = 15
): Promise<ReferenceAsset[]> {
  try {
    // Fetch all references for this intent (we'll sort locally for proper quality ordering)
    const { data, error } = await supabase
      .from('reference_assets')
      .select('*')
      .eq('intent', intent);

    if (error) {
      console.error('Error fetching reference assets:', error);
      throw error;
    }

    // Sort by quality weight (strong=1, mixed=2, weak=3) so strong comes first
    const sortedData = (data || []).sort((a, b) => {
      const weightA = QUALITY_WEIGHTS[a.reference_quality] || 99;
      const weightB = QUALITY_WEIGHTS[b.reference_quality] || 99;
      return weightA - weightB;
    });

    // Apply limit after sorting
    const limitedData = sortedData.slice(0, limit);

    console.log(`Fetched ${limitedData.length} reference assets for intent: ${intent}`);
    return limitedData;
  } catch (error) {
    console.error('Failed to fetch reference assets:', error);
    return [];
  }
}

// Select references for AI analysis - minimum 10 for proper calibration
// Includes all quality levels: strong, mixed, and weak
export function selectReferencesForAI(
  references: ReferenceAsset[],
  minCount: number = 10
): ReferenceAsset[] {
  // Separate by quality
  const strong = references.filter(r => r.reference_quality === 'strong');
  const mixed = references.filter(r => r.reference_quality === 'mixed');
  const weak = references.filter(r => r.reference_quality === 'weak');

  console.log(`Available references by quality: strong=${strong.length}, mixed=${mixed.length}, weak=${weak.length}`);

  const selected: ReferenceAsset[] = [];

  // Target distribution for proper calibration:
  // - Strong: ~50% (set the quality bar)
  // - Mixed: ~30% (show middle-ground quality)
  // - Weak: ~20% (show what to avoid)
  const targetStrong = Math.max(4, Math.ceil(minCount * 0.5));
  const targetMixed = Math.max(2, Math.ceil(minCount * 0.3));
  const targetWeak = Math.max(1, Math.ceil(minCount * 0.2));

  // Add from each quality level
  selected.push(...strong.slice(0, targetStrong));
  selected.push(...mixed.slice(0, targetMixed));
  selected.push(...weak.slice(0, targetWeak));

  // If we don't have enough, fill from any remaining references
  if (selected.length < minCount) {
    const remaining = minCount - selected.length;
    const allRemaining = references.filter(r => !selected.includes(r));
    selected.push(...allRemaining.slice(0, remaining));
  }

  // Log the final selection breakdown
  const finalStrong = selected.filter(r => r.reference_quality === 'strong').length;
  const finalMixed = selected.filter(r => r.reference_quality === 'mixed').length;
  const finalWeak = selected.filter(r => r.reference_quality === 'weak').length;
  console.log(`Selected ${selected.length} references for AI: strong=${finalStrong}, mixed=${finalMixed}, weak=${finalWeak}`);
  
  return selected;
}
