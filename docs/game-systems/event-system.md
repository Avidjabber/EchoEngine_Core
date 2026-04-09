EVENT SYSTEM — DESIGN REFERENCE
=================================
Last updated: 2026-04-09 (step type redesign, check steps, choice variants, isLocation EffectTypes)

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

Current step state is tracked via ActiveEvent.currentStepId (FK → EventStepDef).
There is no separate step-history table; the chain progresses forward only.


─────────────────────────────────────────────
2. EVENT TRIGGERS & FIRING PIPELINE
─────────────────────────────────────────────

Every trigger opportunity (except admin) goes through the same two-stage pipeline:

  1. Universal 5% gate — hardcoded, not configurable. If the roll fails, no
     event fires for this opportunity.
  2. Weighted selection — the worker collects all eligible EventDefs for the
     current context and picks one via weighted selection. Effective weight =
     EventDef.baseWeight + sum of active EventWeightModifier rows. Higher weight
     means more likely to be selected when an event does fire, not more likely
     to trigger the gate.

Events can be triggered by several mechanisms (EventTriggerType). An EventDef
may reference one or more trigger types via EventDef_TriggerType:

  admin         — manually fired by a guild admin; exempt from the 5% gate;
                  participants provided via signup before the chain starts
  patrol        — one opportunity per patrol activity completion
  hunt          — one opportunity per hunt activity completion
  crafting      — one opportunity per crafting activity completion
  foraging      — one opportunity per foraging activity completion
  clean         — one opportunity per cleaning activity completion
  weather_onset — one opportunity when a specific WeatherState becomes active
                  (EventDef_WeatherTrigger)
  threshold     — one opportunity per daily tick while threshold conditions are
                  met and triggerDays has elapsed (EventDef_ThresholdTrigger)
  daily         — one opportunity per day per guild
  hourly        — one opportunity per hour per guild

An EventDef may also have prerequisites — other EventDefs that must have
completed at least once (within an optional time window) before this event is
eligible to fire (EventDef_Prerequisite).

Events can have their weights boosted by unresolved related events
(EventUnresolvedState) and by active environmental conditions
(EnvCondition_EventDef). A weather trigger can require that weather to be
active before the event is eligible at all (EventDef_WeatherTrigger.required =
true), or just boost its weight (required = false, weightMod > 0).


─────────────────────────────────────────────
3. EVENT SCOPE
─────────────────────────────────────────────

EventScope determines which entities the event is scoped to:

  global  — the entire guild; no specific faction or camp
  faction — scoped to one faction (ActiveEvent.factionId set)
  action  — scoped to a specific ActionInstance (ActiveEvent.actionInstanceId set)
  camp    — scoped to a specific Camp (ActiveEvent.campId set); used for
            filth-based and camp-local events

For camp-scoped events, the worker finds all qualifying camps and fires a
separate ActiveEvent per camp.


─────────────────────────────────────────────
4. SIGNUP
─────────────────────────────────────────────

When EventDef.requiresSignup = true, a signup window opens before the chain
begins. Players voluntarily enroll their characters from the eligible pool
(determined by scope). The app enforces EventDef.minParticipants and
EventDef.maxParticipants.

Eligibility checks (applied against the participant list before the chain begins):
  requiresLeader            — at least one participant must have Rank.canLeadEvents = true
  requiresCanMentor         — all participants must have Rank.canMentor = true
  allowApprenticesWithAdult — non-mentor ranks OK if ≥1 canMentor entity is present
  minAge                    — minimum entity age gate; null = no requirement


─────────────────────────────────────────────
5. EVENT STEPS — TYPES AND RESPONSIBILITIES
─────────────────────────────────────────────

