import {
    ActionRowBuilder,
    ButtonInteraction,
    MessageFlags,
    ModalBuilder,
    ModalSubmitInteraction,
    PermissionFlagsBits,
    StringSelectMenuInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { messages } from '@echoengine/shared';
import { colors } from '../../../../core/colors';
import {
    fetchEnvConditionInfoData,
    fetchEnvConditionTemplateData,
    upsertEnvConditionModifier,
    removeEnvConditionModifier,
} from '../../../../services/model/envConditionPackService';
import { getCachedEnvConditionInfo, setCachedEnvConditionInfo, invalidateEnvConditionInfoCache } from './infoState';
import { getUpdateState, setUpdateState, clearUpdateState } from './updateState';
import type { EnvConditionUpdateState, UpdateActiveField } from './updateState';
import {
    buildUpdatePickerComponents,
    buildUpdateTypeSelector,
    buildUpdateFormComponents,
    buildOverwriteConfirmation,
    buildRemoveConfirmation,
    describeWorldModifier,
    describeStatModifier,
    describeProfModifier,
} from './updateComponents';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function replyError(interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction, content: string): Promise<void> {
    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content }] }],
    } as never);
}

async function replyExpired(interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction): Promise<void> {
    await replyError(interaction, 'Session expired — please run `/config envcondition update` again.');
}

function requireState(userId: string, guildId: string): EnvConditionUpdateState | null {
    return getUpdateState(userId, guildId) ?? null;
}

// ── Condition picker navigation ───────────────────────────────────────────────

// customId: ec_upd_cpage:{page}
export async function handleEcUpdCpage(interaction: ButtonInteraction): Promise<void> {
    const page    = parseInt(interaction.customId.split(':')[1], 10);
    const guildId = interaction.guildId!;

    await interaction.deferUpdate();

    let infoData = getCachedEnvConditionInfo(guildId);
    if (!infoData) {
        const result = await fetchEnvConditionInfoData(guildId);
        if (!result.success) { await replyError(interaction, messages.errorGeneric); return; }
        infoData = result.value!;
        setCachedEnvConditionInfo(guildId, infoData);
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildUpdatePickerComponents(infoData, page) as never,
    });
}

// customId: ec_upd_cpick:{pickerPage}:{codeName}
export async function handleEcUpdCpick(interaction: ButtonInteraction): Promise<void> {
    const parts      = interaction.customId.split(':');
    const pickerPage = parseInt(parts[1], 10);
    const codeName   = parts.slice(2).join(':');
    const guildId    = interaction.guildId!;
    const userId     = interaction.user.id;

    await interaction.deferUpdate();

    const [infoResult, templateResult] = await Promise.all([
        (async () => {
            const cached = getCachedEnvConditionInfo(guildId);
            if (cached) return { success: true as const, value: cached };
            return fetchEnvConditionInfoData(guildId);
        })(),
        fetchEnvConditionTemplateData(guildId),
    ]);

    if (!infoResult.success || !templateResult.success) { await replyError(interaction, messages.errorGeneric); return; }

    const infoData     = infoResult.value!;
    const templateData = templateResult.value!;
    if (!getCachedEnvConditionInfo(guildId)) setCachedEnvConditionInfo(guildId, infoData);

    const condition = infoData.conditions.find(c => c.codeName === codeName);
    if (!condition) { await replyError(interaction, messages.errorGeneric); return; }

    const state: EnvConditionUpdateState = {
        guildId,
        codeName:        condition.codeName,
        conditionName:   condition.name,
        modifierType:    null,
        effectType:      null,
        relation:        null,
        value:           null,
        stat:            null,
        proficiency:     null,
        hasDisadvantage: false,
        hasAdvantage:    false,
        hasExisting:     false,
        activeField:     null,
        effectTypes:     templateData.effectTypes,
        relations:       templateData.relations,
        stats:           templateData.stats,
        proficiencyDefs: templateData.proficiencyDefs,
        pickerPage,
    };

    setUpdateState(userId, guildId, state);

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildUpdateTypeSelector(state) as never,
    });
}

// ── Type selector ─────────────────────────────────────────────────────────────

// customId: ec_upd_type  (select menu)
export async function handleEcUpdType(interaction: StringSelectMenuInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const userId  = interaction.user.id;

    const state = requireState(userId, guildId);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    const modifierType = interaction.values[0] as EnvConditionUpdateState['modifierType'];
    const updated: EnvConditionUpdateState = {
        ...state,
        modifierType,
        effectType:      null,
        relation:        null,
        value:           modifierType === 'proficiency' ? 0 : null,
        stat:            null,
        proficiency:     null,
        hasDisadvantage: false,
        hasAdvantage:    false,
        hasExisting:     false,
        activeField:     null,
    };

    setUpdateState(userId, guildId, updated);
    await interaction.deferUpdate();

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildUpdateFormComponents(updated) as never,
    });
}

