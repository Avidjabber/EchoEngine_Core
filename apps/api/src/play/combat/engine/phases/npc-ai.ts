import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Stage 1: no-op.
// Stage 3+ will read the next participant's isAiControlled flag and, if true,
// select an action via SpeciesCombatBehavior weights and execute it with a
// recursive runCombatPipeline call. Always the final phase in the pipeline.
export async function runNpcAi(_ctx: CombatActionContext, _svc: PipelineServices): Promise<void> {}
