import type { CombatInterceptor } from '../combat-interceptor.interface';
import { guardRedirectInterceptor }       from './guard-redirect.interceptor';
import { statEffectModifiersInterceptor } from './stat-effect-modifiers.interceptor';
import { damageModifiersInterceptor }     from './damage-modifiers.interceptor';

export const STAGE_2_INTERCEPTORS: CombatInterceptor[] = [
    guardRedirectInterceptor,
    statEffectModifiersInterceptor,
    damageModifiersInterceptor,
];
