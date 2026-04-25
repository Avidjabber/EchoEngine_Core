import type { CombatActionContext } from './combat-action-context';
import type { PrimaryDatabaseService } from '../../../database/primary.service';

export type CombatPhase =
    | 'DECLARE'
    | 'VALIDATE'
    | 'TARGET'
    | 'PRE_RESOLVE'
    | 'RESOLVE'
    | 'APPLY'
    | 'POST_APPLY'
    | 'END'
    | 'NPC_AI';

export interface CombatInterceptor {
    phase:    CombatPhase;
    priority: number; // lower runs first within a phase
    apply(ctx: CombatActionContext, db: PrimaryDatabaseService): Promise<void>;
}
