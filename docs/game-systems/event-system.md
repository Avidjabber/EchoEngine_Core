EVENT SYSTEM — DESIGN REFERENCE
=================================
Last updated: 2026-04-03

[PLACEHOLDER — Schema is fully built. This document captures current known design.
Expand as implementation begins.]

This file is the authoritative reference for how events work in EchoPaw.
Read this before touching EventDef seeding, event resolution, or any system
that fires, advances, or rewards events.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

Events are structured interactive sequences that can unfold narrative,
present choices, spawn combat, apply effects, and grant rewards. They are
the primary mechanism through which the world reacts to player actions,
weather, and the passage of time.

  EventDef        — the definition (template) for an event
  ActiveEvent     — a live in-progress instance of an EventDef
  EventStepDef    — an ordered step within an event definition
  (no ActiveEventStep table — current step state is tracked via ActiveEvent.currentStepId)


─────────────────────────────────────────────
2. EVENT TRIGGERS
─────────────────────────────────────────────

Events can be triggered by several mechanisms (EventTriggerType). An EventDef may reference one or more trigger types:

  admin         — manually fired by a guild admin; participants are typically provided via signup before the chain starts
  patrol        — fires when a patrol activity completes
  hunt          — fires when a hunt activity completes
  crafting      — fires when a crafting activity completes
  foraging      — fires when a foraging activity completes
  clean         — fires when a cleaning activity completes
  weather_onset — fires when a specific WeatherState becomes active
                  (EventDef_WeatherTrigger)
  threshold      — fires when a configurable threshold condition is met with daily chance roll
                  (EventDef_ThresholdTrigger: thresholdType + thresholdValue + triggerDays + triggerOnHigh + chancePerDay + 
                   resolutionThreshold + resolutionDays + resolutionOnLow + isOngoing)
  daily         — fires on the daily tick with a base chance per day
                  (EventDef.chancePerDay)

An event may also require signup even if it is triggered by another mechanism; set `EventDef.requiresSignup = true` to force participant enrollment before the event begins.

Events can have their weights boosted by unresolved related events; see EventUnresolvedState for tracking persistent event states that increase likelihood over time.

An EventDef can also have prerequisites — other EventDefs that must have
completed at least once (within an optional time window) before this event
is eligible to fire (EventDef_Prerequisite).


─────────────────────────────────────────────
3. EVENT SCOPE
─────────────────────────────────────────────

EventScopeType determines which entities are pulled into an event:

  global  — applies to the entire guild; no specific participant group
  faction — applies to members of a specific faction
  action  — applies to participants of a specific ActionInstance

EventDef.scopeTypeId determines how the event's participants are resolved
when it fires.


─────────────────────────────────────────────
4. EVENT STEPS
─────────────────────────────────────────────

Events progress through a sequence of EventStepDef rows. Each step has a type:

  narrative — auto-resolves; posts prompt text, applies effects to effectScope
              participants, then advances to nextStepId.

  choice    — presents options to players. Each choice may trigger a skill/stat check.
              Resolution mode (EventChoiceResolutionType) determines how that check is rolled:
                individual       — each participant rolls independently; each may get a different outcome
                faction_average  — single roll using the average stat/skill across all participants
                leader_designates — leader names one entity to roll on behalf of the group

  combat    — spawns an ActiveCombat via a CombatEncounterDef.
              On combat resolution, advances to winStepId or loseStepId
              based on winningAllyFactionId.

Steps link forward to other steps via nextStepId / winStepId / loseStepId.
A null nextStepId means the event ends after this step.


─────────────────────────────────────────────
5. PARTICIPANT SCOPE
─────────────────────────────────────────────

EventParticipantScope determines which participants an effect or reward applies to:

  all_participants  — every entity in the event
  random_participant — one randomly selected participant
  leader            — the leading entity only
  group             — the collective group (used for faction_average checks)
  housed_entities   — entities currently assigned to housing structures


─────────────────────────────────────────────
6. GRANTS AND REWARDS
─────────────────────────────────────────────

Effects are attached to EventEffect rows and can belong to either a narrative step
(stepDefId set) or a choice outcome (outcomeDefId set) — exactly one per row.
Multiple EventEffect rows may be attached to the same step or outcome, each
with independent probabilities and target types.

  condition             — apply or remove a ConditionDef on targets
  item                  — add or remove items from target inventories
  location_buff         — apply a temporary Location_Effect (positive = buff, negative = debuff)
  stat_modifier         — apply a temporary stat bonus/penalty
  proficiency_modifier  — apply a temporary proficiency bonus/penalty, advantage, or disadvantage
  faction_rep           — grant or remove faction reputation points
  discipline_xp         — grant discipline experience points

Core fields on EventEffect:
- probability:    chance this effect fires (0.0–1.0)
- targetType:     what type of target (participants, camp, location, faction, items)
- relationType:   what the effect does (spawns, decrease, increase, modify, remove)
- effectValue:    what specifically is affected (e.g. "structure_durability")

Effect-type-specific magnitude fields (not a single generic value):
- locationBuffValue / locationBuffDurationHours  — for location_buff
- statModifierValue                              — for stat_modifier
- proficiencyModifierValue / HasAdvantage / HasDisadvantage — for proficiency_modifier
- factionRepValue                                — for faction_rep
- disciplineXpValue                              — for discipline_xp
- minQuantity / maxQuantity / isGain             — for item

Example: "30% chance burn condition on participants AND 30% chance 30% damage to
camp structures" — two EventEffect rows on the same outcome, each with
probability = 0.3 and different targetTypes.

XP rewards from events are handled via the action or discipline reward system
depending on the event's spawn context.


─────────────────────────────────────────────
7. SCHEMA SUMMARY
─────────────────────────────────────────────

  DEFINITIONS
  EventDef                    — event template; guild-extensible
  EventStepDef                — ordered step within an event
  EventDef_ActionType         — links event to an action type trigger
  EventDef_WeatherTrigger     — links event to a weather state trigger
  EventDef_ThresholdTrigger   — configurable threshold trigger config
  EventDef_Prerequisite       — prerequisite event that must have fired first
  EventCooldown               — per-event completion history for event-specific cooldowns
  EventUnresolvedState        — tracks unresolved events that boost related event weights

  LOOKUP TABLES (seed)
  EventTriggerType            — admin | patrol | hunt | crafting | foraging | clean | weather_onset | threshold | daily
  EventScopeType              — global | faction | action
  EventStepType               — narrative | choice | combat
  EventParticipantScope       — all_participants | random_participant | leader | group | housed_entities
  EffectType (isEvent=true)   — condition | item | location_buff | stat_modifier | proficiency_modifier | faction_rep | discipline_xp
  RelationType (isEvent=true) — spawns | decrease | increase | modify | remove
  TargetType (isEvent=true)   — participants | camp | location | faction | items
  EventChoiceResolutionType   — individual | faction_average | leader_designates
  EventThresholdType          — filth

  EFFECTS & MODIFIERS
  Location_Effect             — temporary location-wide buffs/debuffs (crop growth, hunting difficulty, etc.)
  EventEffect                 — unified event effect system (conditions, items, location effects, stat/proficiency modifiers, faction rep, discipline XP)

  ACTIVE INSTANCES
  ActiveEvent                 — live event instance; current step tracked via currentStepId (FK → EventStepDef)
