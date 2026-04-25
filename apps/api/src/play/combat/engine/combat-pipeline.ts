import type { CombatActionContext, CombatActionInput } from './combat-action-context';
import type { CombatInterceptor, CombatPhase } from './combat-interceptor.interface';
import type { PrimaryDatabaseService } from '../../../database/primary.service';
import type { DiceRoller } from './dice';
import { runDeclare }    from './phases/declare';
import { runValidate }   from './phases/validate';
import { runTarget }     from './phases/target';
import { runPreResolve } from './phases/pre-resolve';
import { runResolve }    from './phases/resolve';
import { runApply }      from './phases/apply';
import { runPostApply }  from './phases/post-apply';
import { runEnd }        from './phases/end';
import { runNpcAi }      from './phases/npc-ai';

export interface PipelineServices {
    db:     PrimaryDatabaseService;
    roller: DiceRoller;
}

type PhaseRunner = (ctx: CombatActionContext, svc: PipelineServices) => Promise<void>;

const PHASE_RUNNERS: Array<[CombatPhase, PhaseRunner]> = [
    ['DECLARE',     runDeclare],
    ['VALIDATE',    runValidate],
    ['TARGET',      runTarget],
    ['PRE_RESOLVE', runPreResolve],
    ['RESOLVE',     runResolve],
    ['APPLY',       runApply],
    ['POST_APPLY',  runPostApply],
    ['END',         runEnd],
    ['NPC_AI',      runNpcAi],
];

function createContext(input: CombatActionInput): CombatActionContext {
    return {
        input:               Object.freeze({ ...input }),
        actor:               null,
        profile:             null,
        combatMeta:          null,
        existingActionCount: 0,
        aborted:             false,
        abortReason:         null,
        actualTargetId:      input.targetEntityId,
        wasRedirected:       false,
        originalTargetName:  null,
        target:              null,
        targetParticipant:   null,
        targetAC:            10,
        hitModifier:         0,
        damageModifier:      0,
        healModifier:        0,
        hitRoll:             null,
        hitTotal:            null,
        isHit:               null,
        diceRolls:           [],
        rawDamage:           0,
        finalDamage:         0,
        rawHeal:             0,
        finalHeal:           0,
        hpAfter:             null,
        knockedDown:         false,
        defeated:            false,
        pendingReaction:     null,
        actionId:            null,
    };
}

export async function runCombatPipeline(
    input:        CombatActionInput,
    svc:          PipelineServices,
    interceptors: CombatInterceptor[] = [],
): Promise<CombatActionContext> {
    const ctx = createContext(input);

    for (const [phase, runPhase] of PHASE_RUNNERS) {
        const phaseInterceptors = interceptors
            .filter(i => i.phase === phase)
            .sort((a, b) => a.priority - b.priority);

        for (const interceptor of phaseInterceptors) {
            await interceptor.apply(ctx, svc.db);
            if (ctx.aborted) return ctx;
        }

        await runPhase(ctx, svc);
        if (ctx.aborted) return ctx;
    }

    return ctx;
}