// customId: ec_upd_cback  — back from type selector to condition picker
export async function handleEcUpdCback(interaction: ButtonInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const userId  = interaction.user.id;

    const state = requireState(userId, guildId);
    await interaction.deferUpdate();

    if (!state || state.pickerPage < 0) {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.info, components: [{ type: 10, content: 'Cancelled.' }] }],
        } as never);
        clearUpdateState(userId, guildId);
        return;
    }

    let infoData = getCachedEnvConditionInfo(guildId);
    if (!infoData) {
        const result = await fetchEnvConditionInfoData(guildId);
        if (!result.success) { await replyError(interaction, messages.errorGeneric); return; }
        infoData = result.value!;
        setCachedEnvConditionInfo(guildId, infoData);
    }

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildUpdatePickerComponents(infoData, state.pickerPage) as never,
    });
}

// ── Form field handlers ───────────────────────────────────────────────────────

// customId: ec_upd_et  (select menu) — pre-populates relation+value from existing world modifier
export async function handleEcUpdEt(interaction: StringSelectMenuInteraction): Promise<void> {
    const state = requireState(interaction.user.id, interaction.guildId!);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    const effectType = interaction.values[0];
    const infoData   = getCachedEnvConditionInfo(interaction.guildId!);
    const existing   = infoData?.worldModifiers.find(m => m.condition === state.codeName && m.effectType === effectType);

    const updated: EnvConditionUpdateState = {
        ...state,
        effectType,
        relation:    existing?.relation    ?? state.relation,
        value:       existing !== undefined ? existing.value : state.value,
        hasExisting: existing !== undefined,
        activeField: null,
    };

    setUpdateState(interaction.user.id, interaction.guildId!, updated);
    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildUpdateFormComponents(updated) as never });
}

// customId: ec_upd_rel  (select menu)
export async function handleEcUpdRel(interaction: StringSelectMenuInteraction): Promise<void> {
    const state = requireState(interaction.user.id, interaction.guildId!);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    const relation = interaction.values[0];
    const updated  = {
        ...state,
        relation,
        value:       relation === 'block' ? null : state.value,
        activeField: null as null,
    };
    setUpdateState(interaction.user.id, interaction.guildId!, updated);
    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildUpdateFormComponents(updated) as never });
}

// customId: ec_upd_stat  (select menu) — pre-populates value from existing stat modifier
export async function handleEcUpdStat(interaction: StringSelectMenuInteraction): Promise<void> {
    const state = requireState(interaction.user.id, interaction.guildId!);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    const stat     = interaction.values[0];
    const infoData = getCachedEnvConditionInfo(interaction.guildId!);
    const existing = infoData?.statModifiers.find(m => m.condition === state.codeName && m.stat === stat);

    const updated: EnvConditionUpdateState = {
        ...state,
        stat,
        value:       existing !== undefined ? existing.value : state.value,
        hasExisting: existing !== undefined,
        activeField: null,
    };

    setUpdateState(interaction.user.id, interaction.guildId!, updated);
    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildUpdateFormComponents(updated) as never });
}

// customId: ec_upd_prof  (select menu) — pre-populates value+hasDisadvantage from existing proficiency modifier
export async function handleEcUpdProf(interaction: StringSelectMenuInteraction): Promise<void> {
    const state = requireState(interaction.user.id, interaction.guildId!);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    const proficiency = interaction.values[0];
    const infoData    = getCachedEnvConditionInfo(interaction.guildId!);
    const existing    = infoData?.proficiencyModifiers.find(m => m.condition === state.codeName && m.proficiency === proficiency);

    const updated: EnvConditionUpdateState = {
        ...state,
        proficiency,
        value:           existing !== undefined ? existing.value           : state.value,
        hasDisadvantage: existing !== undefined ? existing.hasDisadvantage : state.hasDisadvantage,
        hasAdvantage:    existing !== undefined ? existing.hasAdvantage    : state.hasAdvantage,
        hasExisting:     existing !== undefined,
        activeField:     null,
    };

    setUpdateState(interaction.user.id, interaction.guildId!, updated);
    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildUpdateFormComponents(updated) as never });
}

