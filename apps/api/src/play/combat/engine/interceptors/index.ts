import type { CombatInterceptor } from '../combat-interceptor.interface';
import { stunCheckInterceptor }           from './stun-check.interceptor';
import { tauntCheckInterceptor }          from './taunt-check.interceptor';
import { guardRedirectInterceptor }       from './guard-redirect.interceptor';
import { statEffectModifiersInterceptor } from './stat-effect-modifiers.interceptor';
import { acModsInterceptor }              from './ac-mods.interceptor';
import { damageModifiersInterceptor }     from './damage-modifiers.interceptor';

export const STAGE_2_INTERCEPTORS: CombatInterceptor[] = [
    stunCheckInterceptor,
    tauntCheckInterceptor,
    guardRedirectInterceptor,
    statEffectModifiersInterceptor,
    acModsInterceptor,
    damageModifiersInterceptor,
];