Every step type has exactly one responsibility. The worker switches entirely on
step type when resolving a step — no step handles multiple concerns.

  NARRATIVE
  Displays prompt text in a Discord message. Anyone in the group clicks
  'next' to advance. Points to nextStepId (null = event ends).
  No effects. No choices. No randomness.

  NARRATIVE_RANDOM
  Displays prompt text. Anyone clicks 'next'. The worker then rolls against
  the EventStepRandomBranch weight table attached to this step and navigates
  to the winning branch's nextStepId. No player agency — purely system-driven
  randomness. Use this for proficiency-agnostic chance outcomes (e.g. "you
  find something — what is it?").

  CHOICE_SOLO
  Displays prompt text + N choice buttons, one per EventStepChoice row.
  The first participant to click decides; the event navigates directly to
  that choice's nextStepId. No randomness, no checks — deterministic.
  If expiresAfterMinutes is set and no one clicks within the window,
  the event cancels (worker deletes the ActiveEvent row and posts a notice). There is no fallback.

  CHOICE_LEADER
  Identical to choice_solo in structure and expiry behavior, but only the
  group leader may interact with the buttons. Non-leaders see the options
  but are locked out. Use this when the decision should belong solely to
  the event's designated leader. If no leader is present the step should
  not be reachable — enforce this at the EventDef level via requiresLeader.

  CHOICE_CONSENSUS
  Displays prompt text + N choice buttons. Every participant casts an
  individual vote by clicking their preferred option. The plurality winner
  (most votes) determines the next step. Ties are broken by the lowest
  sortOrder among tied choices — seed authors can use this to set an
  intentional default by placing it first.
  If expiresAfterMinutes is set and the window elapses, the worker tallies
  whatever votes exist and applies the same sortOrder tiebreak. If zero
  votes were cast by expiry, the event cancels.
  Valid in any event regardless of whether a leader is present — this is
  the correct choice type for volunteer/signup events where no leader role
  is guaranteed.

  PROFICIENCY_CHECK
  Displays prompt text + a 'roll' button. A participant clicks the button;
  the worker rolls the configured proficiency (checkProficiencyDefId) for
  the participant(s) specified by checkParticipantScopeId against
  checkDifficulty. The chain then navigates to passStepId (success) or
  failStepId (failure). Either may be null (event ends on that outcome).
  No player agency in the outcome — the roll is system-driven. Use this
  for skill gates, ability checks, and any outcome that should depend on
  character capability rather than player choice.

  CONDITION_CHECK
  Fully automatic — no player input, no button. The worker checks whether
  the participant(s) specified by checkParticipantScopeId currently have
  conditionCheckDefId active. Routes to passStepId (condition present) or
  failStepId (condition absent). Either may be null. Use this to branch
  a chain based on the health or status of participants without surfacing
  the check to players (e.g. "if already poisoned, take the harder path").

  ITEM_CHECK
  Fully automatic — no player input, no button. The worker checks whether
  the participant(s) specified by checkParticipantScopeId carry at least
  itemCheckMinQuantity (default: 1) of the required item — identified by
  itemCheckItemId (specific item) or itemCheckItemTypeId (any item of that
  type; set one or the other, not both). Routes to passStepId (has item)
  or failStepId (does not). Either may be null. Use this for "do you have
  the key?" gates and resource checks without making them explicit choices.

  THRESHOLD_CHECK
  Fully automatic — no player input, no button. The worker reads the
  current world-state value for thresholdCheckTypeId (e.g. filth) and
  compares it to thresholdCheckValue. thresholdCheckOnHigh = true means
  passStepId is reached when value > threshold; false means passStepId is
  reached when value < threshold. Routes to passStepId or failStepId;
  either may be null. Use this to branch an event based on the current
  state of the world mid-chain (e.g. "if filth is already high, the
  situation escalates").

  COMBAT
  Displays prompt text + an 'initiate combat' button. Spawns an
  ActiveCombat via the linked CombatEncounterDef. The chain pauses
  until combat resolves, then navigates to winStepId (players win) or
  loseStepId (players lose). Either may be null (event ends on that
  outcome). Win rewards and loss consequences live on the effect steps
  those IDs point to — not on the combat step itself.

  EFFECT
  Applies all EventEffect rows attached to this step, then displays a
  summary of what happened. Anyone clicks 'next' or 'finish' to advance.
  Points to nextStepId (null = event ends naturally).
  This is the ONLY step type that applies effects. effectScopeId sets
  the default participant scope for all effects on this step. Effects
  can be positive (items, buffs, XP) or negative (conditions, structure
  damage, spawn weight penalties) — the step type is the mechanism,
  not the tone.

  EXIT
  Terminal step. No nextStepId. Displays optional closing text. Sets:
    marksUnresolved — records an EventUnresolvedState entry, boosting
                      future weight for related events (e.g. a threat
                      that was ignored becomes more likely to return)
    endsAction      — interrupts the linked ActionInstance immediately
  Use exit for "walk away" paths, player opt-outs, and any path that
  ends the event without handing out rewards.


─────────────────────────────────────────────
6. STEP NAVIGATION SUMMARY
─────────────────────────────────────────────

  Step type          Navigation mechanism
  ─────────────────  ────────────────────────────────────────────────────────
  narrative          nextStepId (FK on EventStepDef)
  narrative_random   EventStepRandomBranch weight roll → winning row's nextStepId
  choice_solo        first participant to click → that EventStepChoice row's nextStepId
  choice_leader      leader clicks → that EventStepChoice row's nextStepId
  choice_consensus   plurality vote across all participants → winning EventStepChoice row's nextStepId
  proficiency_check  passStepId (success) or failStepId (failure) — system roll
  condition_check    passStepId (has condition) or failStepId (does not) — automatic
  item_check         passStepId (has item) or failStepId (does not) — automatic
  threshold_check    passStepId or failStepId based on world-state comparison — automatic
  combat             winStepId or loseStepId (FKs on EventStepDef)
  effect             nextStepId (FK on EventStepDef)
  exit               terminal — no outgoing navigation


─────────────────────────────────────────────
7. PARTICIPANT SCOPE
─────────────────────────────────────────────

EventParticipantScope determines which participants an effect applies to.
Used as the default scope on effect steps (EventStepDef.effectScopeId):

  all_participants   — every entity in the event
  random_participant — one randomly selected participant
  leader             — the leading entity only
  group              — the collective group
  housed_entities    — entities currently assigned to housing structures
                       in the camp (camp-scoped events)


─────────────────────────────────────────────
8. EFFECTS (EFFECT STEPS ONLY)
─────────────────────────────────────────────

EventEffect rows attach exclusively to effect steps (EventEffect.stepDefId
must reference an effect-type EventStepDef). Multiple effects may be on the
same step; each has an independent probability.

Effect types (EffectType with isEvent = true):

  condition             — apply or remove a ConditionDef on targets
  item                  — add or remove items; source is a fixed item (itemId),
                          any item of a type (itemTypeId), or a droptable roll (dropTableId)
  location_buff         — apply a temporary location-wide buff/debuff (locationBuffValue;
                          positive = buff, negative = debuff); locationBuffEffectTypeId must
                          reference an EffectType with isLocation = true
  stat_modifier         — apply a temporary stat bonus/penalty
  proficiency_modifier  — apply a temporary proficiency modifier, advantage, or disadvantage
  faction_rep           — grant or remove faction reputation points
  discipline_xp         — grant discipline experience points
  structure_damage       — deal damage to structures in the camp; flat HP or fraction of
                           maxDurability; targets all structures, random N, or a specific type
  action_output_modifier — multiply the output quantity of the triggering action (e.g. 2.0 =
                           2x output); only valid for action-scoped events
  event_weight_modifier  — add a positive or negative modifier to another event's effective
                           spawn weight; written to EventWeightModifier with optional expiry;
                           the worker sums all active modifiers at roll time

Core fields on EventEffect:
  probability  — chance this effect fires (0.0–1.0); each row is independent
  effectTypeId — drives the worker switch; all effect data is in the type-specific fields

Effect-type-specific magnitude fields:
  condition:             conditionDefId, remove
  item:                  itemId | itemTypeId | dropTableId, minQuantity, maxQuantity, isGain, targetScopeId
  location_buff:         locationBuffEffectTypeId, locationBuffValue, locationBuffDurationHours
  stat_modifier:         statModifierStatId, statModifierValue
  proficiency_modifier:  proficiencyModifierProficiencyDefId, proficiencyModifierValue,
                         proficiencyModifierHasAdvantage, proficiencyModifierHasDisadvantage
  faction_rep:           factionRepValue
  discipline_xp:         disciplineXpDisciplineDefId, disciplineXpValue
  structure_damage:      structureDamageValue, structureDamageIsMultiplier, structureDamageCount,
                         structureDamageStructureTypeId
  action_output_modifier: outputMultiplier
  event_weight_modifier: eventWeightTargetEventDefId, eventWeightValue, eventWeightDurationHours


─────────────────────────────────────────────
9. UNRESOLVED STATE & WEIGHT BOOSTING
─────────────────────────────────────────────

When an exit step with marksUnresolved = true is reached, the worker upserts
an EventUnresolvedState row for that event, incrementing unresolvedCount.

Effective weight boost = unresolvedCount × EventDef.unresolvedWeightBoost

This creates escalating scenarios: each time a threat is ignored, the same
encounter becomes more likely next time. The per-escalation value is configured
on EventDef so different events can have different escalation rates.


─────────────────────────────────────────────
10. THRESHOLD TRIGGERS
─────────────────────────────────────────────

EventDef_ThresholdTrigger configures threshold-based event firing:

  thresholdTypeId     — what is monitored (e.g. filth)
  thresholdValue      — the level at which the trigger becomes active
  triggerDays         — consecutive days threshold must be met before the daily
                        5% gate roll begins (null = gate rolls immediately)
  triggerOnHigh       — true = trigger when value > threshold (e.g. high filth)
  isOngoing           — true = event persists and re-applies effects each tick
                        until resolution conditions are met
  resolutionThreshold — separate threshold for ending the ongoing event
  resolutionDays      — consecutive days at resolution threshold to end event
  resolutionOnLow     — true = resolve when value < resolutionThreshold

Ongoing events: conditions applied by ongoing events have
EntityCondition.sourceActiveEventId set. When the event resolves, the worker
removes all EntityCondition rows with that sourceActiveEventId.

Currently seeded threshold types: filth


─────────────────────────────────────────────
11. SCHEMA SUMMARY
─────────────────────────────────────────────

  DEFINITIONS
  EventDef                    — event template; guild-extensible
  EventStepDef                — ordered step; type determines sole responsibility
  EventStepChoice             — bridge table: one button per row for choice steps
  EventStepRandomBranch       — weight table: one weighted branch per row for narrative_random steps
  EventDef_TriggerType        — which trigger types apply to this event
  EventDef_ActionType         — links event to specific action type triggers
  EventDef_WeatherTrigger     — links event to a weather state (gate or weight boost)
  EventDef_ThresholdTrigger   — configurable threshold trigger config
  EventDef_Location           — location gate or weight boost
  EventDef_Prerequisite       — prerequisite event that must have fired first
  EnvCondition_EventDef       — weight boost when an env condition is active
  EventCooldown               — per-faction/guild cooldown tracking
  EventUnresolvedState        — tracks unresolved exits; boosts future related weights

  LOOKUP TABLES (seed)
  EventTriggerType    — admin | patrol | hunt | crafting | foraging | clean |
                        weather_onset | threshold | daily | hourly
  EventScopeType      — global | faction | action | camp
  EventStepType       — narrative | narrative_random | choice_solo | choice_leader |
                        choice_consensus | proficiency_check | condition_check |
                        item_check | threshold_check | combat | effect | exit
  EventParticipantScope — all_participants | random_participant | leader |
                          group | housed_entities
  EventThresholdType  — filth
  EffectType (isEvent=true)    — condition | item | location_buff | stat_modifier |
                                 proficiency_modifier | faction_rep | discipline_xp |
                                 structure_damage | action_output_modifier |
                                 event_weight_modifier
  EffectType (isLocation=true) — spawn_rate | spawn_weight | growth_rate |
                                 harvest_yield | rot_rate
                                 (valid as locationBuffEffectTypeId on location_buff effects;
                                 see EffectType in seed-data.md for the full table)
  RelationType (isEvent=true) — spawn | increase | decrease | modify | remove
  TargetType (isEvent=true)   — participants | camp | location | faction | items

  EFFECTS & MODIFIERS
  EventEffect           — effect row; attaches only to effect steps (stepDefId required)
  Location_Effect       — temporary location-wide buffs/debuffs
  EventWeightModifier   — active spawn weight modifier on an EventDef; written by
                          event_weight_modifier effects; worker sums all active rows at roll time

  ACTIVE INSTANCES
  ActiveEvent         — live event instance; row exists only while the event is in
                        progress; campId set for camp-scoped events; expiresAt set
                        when a timed choice step is active; worker deletes the row
                        on completion, expiry, or cancellation and posts a closing
                        notice to Discord before deletion
  ActiveEvent_Participant — entity enrolled in a live event