// customId: ec_upd_set:{fieldKey}  — opens the dropdown for a string field
export async function handleEcUpdSet(interaction: ButtonInteraction): Promise<void> {
    const fieldKey = interaction.customId.split(':')[1] as UpdateActiveField;
    const state    = requireState(interaction.user.id, interaction.guildId!);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    const updated = { ...state, activeField: fieldKey };
    setUpdateState(interaction.user.id, interaction.guildId!, updated);
    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildUpdateFormComponents(updated) as never });
}

// customId: ec_upd_unset  — closes the open dropdown without changing the value
export async function handleEcUpdUnset(interaction: ButtonInteraction): Promise<void> {
    const state = requireState(interaction.user.id, interaction.guildId!);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    const updated = { ...state, activeField: null as null };
    setUpdateState(interaction.user.id, interaction.guildId!, updated);
    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildUpdateFormComponents(updated) as never });
}

// customId: ec_upd_val  — opens value modal
export async function handleEcUpdVal(interaction: ButtonInteraction): Promise<void> {
    const state = requireState(interaction.user.id, interaction.guildId!);
    if (!state) {
        await interaction.reply({
            flags:      MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: 'Session expired — please run `/config envcondition update` again.' }] }],
        } as never);
        return;
    }

    const currentValue = state.value !== null ? String(state.value) : '';
    const isWorldRange = state.modifierType === 'world';
    const label        = isWorldRange ? 'Value (0.0–5.0, magnitude only)' : 'Value (e.g. 5, -3, 0.5)';

    const modal = new ModalBuilder()
        .setCustomId('ec_upd_val_modal')
        .setTitle('Set modifier value')
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('value')
                    .setLabel(label)
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(10)
                    .setRequired(true)
                    .setValue(currentValue),
            ),
        );

    await interaction.showModal(modal);
}

// customId: ec_upd_val_modal  — modal submit
export async function handleEcUpdValModal(interaction: ModalSubmitInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const userId  = interaction.user.id;
    const state   = requireState(userId, guildId);

    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    const raw    = interaction.fields.getTextInputValue('value').trim();
    const parsed = parseFloat(raw);

    if (isNaN(parsed)) {
        await interaction.reply({
            flags:      MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: `*"${raw}" isn't a valid number.*` }] }],
        } as never);
        return;
    }

    const updated = { ...state, value: parsed };
    setUpdateState(userId, guildId, updated);
    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildUpdateFormComponents(updated) as never });
}

// customId: ec_upd_disadv  — toggle hasDisadvantage
export async function handleEcUpdDisadv(interaction: ButtonInteraction): Promise<void> {
    const state = requireState(interaction.user.id, interaction.guildId!);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    const updated = { ...state, hasDisadvantage: !state.hasDisadvantage };
    setUpdateState(interaction.user.id, interaction.guildId!, updated);
    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildUpdateFormComponents(updated) as never });
}

// customId: ec_upd_adv  — toggle hasAdvantage
export async function handleEcUpdAdv(interaction: ButtonInteraction): Promise<void> {
    const state = requireState(interaction.user.id, interaction.guildId!);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    const updated = { ...state, hasAdvantage: !state.hasAdvantage };
    setUpdateState(interaction.user.id, interaction.guildId!, updated);
    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildUpdateFormComponents(updated) as never });
}

// customId: ec_upd_retype  — back to type selector
export async function handleEcUpdRetype(interaction: ButtonInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const userId  = interaction.user.id;
    const state   = requireState(userId, guildId);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    const updated: EnvConditionUpdateState = { ...state, modifierType: null, effectType: null, relation: null, value: null, stat: null, proficiency: null, hasDisadvantage: false, hasAdvantage: false, hasExisting: false, activeField: null };
    setUpdateState(userId, guildId, updated);
    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildUpdateTypeSelector(updated) as never });
}

// customId: ec_upd_cancel
export async function handleEcUpdCancel(interaction: ButtonInteraction): Promise<void> {
    clearUpdateState(interaction.user.id, interaction.guildId!);
    await interaction.deferUpdate();
    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: [{ type: 17, accent_color: colors.info, components: [{ type: 10, content: 'Cancelled. No changes were made.' }] }],
    } as never);
}

