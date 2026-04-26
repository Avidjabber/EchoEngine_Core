import { ButtonInteraction, MessageComponentInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';
import { handleDenListDone, handleDenListConfig, handleDenListPage, handleDenToggle, handleDenResetDefaults, handleDenDone, handleDenDelete } from '../commands/Aggregate/server/den/configHandlers';
import { handleGsFieldButton, handleGsFieldModal, handleGsFarmButton, handleGsFarmModal, handleGsFlagToggle, handleGsSection, handleGsCancel, handleGsFinalize } from '../commands/Aggregate/server/settings/settingsHandlers';
import { handleGsiSection, handleGsiDone } from '../commands/Aggregate/server/settings/infoHandlers';
import { handleEcListPage, handleEcListFilter, handleEcListDone } from '../commands/Aggregate/config/envcondition/listHandlers';
import { handleEcInfoDetail, handleEcInfoBack, handleEcInfoPage, handleEcInfoDone } from '../commands/Aggregate/config/envcondition/infoHandlers';
import { handleEcDelPage, handleEcDelPick, handleEcDelConfirm, handleEcDelBack } from '../commands/Aggregate/config/envcondition/deleteHandlers';
import { handleProfAddModal, handleProfAddCancel, handleProfAddFinalize } from '../commands/Aggregate/config/proficiency/addHandlers';
import { handleProfUpdModal, handleProfUpdCancel, handleProfUpdUpdate, handleProfUpdFinalize } from '../commands/Aggregate/config/proficiency/updateHandlers';
import { handleProfDelCancel, handleProfDelConfirm } from '../commands/Aggregate/config/proficiency/deleteHandlers';
import { handleProfInfoDone } from '../commands/Aggregate/config/proficiency/infoHandlers';
import { handleProfListPage, handleProfListInfo, handleProfListBack, handleProfListDone } from '../commands/Aggregate/config/proficiency/listHandlers';
import { handlePaCharPage, handlePaCharPick, handlePaCharCancel }                                                                            from '../commands/Aggregate/play/action/characterSelectHandlers';
import { handlePaActionBack, handlePaActionPick }                                                                                             from '../commands/Aggregate/play/action/actionSelectHandlers';
import { handlePaCombatAddChar, handlePaCombatSignup, handlePaCombatRemove, handlePaCombatAddTeam, handlePaCombatCancel, handlePaCombatStart } from '../commands/Aggregate/play/action/combat/setupHandlers';
import { handlePaInviteAccept, handlePaInviteReject }                                                                                         from '../commands/Aggregate/play/action/combat/inviteHandlers';
import { handlePaEpickInvitePage, handlePaEpickSignupPage, handlePaEpickInvitePick, handlePaEpickSignupPick, handlePaEpickCancel }             from '../commands/Aggregate/play/action/combat/entityPickerHandlers';
import { handlePaTurnMain, handlePaTurnBonus, handlePaTurnItem, handlePaTurnEnd, handlePaTurnFlee, handlePaDeceasedMark, handlePaDeceasedSpare } from '../commands/Aggregate/play/action/combat/combatTurnHandlers';
import { handlePaCbtPick, handlePaCbtTarget, handlePaCbtConfirm, handlePaCbtBack, handlePaCbtCancel }                                           from '../commands/Aggregate/play/action/combat/combatActionHandlers';
import { handlePaReactUse, handlePaReactSkip }                                                                                                from '../commands/Aggregate/play/action/combat/combatReactionHandlers';
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
    { prefix: 'prof_add_modal',    handler: interaction => handleProfAddModal(interaction as ModalSubmitInteraction) },
    { prefix: 'prof_upd_modal',    handler: interaction => handleProfUpdModal(interaction as ModalSubmitInteraction) },
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
    { prefix: 'pa_char_page:',          handler: interaction => handlePaCharPage(interaction as ButtonInteraction)        },
    { prefix: 'pa_char_pick:',          handler: interaction => handlePaCharPick(interaction as ButtonInteraction)        },
    { prefix: 'pa_char_cancel',         handler: interaction => handlePaCharCancel(interaction as ButtonInteraction)      },
    { prefix: 'pa_action_back:',        handler: interaction => handlePaActionBack(interaction as ButtonInteraction)      },
    { prefix: 'pa_action_pick:',        handler: interaction => handlePaActionPick(interaction as ButtonInteraction)      },
    { prefix: 'pa_combat_add_char:',    handler: interaction => handlePaCombatAddChar(interaction as ButtonInteraction)   },
    { prefix: 'pa_combat_signup:',      handler: interaction => handlePaCombatSignup(interaction as ButtonInteraction)    },
    { prefix: 'pa_combat_remove:',      handler: interaction => handlePaCombatRemove(interaction as ButtonInteraction)    },
    { prefix: 'pa_combat_add_team:',    handler: interaction => handlePaCombatAddTeam(interaction as ButtonInteraction)   },
    { prefix: 'pa_combat_cancel:',      handler: interaction => handlePaCombatCancel(interaction as ButtonInteraction)    },
    { prefix: 'pa_combat_start:',       handler: interaction => handlePaCombatStart(interaction as ButtonInteraction)     },
    { prefix: 'pa_invite_accept:',      handler: interaction => handlePaInviteAccept(interaction as ButtonInteraction)    },
    { prefix: 'pa_invite_reject:',      handler: interaction => handlePaInviteReject(interaction as ButtonInteraction)    },
    { prefix: 'pa_epick_invite_page:',  handler: interaction => handlePaEpickInvitePage(interaction as ButtonInteraction) },
    { prefix: 'pa_epick_signup_page:',  handler: interaction => handlePaEpickSignupPage(interaction as ButtonInteraction) },
    { prefix: 'pa_epick_invite_pick:',  handler: interaction => handlePaEpickInvitePick(interaction as ButtonInteraction) },
    { prefix: 'pa_epick_signup_pick:',  handler: interaction => handlePaEpickSignupPick(interaction as ButtonInteraction) },
    { prefix: 'pa_epick_cancel',        handler: interaction => handlePaEpickCancel(interaction as ButtonInteraction)     },
    { prefix: 'pa_turn_main:',         handler: interaction => handlePaTurnMain(interaction as ButtonInteraction)          },
    { prefix: 'pa_turn_bonus:',        handler: interaction => handlePaTurnBonus(interaction as ButtonInteraction)         },
    { prefix: 'pa_turn_item:',         handler: interaction => handlePaTurnItem(interaction as ButtonInteraction)          },
    { prefix: 'pa_turn_end:',          handler: interaction => handlePaTurnEnd(interaction as ButtonInteraction)           },
    { prefix: 'pa_turn_flee:',          handler: interaction => handlePaTurnFlee(interaction as ButtonInteraction)          },
    { prefix: 'pa_deceased_mark:',     handler: interaction => handlePaDeceasedMark(interaction as ButtonInteraction)      },
    { prefix: 'pa_deceased_spare:',    handler: interaction => handlePaDeceasedSpare(interaction as ButtonInteraction)     },
    { prefix: 'pa_cbt_pick:',          handler: interaction => handlePaCbtPick(interaction as ButtonInteraction)           },
    { prefix: 'pa_cbt_target:',        handler: interaction => handlePaCbtTarget(interaction as ButtonInteraction)         },
    { prefix: 'pa_cbt_confirm:',       handler: interaction => handlePaCbtConfirm(interaction as ButtonInteraction)        },
    { prefix: 'pa_cbt_back:',          handler: interaction => handlePaCbtBack(interaction as ButtonInteraction)           },
    { prefix: 'pa_cbt_cancel:',        handler: interaction => handlePaCbtCancel(interaction as ButtonInteraction)         },
    { prefix: 'pa_react_use:',         handler: interaction => handlePaReactUse(interaction as ButtonInteraction)          },
    { prefix: 'pa_react_skip:',        handler: interaction => handlePaReactSkip(interaction as ButtonInteraction)         },
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
    { prefix: 'prof_add_cancel',   handler: interaction => handleProfAddCancel(interaction as ButtonInteraction) },
    { prefix: 'prof_add_finalize', handler: interaction => handleProfAddFinalize(interaction as ButtonInteraction) },
    { prefix: 'prof_upd_cancel',   handler: interaction => handleProfUpdCancel(interaction as ButtonInteraction) },
    { prefix: 'prof_upd_update',   handler: interaction => handleProfUpdUpdate(interaction as ButtonInteraction) },
    { prefix: 'prof_upd_finalize', handler: interaction => handleProfUpdFinalize(interaction as ButtonInteraction) },
    { prefix: 'prof_del_cancel',   handler: interaction => handleProfDelCancel(interaction as ButtonInteraction) },
    { prefix: 'prof_del_confirm',  handler: interaction => handleProfDelConfirm(interaction as ButtonInteraction) },
    { prefix: 'prof_info_done',    handler: interaction => handleProfInfoDone(interaction as ButtonInteraction) },
    { prefix: 'prof_list_info:',   handler: interaction => handleProfListInfo(interaction as ButtonInteraction) },
    { prefix: 'prof_list_back:',   handler: interaction => handleProfListBack(interaction as ButtonInteraction) },
    { prefix: 'prof_list_page:',   handler: interaction => handleProfListPage(interaction as ButtonInteraction) },
    { prefix: 'prof_list_done',    handler: interaction => handleProfListDone(interaction as ButtonInteraction) },
];
