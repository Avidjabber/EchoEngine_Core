import { ButtonInteraction, MessageComponentInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';
import { handleDenListDone, handleDenListConfig, handleDenListPage, handleDenToggle, handleDenResetDefaults, handleDenDone, handleDenDelete } from '../commands/Aggregate/server/den/configHandlers';
import { handleGsFieldButton, handleGsFieldModal, handleGsFarmButton, handleGsFarmModal, handleGsFlagToggle, handleGsSection, handleGsCancel, handleGsFinalize } from '../commands/Aggregate/server/settings/settingsHandlers';
import { handleGsiSection, handleGsiDone } from '../commands/Aggregate/server/settings/infoHandlers';
import { handleEcListPage, handleEcListFilter, handleEcListDone } from '../commands/Aggregate/config/envcondition/listHandlers';
import { handleEcInfoDetail, handleEcInfoBack, handleEcInfoPage, handleEcInfoDone } from '../commands/Aggregate/config/envcondition/infoHandlers';
import { handleEcDelPage, handleEcDelPick, handleEcDelConfirm, handleEcDelBack } from '../commands/Aggregate/config/envcondition/deleteHandlers';
import {
    handleEcEdit,
    handleEcUpdCpage, handleEcUpdCpick, handleEcUpdCback,
    handleEcUpdType, handleEcUpdEt, handleEcUpdRel, handleEcUpdStat, handleEcUpdProf,
    handleEcUpdSet, handleEcUpdUnset,
    handleEcUpdVal, handleEcUpdDisadv, handleEcUpdAdv, handleEcUpdRetype, handleEcUpdSave, handleEcUpdCancel,
    handleEcUpdConfirm, handleEcUpdConfBack,
    handleEcUpdRemove, handleEcUpdRmConfirm, handleEcUpdRmBack,
    handleEcUpdValModal,
} from '../commands/Aggregate/config/envcondition/updateHandlers';

type AnyComponentInteraction =
    | MessageComponentInteraction
    | StringSelectMenuInteraction
    | ModalSubmitInteraction;

export interface ComponentHandler {
    prefix: string;
    handler: (interaction: AnyComponentInteraction) => Promise<void> | void;
}

// ── Modal handlers ─────────────────────────────────────────────────────────────
export const modalHandlers: ComponentHandler[] = [
    { prefix: 'gs_field_modal:',   handler: interaction => handleGsFieldModal(interaction as ModalSubmitInteraction) },
    { prefix: 'gs_farm_modal:',    handler: interaction => handleGsFarmModal(interaction as ModalSubmitInteraction) },
    { prefix: 'ec_upd_val_modal',  handler: interaction => handleEcUpdValModal(interaction as ModalSubmitInteraction) },
];

// ── Select menu handlers ───────────────────────────────────────────────────────
export const selectMenuHandlers: ComponentHandler[] = [
    { prefix: 'ec_list_filter', handler: interaction => handleEcListFilter(interaction as StringSelectMenuInteraction) },
    { prefix: 'ec_upd_type',    handler: interaction => handleEcUpdType(interaction as StringSelectMenuInteraction) },
    { prefix: 'ec_upd_et',      handler: interaction => handleEcUpdEt(interaction as StringSelectMenuInteraction) },
    { prefix: 'ec_upd_rel',     handler: interaction => handleEcUpdRel(interaction as StringSelectMenuInteraction) },
    { prefix: 'ec_upd_stat',    handler: interaction => handleEcUpdStat(interaction as StringSelectMenuInteraction) },
    { prefix: 'ec_upd_prof',    handler: interaction => handleEcUpdProf(interaction as StringSelectMenuInteraction) },
];

// ── Button handlers ────────────────────────────────────────────────────────────
export const buttonHandlers: ComponentHandler[] = [
    { prefix: 'den_list_done',    handler: interaction => handleDenListDone(interaction as ButtonInteraction) },
    { prefix: 'den_list_config:', handler: interaction => handleDenListConfig(interaction as ButtonInteraction) },
    { prefix: 'den_list_page:',   handler: interaction => handleDenListPage(interaction as ButtonInteraction) },
    { prefix: 'den_toggle:',          handler: interaction => handleDenToggle(interaction as ButtonInteraction) },
    { prefix: 'den_reset_defaults:',  handler: interaction => handleDenResetDefaults(interaction as ButtonInteraction) },
    { prefix: 'den_done:',            handler: interaction => handleDenDone(interaction as ButtonInteraction) },
    { prefix: 'den_delete:',      handler: interaction => handleDenDelete(interaction as ButtonInteraction) },
    { prefix: 'gs_field_btn:',    handler: interaction => handleGsFieldButton(interaction as ButtonInteraction) },
    { prefix: 'gs_farm_btn:',     handler: interaction => handleGsFarmButton(interaction as ButtonInteraction) },
    { prefix: 'gs_flag_toggle:',  handler: interaction => handleGsFlagToggle(interaction as ButtonInteraction) },
    { prefix: 'gs_section:',      handler: interaction => handleGsSection(interaction as ButtonInteraction) },
    { prefix: 'gs_cancel',        handler: interaction => handleGsCancel(interaction as ButtonInteraction) },
    { prefix: 'gs_finalize',      handler: interaction => handleGsFinalize(interaction as ButtonInteraction) },
    { prefix: 'gsi_section:',     handler: interaction => handleGsiSection(interaction as ButtonInteraction) },
    { prefix: 'gsi_done',         handler: interaction => handleGsiDone(interaction as ButtonInteraction) },
    { prefix: 'ec_edit:',        handler: interaction => handleEcEdit(interaction as ButtonInteraction) },
    { prefix: 'ec_list_page:',   handler: interaction => handleEcListPage(interaction as ButtonInteraction) },
    { prefix: 'ec_list_done',    handler: interaction => handleEcListDone(interaction as ButtonInteraction) },
    { prefix: 'ec_info_d:',      handler: interaction => handleEcInfoDetail(interaction as ButtonInteraction) },
    { prefix: 'ec_info_back:',   handler: interaction => handleEcInfoBack(interaction as ButtonInteraction) },
    { prefix: 'ec_info_page:',   handler: interaction => handleEcInfoPage(interaction as ButtonInteraction) },
    { prefix: 'ec_info_done',    handler: interaction => handleEcInfoDone(interaction as ButtonInteraction) },
    { prefix: 'ec_del_page:',    handler: interaction => handleEcDelPage(interaction as ButtonInteraction) },
    { prefix: 'ec_del_pick:',    handler: interaction => handleEcDelPick(interaction as ButtonInteraction) },
    { prefix: 'ec_del_confirm:', handler: interaction => handleEcDelConfirm(interaction as ButtonInteraction) },
    { prefix: 'ec_del_back:',    handler: interaction => handleEcDelBack(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_cpage:',   handler: interaction => handleEcUpdCpage(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_cpick:',   handler: interaction => handleEcUpdCpick(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_cback',    handler: interaction => handleEcUpdCback(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_set:',     handler: interaction => handleEcUpdSet(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_unset',    handler: interaction => handleEcUpdUnset(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_val',      handler: interaction => handleEcUpdVal(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_disadv',   handler: interaction => handleEcUpdDisadv(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_adv',     handler: interaction => handleEcUpdAdv(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_retype',   handler: interaction => handleEcUpdRetype(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_save',      handler: interaction => handleEcUpdSave(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_confirm',    handler: interaction => handleEcUpdConfirm(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_conf_back',  handler: interaction => handleEcUpdConfBack(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_remove',     handler: interaction => handleEcUpdRemove(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_rm_confirm', handler: interaction => handleEcUpdRmConfirm(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_rm_back',    handler: interaction => handleEcUpdRmBack(interaction as ButtonInteraction) },
    { prefix: 'ec_upd_cancel',     handler: interaction => handleEcUpdCancel(interaction as ButtonInteraction) },
];