// customId: ec_upd_save  — checks for existing modifier; shows confirmation if one exists
export async function handleEcUpdSave(interaction: ButtonInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const userId  = interaction.user.id;
    const state   = requireState(userId, guildId);
    if (!state || !state.modifierType) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    await interaction.deferUpdate();

    const infoData = getCachedEnvConditionInfo(guildId);

    if (state.modifierType === 'world' && state.effectType) {
        const existing = infoData?.worldModifiers.find(m => m.condition === state.codeName && m.effectType === state.effectType);
        if (existing) {
            const oldDesc = describeWorldModifier(existing.effectType, existing.relation, existing.value);
            const newDesc = describeWorldModifier(state.effectType, state.relation!, state.value);
            await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildOverwriteConfirmation(state, oldDesc, newDesc) as never });
            return;
        }
    }

    if (state.modifierType === 'stat' && state.stat) {
        const existing = infoData?.statModifiers.find(m => m.condition === state.codeName && m.stat === state.stat);
        if (existing) {
            const oldDesc = describeStatModifier(existing.stat, existing.value);
            const newDesc = describeStatModifier(state.stat, state.value!);
            await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildOverwriteConfirmation(state, oldDesc, newDesc) as never });
            return;
        }
    }

    if (state.modifierType === 'proficiency' && state.proficiency) {
        const existing = infoData?.proficiencyModifiers.find(m => m.condition === state.codeName && m.proficiency === state.proficiency);
        if (existing) {
            const oldDesc = describeProfModifier(existing.proficiency, existing.value, existing.hasDisadvantage, existing.hasAdvantage);
            const newDesc = describeProfModifier(state.proficiency, state.value ?? 0, state.hasDisadvantage, state.hasAdvantage);
            await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildOverwriteConfirmation(state, oldDesc, newDesc) as never });
            return;
        }
    }

    await doSave(interaction, state);
}

// customId: ec_upd_confirm  — user confirmed the overwrite
export async function handleEcUpdConfirm(interaction: ButtonInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const userId  = interaction.user.id;
    const state   = requireState(userId, guildId);
    if (!state || !state.modifierType) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    await interaction.deferUpdate();
    await doSave(interaction, state);
}

// customId: ec_upd_conf_back  — back from confirmation to the form
export async function handleEcUpdConfBack(interaction: ButtonInteraction): Promise<void> {
    const state = requireState(interaction.user.id, interaction.guildId!);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildUpdateFormComponents(state) as never });
}

// customId: ec_upd_remove  — shows remove confirmation
export async function handleEcUpdRemove(interaction: ButtonInteraction): Promise<void> {
    const state = requireState(interaction.user.id, interaction.guildId!);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildRemoveConfirmation(state) as never });
}

// customId: ec_upd_rm_confirm  — user confirmed the removal
export async function handleEcUpdRmConfirm(interaction: ButtonInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const userId  = interaction.user.id;
    const state   = requireState(userId, guildId);
    if (!state || !state.modifierType) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    await interaction.deferUpdate();

    const key = state.modifierType === 'world'       ? state.effectType!
              : state.modifierType === 'stat'        ? state.stat!
              : state.proficiency!;

    const result = await removeEnvConditionModifier(guildId, state.codeName, state.modifierType, key);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    clearUpdateState(userId, guildId);
    invalidateEnvConditionInfoCache(guildId);

    const typeLabel = state.modifierType === 'world' ? 'world' : state.modifierType === 'stat' ? 'stat' : 'proficiency';
    let detail = '';
    if (state.modifierType === 'world' && state.effectType)
        detail = describeWorldModifier(state.effectType, state.relation!, state.value);
    if (state.modifierType === 'stat' && state.stat)
        detail = describeStatModifier(state.stat, state.value!);
    if (state.modifierType === 'proficiency' && state.proficiency)
        detail = describeProfModifier(state.proficiency, state.value ?? 0, state.hasDisadvantage, state.hasAdvantage);

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: colors.success,
            components:   [{ type: 10, content: `## Modifier Removed\nRemoved by <@${userId}>\n\n-# ${state.conditionName} · ${typeLabel}\n-# ${detail}` }],
        }],
    } as never);

    await interaction.deleteReply();
}

// customId: ec_upd_rm_back  — back from remove confirmation to form
export async function handleEcUpdRmBack(interaction: ButtonInteraction): Promise<void> {
    const state = requireState(interaction.user.id, interaction.guildId!);
    if (!state) { await interaction.deferUpdate(); await replyExpired(interaction); return; }

    await interaction.deferUpdate();
    await interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: buildUpdateFormComponents(state) as never });
}

