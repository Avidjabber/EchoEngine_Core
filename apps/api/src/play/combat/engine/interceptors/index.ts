import type { CombatInterceptor } from '../combat-interceptor.interface';
import { stunCheckInterceptor }           from './stun-check.interceptor';
import { tauntCheckInterceptor }          from './taunt-check.interceptor';
import { guardRedirectInterceptor }       from './guard-redirect.interceptor';
import { dodgeCheckInterceptor }          from './dodge-check.interceptor';
import { helpCheckInterceptor }           from './help-check.interceptor';
import { statEffectModifiersInterceptor } from './stat-effect-modifiers.interceptor';
import { acModsInterceptor }              from './ac-mods.interceptor';
import { tempHpInterceptor }              from './temp-hp.interceptor';
import { guardAbsorptionInterceptor }     from './guard-absorption.interceptor';
import { damageModifiersInterceptor }     from './damage-modifiers.interceptor';
import { dispelInterceptor }              from './dispel.interceptor';

export const COMBAT_INTERCEPTORS: CombatInterceptor[] = [
    stunCheckInterceptor,           // VALIDATE/0
    tauntCheckInterceptor,          // VALIDATE/1
    guardRedirectInterceptor,       // TARGET/0
    dodgeCheckInterceptor,          // TARGET/1
    helpCheckInterceptor,           // PRE_RESOLVE/-1
    statEffectModifiersInterceptor, // PRE_RESOLVE/0
    acModsInterceptor,              // PRE_RESOLVE/1
    tempHpInterceptor,              // APPLY/-1
    guardAbsorptionInterceptor,     // APPLY/0
    damageModifiersInterceptor,     // APPLY/1
    dispelInterceptor,              // APPLY/2
];
