import type { CombatInterceptor } from '../combat-interceptor.interface';
import { stunCheckInterceptor }           from './stun-check.interceptor';
import { tauntCheckInterceptor }          from './taunt-check.interceptor';
import { guardRedirectInterceptor }       from './guard-redirect.interceptor';
import { statEffectModifiersInterceptor } from './stat-effect-modifiers.interceptor';
import { acModsInterceptor }              from './ac-mods.interceptor';
import { guardAbsorptionInterceptor }     from './guard-absorption.interceptor';
import { damageModifiersInterceptor }     from './damage-modifiers.interceptor';

export const COMBAT_INTERCEPTORS: CombatInterceptor[] = [
    stunCheckInterceptor,           // VALIDATE/0
    tauntCheckInterceptor,          // VALIDATE/1
    guardRedirectInterceptor,       // TARGET/0
    statEffectModifiersInterceptor, // PRE_RESOLVE/0
    acModsInterceptor,              // PRE_RESOLVE/1
    guardAbsorptionInterceptor,     // APPLY/0
    damageModifiersInterceptor,     // APPLY/1
];