// customId: ec_edit:{type}:{conditionCodeName}:{key}  — launched from the list view
export async function handleEcEdit(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return;

    const parts    = interaction.customId.split(':');
    const type     = parts[1] as 'world' | 'stat' | 'proficiency';
    const codeName = parts[2];
    const key      = parts.slice(3).join(':');
    const guildId  = interaction.guildId!;
    const userId   = interaction.user.id;

    await interaction.deferUpdate();

    const [infoResult, templateResult] = await Promise.all([
        (async () => {
            const cached = getCachedEnvConditionInfo(guildId);
            if (cached) return { success: true as const, value: cached };
            return fetchEnvConditionInfoData(guildId);
        })(),
        fetchEnvConditionTemplateData(guildId),
    ]);

    if (!infoResult.success || !templateResult.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const infoData     = infoResult.value!;
    const templateData = templateResult.value!;
    if (!getCachedEnvConditionInfo(guildId)) setCachedEnvConditionInfo(guildId, infoData);

    const condition = infoData.conditions.find(c => c.codeName === codeName);
    if (!condition) { await replyError(interaction, messages.errorGeneric); return; }

    const state: EnvConditionUpdateState = {
        guildId,
        codeName,
        conditionName:   condition.name,
        modifierType:    type,
        effectType:      null,
        relation:        null,
        value:           type === 'proficiency' ? 0 : null,
        stat:            null,
        proficiency:     null,
        hasDisadvantage: false,
        hasAdvantage:    false,
        hasExisting:     true,
        activeField:     null,
        effectTypes:     templateData.effectTypes,
        relations:       templateData.relations,
        stats:           templateData.stats,
        proficiencyDefs: templateData.proficiencyDefs,
        pickerPage:      -1,
    };

    if (type === 'world') {
        const existing   = infoData.worldModifiers.find(m => m.condition === codeName && m.effectType === key);
        state.effectType = key;
        state.relation   = existing?.relation ?? null;
        state.value      = existing !== undefined ? existing.value : null;
    } else if (type === 'stat') {
        const existing = infoData.statModifiers.find(m => m.condition === codeName && m.stat === key);
        state.stat  = key;
        state.value = existing !== undefined ? existing.value : null;
    } else {
        const existing        = infoData.proficiencyModifiers.find(m => m.condition === codeName && m.proficiency === key);
        state.proficiency     = key;
        state.value           = existing !== undefined ? existing.value           : 0;
        state.hasDisadvantage = existing !== undefined ? existing.hasDisadvantage : false;
        state.hasAdvantage    = existing !== undefined ? existing.hasAdvantage    : false;
    }

    setUpdateState(userId, guildId, state);

    await interaction.editReply({
        flags:      MessageFlags.IsComponentsV2,
        components: buildUpdateFormComponents(state) as never,
    });
}

// ── Shared save logic ─────────────────────────────────────────────────────────

async function doSave(interaction: ButtonInteraction, state: EnvConditionUpdateState): Promise<void> {
    const { modifierType, codeName, guildId } = state;

    const params = modifierType === 'world'
        ? { condition: codeName, effectType: state.effectType!, relation: state.relation!, value: state.value }
        : modifierType === 'stat'
        ? { condition: codeName, stat: state.stat!, value: state.value! }
        : { condition: codeName, proficiency: state.proficiency!, value: state.value ?? 0, hasDisadvantage: state.hasDisadvantage, hasAdvantage: state.hasAdvantage };

    const result = await upsertEnvConditionModifier(guildId, modifierType, params);

    if (!result.success) {
        await replyError(interaction, messages.errorGeneric);
        return;
    }

    const upserted = result.value!;

    if (upserted.status === 'failed') {
        await interaction.editReply({
            flags:      MessageFlags.IsComponentsV2,
            components: [{ type: 17, accent_color: colors.error, components: [{ type: 10, content: `Save failed:\n-# ${upserted.reason}` }] }],
        } as never);
        return;
    }

    clearUpdateState(interaction.user.id, guildId);
    invalidateEnvConditionInfoCache(guildId);

    const typeLabel = modifierType === 'world' ? 'world' : modifierType === 'stat' ? 'stat' : 'proficiency';
    let detail = '';
    if (upserted.modifierType === 'world')       detail = describeWorldModifier(upserted.effectType, upserted.relation, upserted.value);
    if (upserted.modifierType === 'stat')        detail = describeStatModifier(upserted.stat, upserted.value);
    if (upserted.modifierType === 'proficiency') detail = describeProfModifier(upserted.proficiency, upserted.value, upserted.hasDisadvantage, upserted.hasAdvantage);

    await interaction.followUp({
        flags:      MessageFlags.IsComponentsV2,
        components: [{
            type:         17,
            accent_color: colors.success,
            components:   [{ type: 10, content: `## Modifier Saved\nSaved by <@${interaction.user.id}>\n\n-# ${state.conditionName} · ${typeLabel}\n-# ${detail}` }],
        }],
    } as never);

    await interaction.deleteReply();
}
