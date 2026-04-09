EVENT SYSTEM — DESIGN REFERENCE
=================================
Last updated: 2026-04-09

This file is the authoritative reference for how events work in EchoPaw.
Read this before touching EventDef seeding, event resolution, or any system
that fires, advances, or rewards events.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

Events are structured interactive sequences that unfold narrative, present
choices, spawn combat, apply effects, and grant rewards. They are the primary
mechanism through which the world reacts to player actions, weather, filth
levels, and the passage of time.

  EventDef     — the definition (template) for an event
  ActiveEvent  — a live in-progress instance of an EventDef
  EventStepDef — an ordered step within an event definition

(no ActiveEventStep table — current step state is tracked via ActiveEvent.currentStepId)


─────────────────────────────────────────────
2. EVENT TRIGGERS
─────────────────────────────────────────────

Events can be triggered by several mechanisms (EventTriggerType). An EventDef
may reference one or more trigger types via EventDef_TriggerType:

  admin         — manually fired by a guild admin; participants provided via
                  signup before the chain starts
  patrol        — fires when a patrol activity completes
  hunt          — fires when a hunt activity completes
  crafting      — fires when a crafting activity completes
  foraging      — fires when a foraging activity completes
  clean         — fires when a cleaning activity completes
  weather_onset — fires when a specific WeatherState becomes active
                  (EventDef_WeatherTrigger)
  threshold     — fires when a configurable threshold condition is met with a
                  daily chance roll (EventDef_ThresholdTrigger)
  daily         — worker rolls once per day per guild; EventDef.chancePerDay
                  controls probability
  hourly        — worker rolls once per hour per guild; EventDef.chancePerHour
                  controls probability

An EventDef may also have prerequisites — other EventDefs that must have
completed at least once (within an optional time window) before this event is
eligible to fire (EventDef_Prerequisite).

Events can have their weights boosted by unresolved related events
(EventUnresolvedState) and by active environmental conditions
(EnvCondition_EventDef).

A weather trigger can optionally require that weather to be active before the
event is eligible at all (EventDef_WeatherTrigger.required = true), or just
boost its weight (required = false, weightMod > 0).


─────────────────────────────────────────────
3. EVENT SCOPE
─────────────────────────────────────────────

EventScope determines which entities the event is scoped to:

  global  — the entire guild; participant group is guild-wide
  faction — scoped to one faction (ActiveEvent.factionId set)
  action  — scoped to a specific ActionInstance (ActiveEvent.actionInstanceId set)
  camp    — scoped to a specific Camp (ActiveEvent.campId set); used for
            filth-based and camp-local events

EventDef.scopeId determines how the event's participants are resolved when it
fires. For camp-scoped events, the worker finds all camps meeting the trigger
condition and fires a separate ActiveEvent per qualifying camp.


─────────────────────────────────────────────
4. SIGNUP
─────────────────────────────────────────────

When EventDef.requiresSignup = true, a signup window opens before the chain
begins. Players voluntarily enroll their characters from the eligible pool
(determined by scope). The app enforces EventDef.minParticipants and
EventDef.maxParticipants during this window.

Signup can apply to any trigger type — an admin event, a weather event, or a
daily event can all require signup before the chain starts.

Eligibility checks (applied against the participant list before chain begins):
  requiresLeader            — at least one participant must have Rank.canLeadEvents = true
  requiresCanMentor         — all participants must have Rank.canMentor = true
  allowApprenticesWithAdult — non-mentor ranks OK if ≥1 canMentor entity is present
  minAge                    — minimum entity age gate; null = no requirement


─────────────────────────────────────────────
5. EVENT STEPS
─────────────────────────────────────────────

Events progress through a sequence of EventStepDef rows. Each step has a type:

  narrative — auto-resolves; posts prompt text, applies effects to effectScope
              participants, then advances to nextStepId. No player input.

  choice    — presents EventChoiceDef options. Each choice may trigger a
              skill/stat check; resolution mode determines how that check is
              rolled (EventChoiceResolutionType):
                individual       — each participant rolls independently; each
                                   may get a different outcome
                faction_average  — single roll using average stat/skill across
                                   all participants
                leader_designates — leader names one entity to roll on behalf
                                    of the group

  combat    — spawns an ActiveCombat via a CombatEncounterDef.
              Pauses the chain until combat resolves, then advances to
              winStepId or loseStepId.

