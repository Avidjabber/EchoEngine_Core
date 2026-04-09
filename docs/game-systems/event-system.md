EVENT SYSTEM — DESIGN REFERENCE
=================================
Last updated: 2026-04-09 (step type redesign, check steps, choice variants, isLocation EffectTypes, worked examples)

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

Signup window rules (signupWindowHours, default 18):
  - If maxParticipants is reached before the deadline → event starts immediately.
  - If minParticipants is met by the deadline → event starts with the enrolled group.
  - If minParticipants is not met by the deadline → event cancels and posts a notice.

Global idle timeout: any ActiveEvent with lastInteractionAt older than 24 hours
is expired and deleted regardless of step type or signup state.

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

  CHOICE
  Displays prompt text + N choice buttons, one per EventStepChoice row.
  One participant clicks and the event navigates directly to that choice's
  nextStepId. No randomness, no checks — deterministic.
  choiceScopeId controls who may interact:
    all_participants → the first participant to click decides
    leader           → only the group leader may click; non-leaders see
                       the buttons but cannot interact (use requiresLeader
                       on the EventDef to ensure a leader is present)
  If expiresAfterMinutes is set and no one clicks within the window,
  the event cancels. There is no fallback path.

  CHOICE_CONSENSUS
  Displays prompt text + N choice buttons. Every participant casts an
  individual vote by clicking their preferred option. Each vote is recorded
  as an EventStepVote row (unique per entity per step — prevents double-voting).
  The plurality winner (most votes) determines the next step. Ties are broken
  by the lowest sortOrder among tied EventStepChoice rows — seed authors can
  use this to set an intentional default by placing it first.
  If expiresAfterMinutes is set and the window elapses, the worker tallies
  whatever votes exist and applies the same sortOrder tiebreak. If zero
  votes were cast by expiry, the event cancels.
  The worker deletes all EventStepVote rows for the step as soon as the
  chain advances — votes are ephemeral.
  Valid in any event regardless of whether a leader is present — this is
  the correct choice type for volunteer/signup events where no leader role
  is guaranteed.

  CHECK
  Evaluates a condition and routes to passStepId (success/present/met) or
  failStepId (failure/absent/not met). Either may be null (event ends on
  that outcome). checkTypeId (EventCheckType) determines what is evaluated:

    proficiency — Displays prompt + a 'roll' button. The worker rolls
                  checkProficiencyDefId for checkParticipantScopeId
                  target(s) against checkDifficulty (Int, default 10,
                  range 1-20; higher = harder). No player agency in the
                  outcome — the roll is system-driven.

    condition   — Fully automatic; no player input. Checks whether
                  checkParticipantScopeId target(s) have conditionCheckDefId
                  active. Use this to branch silently on participant health
                  or status (e.g. "if already poisoned, take the harder path").

    item        — Fully automatic; no player input. Checks whether
                  checkParticipantScopeId target(s) carry at least
                  itemCheckMinQuantity (default: 1) of the required item,
                  identified by itemCheckItemId (specific item) or
                  itemCheckItemTypeId (any item of that type; set one,
                  not both). Use for silent "do you have the key?" gates.

    threshold   — Fully automatic; no player input; no participant scope.
                  Reads world-state thresholdCheckTypeId and compares to
                  thresholdCheckValue. thresholdCheckOnHigh = true → pass
                  when value > threshold; false → pass when value < threshold.
                  Use to branch mid-chain on world state (e.g. "if filth
                  is already high, the situation escalates").

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
  choice             participant defined by choiceScopeId clicks → that EventStepChoice row's nextStepId
  choice_consensus   plurality vote across all participants → winning EventStepChoice row's nextStepId
  check              passStepId or failStepId — outcome driven by checkTypeId evaluation
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
  probability   — chance this effect fires (0.0–1.0); each row is independent
  effectTypeId  — drives the worker switch; all effect data is in the type-specific fields
  targetScopeId — overrides the step-level effectScopeId for this specific effect; valid for
                  any per-entity effect type (condition, item, faction_rep, stat_modifier,
                  proficiency_modifier, discipline_xp); null = inherit from step effectScopeId

Effect-type-specific magnitude fields:
  condition:             conditionDefId, remove
  item:                  itemId | itemTypeId | dropTableId, minQuantity, maxQuantity, isGain
  location_buff:         locationBuffEffectTypeId, locationBuffValue, locationBuffDurationHours
  stat_modifier:         statModifierStatId, statModifierValue
  proficiency_modifier:  proficiencyModifierProficiencyDefId, proficiencyModifierValue,
                         proficiencyModifierHasAdvantage, proficiencyModifierHasDisadvantage
  faction_rep:           factionRepValue (flat rep points; per-entity when targetScopeId is set,
                         collective faction grant when null)
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

  thresholdTypeId              — what is monitored (e.g. filth)
  thresholdValue               — the level at which the trigger becomes active
  triggerDays                  — consecutive days threshold must be met before the
                                 daily 5% gate roll begins (null = gate rolls immediately)
  triggerOnHigh                — true = trigger when value > threshold (e.g. high filth)
  isOngoing                    — true = event persists and re-applies effects each tick
                                 until resolution conditions are met
  resolutionThreshold          — separate threshold for ending the ongoing event
  resolutionDays               — consecutive days at resolution threshold to end event
  resolutionOnLow              — true = resolve when value < resolutionThreshold
  conditionsLingerOnResolution — controls what happens to applied conditions on resolution:
                                 false (default): worker explicitly removes all EntityCondition
                                   rows tied to this event when it resolves
                                 true: worker only deletes the ActiveEvent row; applied
                                   conditions expire naturally on their own timer. Use this
                                   when the condition should outlast its cause — e.g. filth
                                   sickness: the camp is cleaned but entities remain sick for
                                   the remainder of their 3-day condition window.

Ongoing events: conditions applied by ongoing events have
EntityCondition.sourceActiveEventId set (FK is SetNull — rows survive ActiveEvent deletion).

On resolution, the worker's behavior depends on conditionsLingerOnResolution:
  false — worker explicitly deletes all EntityCondition rows where sourceActiveEventId
          matches, then deletes the ActiveEvent row.
  true  — worker deletes only the ActiveEvent row; the FK nulls out automatically;
          conditions tick down and expire on their own expiresAt.

Daily re-application for ongoing events: each tick where the threshold is still met,
the worker re-applies all effect steps, which upserts EntityCondition rows and resets
their expiresAt. This is what keeps a 3-day sickness condition "refreshed" for as long
as the camp remains dirty — each day the timer resets to now + 3 days.

Currently seeded threshold types: filth


─────────────────────────────────────────────
11. SCHEMA SUMMARY
─────────────────────────────────────────────

  DEFINITIONS
  EventDef                    — event template; guild-extensible
  EventStepDef                — step in a chain; navigation is entirely via FK pointers
                                (nextStepId / passStepId / failStepId / winStepId / loseStepId /
                                EventStepChoice.nextStepId) — there is no sortOrder on steps
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
  EventStepType       — narrative | narrative_random | choice | choice_consensus |
                        check | combat | effect | exit
  EventCheckType      — proficiency | condition | item | threshold
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
  RelationType        — spawn | increase | decrease

  EFFECTS & MODIFIERS
  EventEffect           — effect row; attaches only to effect steps (stepDefId required)
  Location_Effect       — temporary location-wide buffs/debuffs
  EventWeightModifier   — active spawn weight modifier on an EventDef; written by
                          event_weight_modifier effects; worker sums all active rows at roll time

  ACTIVE INSTANCES
  ActiveEvent             — live event instance; row exists only while the event is in
                            progress; campId set for camp-scoped events; expiresAt set
                            when a timed choice step is active; lastInteractionAt updated
                            by the worker on every player action (vote, choice, signup) —
                            any event idle for 24 hours is expired and deleted; worker
                            deletes the row on completion, expiry, or cancellation and
                            posts a closing notice to Discord before deletion
  ActiveEvent_Participant — entity enrolled in a live event
  EventStepVote           — one row per entity vote on a choice_consensus step;
                            unique per (activeEvent, step, entity); deleted when the
                            step resolves and the chain advances


─────────────────────────────────────────────
12. WORKED EXAMPLE — THE WANDERER WITH THE BROKEN CART
─────────────────────────────────────────────

A patrol stumbles across a stranger beside a broken cart. The group can
help, chase him off, or ignore him entirely. Helping triggers a proficiency
check; the outcome determines whether a unique weapon is awarded. Both
"help" outcomes and the "chase off" path write a location buff or debuff
to the patrol's area.

This example illustrates: action-scoped events, choice_consensus branching,
a check (proficiency) step routing to separate effect steps, multiple EventEffect
rows on one step, and a marksUnresolved exit.

  ── EventDef ──────────────────────────────────────────────────────────────
  codeName              wanderer_broken_cart
  name                  The Wanderer with the Broken Cart
  scopeId               action
  baseWeight            0.8
  unresolvedWeightBoost 0.15
  requiresLeader        true  (needed so the sword can target the leader scope)
  cooldownDays          7

  ── EventStepDef ──────────────────────────────────────────────────────────

  Step 1 — narrative (isStarter = true)
    prompt:    "Your patrol comes across a man hunched over a cart with a
                cracked wheel, goods spilled across the road..."
    nextStepId → step 2

  Step 2 — choice_consensus
    prompt:            "What does the group do?"
    expiresAfterMinutes: 30
    choices (EventStepChoice rows):
      sortOrder 1  "Help repair his cart"    → step 3
      sortOrder 2  "Chase him off"           → step 4
      sortOrder 3  "Ignore him and move on"  → step 5

  Step 3 — check (checkTypeId → proficiency)
    prompt:                  "One of you steps up to assess the damage..."
    checkProficiencyDefId  → Carpentry
    checkDifficulty          14
    checkParticipantScopeId → all_participants
    passStepId             → step 6
    failStepId             → step 7

  Step 4 — effect
    prompt:    "The group advances menacingly. He grabs what he can and flees,
                muttering as he disappears into the treeline..."
    nextStepId → step 8
    effects (EventEffect rows):
      [A] effectTypeId → location_buff
          locationBuffEffectTypeId → growth_rate
          locationBuffValue         -0.3
          locationBuffDurationHours  48  (2 days)

  Step 5 — exit
    prompt:         "The patrol keeps moving. The man watches you pass without
                     a word."
    marksUnresolved  true
    endsAction       false

  Step 6 — effect
    prompt:    "His eyes light up. He produces a blade wrapped in cloth —
                'I've been saving this for someone worthy.' He raises his
                hands and speaks a quiet blessing over the land."
    nextStepId → step 8
    effects (EventEffect rows):
      [A] effectTypeId → item
          itemId         → [unique sword]
          isGain           true
          minQuantity      1.0
          maxQuantity      1.0
          targetScopeId  → leader
      [B] effectTypeId → location_buff
          locationBuffEffectTypeId → growth_rate
          locationBuffValue         0.3
          locationBuffDurationHours  72  (3 days)

  Step 7 — effect
    prompt:    "You weren't quite able to fix it, but he smiles warmly. 'You
                tried — that's more than most.' He murmurs something and the
                air smells faintly of rain."
    nextStepId → step 8
    effects (EventEffect rows):
      [A] effectTypeId → location_buff
          locationBuffEffectTypeId → growth_rate
          locationBuffValue         0.3
          locationBuffDurationHours  72  (3 days)

  Step 8 — exit
    prompt:         "The patrol continues onward."
    marksUnresolved  false
    endsAction       false

  ── Notes ─────────────────────────────────────────────────────────────────
  - Steps 4, 6, and 7 all route to step 8 — a shared exit for all resolved
    outcomes. Only step 5 (ignore) diverges as an unresolved exit.
  - Each time the group ignores the wanderer, EventUnresolvedState.unresolvedCount
    increments, boosting this event's effective weight on future patrol rolls.
  - The location for the buff/curse is derived at runtime from the ActionInstance
    the event is scoped to — no explicit location FK is needed on the step rows.
  - Step 6 has two EventEffect rows on the same step; the worker applies both.
  - Discord button label lengths: 21 / 14 / 23 chars — all within the 80-char limit.


─────────────────────────────────────────────
13. WORKED EXAMPLE — FILTH SICKNESS OUTBREAK
─────────────────────────────────────────────

A camp-scoped ongoing threshold event. While filth remains critically high, every
entity in the camp is inflicted with a Filth Sickness condition that refreshes
daily. When the camp is finally cleaned, the event resolves — but entities remain
sick for the remainder of their 3-day condition window rather than recovering
instantly.

This example illustrates: threshold triggers, isOngoing re-application, camp scope,
condition effects, and conditionsLingerOnResolution.

  ── EventDef ──────────────────────────────────────────────────────────────
  codeName              filth_sickness_outbreak
  name                  Filth Sickness Outbreak
  scopeId               camp
  baseWeight            1.0
  cooldownDays          0    (ongoing; cooldown not meaningful here)
  requiresLeader        false

  ── EventDef_TriggerType ──────────────────────────────────────────────────
  triggerTypeId → threshold

  ── EventDef_ThresholdTrigger ─────────────────────────────────────────────
  thresholdTypeId              → filth
  thresholdValue                 0.6     (fires when filth > 60%)
  isOngoing                      true
  triggerDays                    3       (must exceed threshold for 3 consecutive days)
  triggerOnHigh                  true
  resolutionThreshold            0.3     (resolves when filth < 30%)
  resolutionDays                 2       (must stay below 30% for 2 consecutive days)
  resolutionOnLow                true
  conditionsLingerOnResolution   true    (conditions expire naturally; not wiped on resolve)

  ── EventStepDef ──────────────────────────────────────────────────────────

  Step 1 — narrative (isStarter = true)
    prompt:    "The camp's filth has reached a critical level. The stench
                permeates everything, and illness has begun to take hold
                among those living here."
    nextStepId → step 2

  Step 2 — effect
    prompt:    "Sickness spreads through the camp."
    effectScopeId → all_participants
    nextStepId    → null  (chain pauses here; worker re-applies this step each day)
    effects (EventEffect rows):
      [A] effectTypeId → condition
          conditionDefId → [Filth Sickness]
          remove           false
          probability      1.0

  ── Daily re-application ──────────────────────────────────────────────────
  Each morning tick, the worker checks the camp's filth value:
    still > 0.6 — re-applies step 2's effects; upserts EntityCondition for
                  every camp entity, resetting expiresAt = now + 3 days.
    dropped      — checks resolutionDays counter; if met, resolves the event.

  ── Resolution ────────────────────────────────────────────────────────────
  When filth stays below 0.3 for 2 consecutive days:
    - Worker deletes the ActiveEvent row.
    - FK onDelete: SetNull nulls out sourceActiveEventId on all EntityCondition
      rows — rows are NOT deleted.
    - Entities recover naturally as their individual expiresAt timestamps pass
      (up to 3 days from the last re-application tick).

  ── Notes ─────────────────────────────────────────────────────────────────
  - Step 1 (narrative) runs once on first trigger as the outbreak announcement.
    The worker only re-applies effect steps on subsequent daily ticks — narrative
    steps are not repeated.
  - No player interaction at any point. The event is fully automated.
  - The 3-day condition duration is what creates the "linger" — the worker is
    simply stopped from resetting the timer. Entities in the best case recover
    within 3 days of the camp crossing the resolution threshold.


─────────────────────────────────────────────
14. WORKED EXAMPLE — STORM STRIKES
─────────────────────────────────────────────

A camp-scoped event that fires the moment a violent storm weather state becomes
active. No player input is involved — the chain resolves automatically via a
weighted random branch that determines how badly the storm hits the camp.

This example illustrates: weather_onset triggers, narrative_random branching,
EventStepRandomBranch weight tables, item removal, and structure damage effects.

  ── EventDef ──────────────────────────────────────────────────────────────
  codeName     storm_strikes
  name         Storm Strikes
  scopeId      camp
  baseWeight   2.0
  cooldownDays 1

  ── EventDef_TriggerType ──────────────────────────────────────────────────
  triggerTypeId → weather_onset

  ── EventDef_WeatherTrigger ───────────────────────────────────────────────
  weatherStateId   → [Violent Storm]
  required           true   (event only eligible while this weather state is active)
  triggersOnOnset   true   (fires at the moment the weather state activates)
  weightMod          0.0

  ── EventStepDef ──────────────────────────────────────────────────────────

  Step 1 — narrative (isStarter = true)
    prompt:    "A violent storm tears through the camp overnight, battering
                structures and tearing at exposed stores."
    nextStepId → step 2

  Step 2 — narrative_random
    prompt:    "When dawn breaks, the camp takes stock of the damage."
    branches (EventStepRandomBranch rows):
      weight 5  description "no damage"         → step 3
      weight 3  description "supplies spoiled"  → step 4
      weight 1  description "structure hit"     → step 5

  Step 3 — exit
    prompt:         "The camp holds firm. The storm passes without serious damage."
    marksUnresolved  false

  Step 4 — effect
    prompt:    "The storm tears through your food stores. Much of it is
                exposed and spoiled beyond saving."
    nextStepId → step 6
    effects (EventEffect rows):
      [A] effectTypeId → item
          itemTypeId     → [Food]
          isGain           false
          minQuantity      2.0
          maxQuantity      5.0

  Step 5 — effect
    prompt:    "One of your structures takes a serious hit, its walls cracked
                and supports weakened by the force of the storm."
    nextStepId → step 6
    effects (EventEffect rows):
      [A] effectTypeId               → structure_damage
          structureDamageValue         0.15
          structureDamageIsMultiplier  true   (15% of maxDurability)
          structureDamageCount         1      (one randomly selected structure)

  Step 6 — exit
    prompt:         "The storm passes. The camp endures, though not without cost."
    marksUnresolved  false

  ── Notes ─────────────────────────────────────────────────────────────────
  - Steps 4 and 5 converge at step 6 — shared exit for all damaged outcomes.
    Step 3 is a separate exit for the clean outcome.
  - The narrative_random branch is resolved by the worker with no player input.
    Seeder-controlled weights (5 / 3 / 1) give roughly 56% / 33% / 11% odds.
  - No EventStepChoice rows needed — narrative_random uses EventStepRandomBranch,
    not choice buttons.
  - weather_onset fires on the hourly worker when a new weather state is detected —
    it still goes through the standard 5% gate like any other trigger type. Admin
    is the only trigger exempt from the gate.


─────────────────────────────────────────────
15. WORKED EXAMPLE — THE MISSING CHILD
─────────────────────────────────────────────

On a random hourly tick, word spreads through a camp that a child has gone missing.
The event opens a signup window for 1–11 volunteers. Once the group assembles, they
vote on whether to search inside the camp or beyond its walls — each path walks
through a few narrative beats before the child is found and brought home.

This example illustrates: hourly triggers, camp scope, requiresSignup with min/max
bounds, choice_consensus with an expiry window, two parallel narrative paths that
converge at a shared effect and exit.

  ── EventDef ──────────────────────────────────────────────────────────────
  codeName        missing_child
  name            The Missing Child
  scopeId         camp
  baseWeight      0.5
  requiresSignup    true
  minParticipants   1
  maxParticipants   11
  signupWindowHours 18
  cooldownDays      14

  ── EventDef_TriggerType ──────────────────────────────────────────────────
  triggerTypeId → hourly

  ── EventStepDef ──────────────────────────────────────────────────────────

  Step 1 — narrative (isStarter = true)
    prompt:    "Word spreads quickly through the camp — a child has gone
                missing. No one has seen them since this morning. Volunteers
                are being called to help search."
    nextStepId → step 2
    (signup window is open while this step is displayed; window lasts
     signupWindowHours = 18 hours; chain advances when maxParticipants
     is hit early or the window closes with minParticipants met;
     cancels if minParticipants is not met by the deadline)

  Step 2 — choice_consensus
    prompt:             "Where does the group begin the search?"
    expiresAfterMinutes: 20
    choices (EventStepChoice rows):
      sortOrder 1  "Search inside the camp"        → step 3
      sortOrder 2  "Search outside the camp walls" → step 6

  ── INSIDE PATH ───────────────────────────────────────────────────────────

  Step 3 — narrative
    prompt:    "The group fans out through the camp, checking shelters,
                storage huts, and shaded corners one by one."
    nextStepId → step 4

  Step 4 — narrative
    prompt:    "Near the supply huts, someone spots a small muddy footprint
                pressed into the soft earth — and then another."
    nextStepId → step 5

  Step 5 — narrative
    prompt:    "Following the trail, you find the child curled up asleep
                behind a stack of cured pelts, completely unaware of the
                commotion they caused."
    nextStepId → step 9

  ── OUTSIDE PATH ──────────────────────────────────────────────────────────

  Step 6 — narrative
    prompt:    "The group slips through the camp perimeter and fans out into
                the surrounding terrain, calling out as they go."
    nextStepId → step 7

  Step 7 — narrative
    prompt:    "A set of small tracks leads toward the treeline — recently
                made, pressed deep into soft earth after last night's rain."
    nextStepId → step 8

  Step 8 — narrative
    prompt:    "You follow the trail into the edge of the woods and find the
                child sitting beneath a tree, proudly clutching a fistful of
                wildflowers they had gone to pick as a surprise."
    nextStepId → step 9

  ── SHARED RESOLUTION ─────────────────────────────────────────────────────

  Step 9 — effect
    prompt:    "The child is brought safely home. Relief washes over the camp
                as word spreads that they have been found."
    nextStepId → step 10
    effects (EventEffect rows):
      [A] effectTypeId  → faction_rep
          factionRepValue  50
          targetScopeId  → all_participants   (each volunteer receives 50 rep individually)

  Step 10 — exit
    prompt:         "Life in the camp returns to normal."
    marksUnresolved  false
    endsAction       false

  ── Notes ─────────────────────────────────────────────────────────────────
  - Steps 5 and 8 (the "found" narratives) both route to step 9 — the two
    paths are otherwise fully independent.
  - choice_consensus with expiresAfterMinutes = 20 means the group has 20
    minutes to vote. If votes are cast, the plurality wins (sortOrder tiebreak).
    If no votes are cast before expiry, the event cancels.
  - Button label lengths: 26 / 30 chars — both within Discord's 80-char limit.
  - This event fires on the hourly worker, passes the 5% gate, and is then
    eligible for any camp in the guild. Because it is camp-scoped, the worker
    fires a separate ActiveEvent per qualifying camp if multiple camps exist.
