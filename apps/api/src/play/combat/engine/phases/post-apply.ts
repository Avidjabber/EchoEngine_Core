import type { CombatActionContext } from '../combat-action-context';
import type { PipelineServices } from '../combat-pipeline';

// Stage 1: no-op.
// Stage 2+ will wire counterattack detection, concentration checks, and reflect damage here.
export async function runPostApply(_ctx: CombatActionContext, _svc: PipelineServices): Promise<void> {}