Step navigation:
  narrative → nextStepId (null = event ends)
  choice    → EventOutcomeDef.nextStepId (null = event ends)
  combat    → winStepId or loseStepId (null = event ends)

isStarter = true on exactly one step per EventDef (the entry point).
sortOrder is a display/seeding hint only; execution follows the step graph.

Choice steps may have an expiry window (expiresAfterMinutes). When the window
elapses, the step auto-resolves using defaultChoiceDefId. null = no limit.


─────────────────────────────────────────────
6. PARTICIPANT SCOPE
─────────────────────────────────────────────

EventParticipantScope determines which participants an effect or reward applies to:

  all_participants   — every entity in the event
  random_participant — one randomly selected participant
  leader             — the leading entity only
  group              — the collective group (used for faction_average checks)
  housed_entities    — entities currently assigned to housing structures in the
                       camp (for camp-scoped events like infestations)


─────────────────────────────────────────────
7. EFFECTS
─────────────────────────────────────────────

EventEffect rows attach to either a narrative step (stepDefId set) or a choice
outcome (outcomeDefId set) — exactly one per row, app-enforced. Multiple rows
may attach to the same step or outcome; each has an independent probability.

Effect types (EffectType with isEvent = true):

  condition             — apply or remove a ConditionDef on targets
  item                  — add or remove items; source can be a fixed item
                          (itemId), any item of a type (itemTypeId), or a
                          droptable roll (dropTableId)
  location_buff         — apply a temporary location-wide buff/debuff via
                          a Location_Effect (positive value = buff,
                          negative = debuff); covers crop growth rate,
                          hunting difficulty, etc.
  stat_modifier         — apply a temporary stat bonus/penalty
  proficiency_modifier  — apply a temporary proficiency modifier, advantage,
                          or disadvantage
  faction_rep           — grant or remove faction reputation points
  discipline_xp         — grant discipline experience points
  structure_damage      — deal damage to structures in the camp; can target
                          all structures, a random N, or a specific StructureType;
                          value is flat HP or a fraction of maxDurability
  action_output_modifier — multiply the output quantity of the triggering
                           crafting/action (e.g. 2.0 = 2x output); only valid
                           for action-scoped events

Core fields on EventEffect:
  probability    — chance this effect fires (0.0–1.0); independent per row
  targetType     — what is being affected: participants | camp | location |
                   faction | items
  relationType   — what the effect does: spawn | increase | decrease |
                   modify | remove
  effectValue    — optional string tag for what specifically is affected
                   (e.g. "structure_durability")

Effect-type-specific fields:

  condition:
    conditionDefId, remove (true = remove the condition; false = apply it)

  item:
    itemId OR itemTypeId OR dropTableId (mutually exclusive)
    minQuantity, maxQuantity, isGain (true = add; false = remove)
    targetScopeId (EventParticipantScope for who gains/loses the item)

  location_buff:
    locationBuffEffectTypeId, locationBuffValue (positive = buff; negative = debuff)
    locationBuffDurationHours (null = permanent until removed)

  stat_modifier:
    statModifierStatId, statModifierValue (0.1 = +10%; -0.15 = -15%)

  proficiency_modifier:
    proficiencyModifierProficiencyDefId, proficiencyModifierValue
    proficiencyModifierHasAdvantage, proficiencyModifierHasDisadvantage

  faction_rep:
    factionRepValue (0.15 = +15% rep; -0.1 = -10% rep)

  discipline_xp:
    disciplineXpDisciplineDefId, disciplineXpValue (fraction of level XP)

  structure_damage:
    structureDamageValue         — amount: flat HP or fraction of maxDurability
    structureDamageIsMultiplier  — true = fraction; false = flat HP
    structureDamageCount         — null = all structures; N = N random structures
    structureDamageStructureTypeId — optional: filter to specific StructureType

  action_output_modifier:
    outputMultiplier — e.g. 2.0 = double output from the triggering action


─────────────────────────────────────────────
8. CHOICE OUTCOMES
─────────────────────────────────────────────

