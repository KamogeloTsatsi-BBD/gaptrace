import type { InsightsData } from '../types';

export const exampleInsights: InsightsData = {
  substrate: { total_criteria: 24, gap_count: 8, gap_rate: 33, categories: [{ category: 'validation', gap_count: 4, gap_rate: 50 }, { category: 'error_handling', gap_count: 2, gap_rate: 25 }, { category: 'permissions', gap_count: 2, gap_rate: 25 }] },
  narrative: [
    { finding: 'Validation is the most recurring delivery gap.', grounding_stat: '4 of 8 gaps (50%) are categorised as validation.', hypothesis: 'Several source criteria describe outcomes without spelling out invalid-input behaviour.', suggested_action: 'Add explicit invalid-input examples to acceptance criteria and use them in PR review.', severity: 'high' },
    { finding: 'Permission checks recur across recent analyses.', grounding_stat: '2 of 8 gaps (25%) are categorised as permissions.', hypothesis: 'Access expectations may be assumed rather than independently stated.', suggested_action: 'Include an authorised and unauthorised user scenario in each affected ticket.', severity: 'medium' },
  ],
};