Each EventChoiceDef has one or more EventOutcomeDef rows. The outcome is
selected by weighted random roll (modified by any skill check result). Fields:

  weight          — relative selection weight; higher = more likely
  effectScopeId   — EventParticipantScope: who the effects apply to
  endsAction      — true = the linked ActionInstance is immediately interrupted
  marksUnresolved — true = selecting this outcome records an EventUnresolvedState
                    entry, boosting future weight for related events (e.g. skipping
                    a fight increases likelihood the same enemy returns)
  nextStepId      — which step follows; null = event ends after this outcome


─────────────────────────────────────────────
9. THRESHOLD TRIGGERS
─────────────────────────────────────────────

EventDef_ThresholdTrigger configures threshold-based event firing:

  thresholdTypeId    — what is being monitored (e.g. filth)
  thresholdValue     — the level at which the trigger becomes active
  chancePerDay       — daily roll probability once trigger conditions are met
  triggerDays        — consecutive days threshold must be met before rolls begin
                       (null = immediate)
  triggerOnHigh      — true = trigger when value > threshold (e.g. high filth)
  isOngoing          — true = event persists and re-applies effects each tick
                       until resolution conditions are met
  resolutionThreshold — separate threshold for ending the ongoing event
                        (null = same as thresholdValue)
  resolutionDays     — consecutive days at resolution threshold to end event
                       (null = manual resolution only)
  resolutionOnLow    — true = resolve when value < resolutionThreshold

Ongoing events (isOngoing = true):
  When the event fires, effects are applied (e.g. conditions on housed_entities).
  Conditions applied by ongoing events have EntityCondition.sourceActiveEventId
  set to the ActiveEvent. When the event resolves, the worker removes all
  EntityCondition rows with that sourceActiveEventId.

Currently seeded threshold types:
  filth — tracks camp-level filth as a fraction of the filth cap


─────────────────────────────────────────────
10. UNRESOLVED STATE & WEIGHT BOOSTING
─────────────────────────────────────────────

EventUnresolvedState tracks events that were not resolved (e.g. a threat that
was ignored). When an EventOutcomeDef with marksUnresolved = true is selected,
the worker upserts an EventUnresolvedState row:

  unresolvedCount — incremented each time the event goes unresolved
  weightBoost     — added to the event's effective weight per unresolved instance

This allows escalating scenarios: each time a patrol skips a fight, the same
encounter becomes more likely on the next patrol.


─────────────────────────────────────────────
11. SCHEMA SUMMARY
─────────────────────────────────────────────

  DEFINITIONS
  EventDef                    — event template; guild-extensible
  EventStepDef                — ordered step within an event
  EventDef_TriggerType        — which trigger types apply to this event
  EventDef_ActionType         — links event to specific action type triggers
  EventDef_WeatherTrigger     — links event to a weather state trigger
  EventDef_ThresholdTrigger   — configurable threshold trigger config
  EventDef_Location           — location gate or weight boost
  EventDef_Prerequisite       — prerequisite event that must have fired first
  EnvCondition_EventDef       — weight boost when an env condition is active
  EventCooldown               — per-faction/guild cooldown tracking
  EventUnresolvedState        — tracks unresolved events that boost related weights

  LOOKUP TABLES (seed)
  EventTriggerType            — admin | patrol | hunt | crafting | foraging |
                                clean | weather_onset | threshold | daily | hourly
  EventScopeType              — global | faction | action | camp
  EventStepType               — narrative | choice | combat
  EventParticipantScope       — all_participants | random_participant | leader |
                                group | housed_entities
  EventChoiceResolutionType   — individual | faction_average | leader_designates
  EventThresholdType          — filth
  EffectType (isEvent=true)   — condition | item | location_buff | stat_modifier |
                                proficiency_modifier | faction_rep | discipline_xp |
                                structure_damage | action_output_modifier
  RelationType (isEvent=true) — spawn | increase | decrease | modify | remove
  TargetType (isEvent=true)   — participants | camp | location | faction | items

  EFFECTS & MODIFIERS
  EventEffect                 — unified effect row (step or outcome); see section 7
  Location_Effect             — temporary location-wide buffs/debuffs

  ACTIVE INSTANCES
  ActiveEvent                 — live event instance; current step tracked via
                                currentStepId (FK → EventStepDef);
                                campId set for camp-scoped events
  ActiveEvent_Participant     — entity enrolled in a live event
