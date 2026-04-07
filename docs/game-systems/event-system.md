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
  ActiveEventStep — the current or completed step of a live event


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

  choice    — presents options to players. Resolution depends on
              EventChoiceResolutionType:
                individual       — each participant votes independently
                group_average    — group's average skill roll determines outcome
                leader_designates — the leader makes the choice for the group

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
  group             — the collective group (used for group-average checks)


─────────────────────────────────────────────
6. GRANTS AND REWARDS
─────────────────────────────────────────────

Event steps can grant conditions or items to participants via EventGrantType:

  condition — apply a ConditionDef to the target participant(s)
  item      — add an item to the target participant(s) inventory

Grants are defined on EventStepDef and scoped by EventParticipantScope.
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

  LOOKUP TABLES (seed)
  EventTriggerType            — admin | patrol | hunt | crafting | foraging | clean | weather_onset | threshold | daily
  EventScopeType              — global | faction | action
  EventStepType               — narrative | choice | combat
  EventParticipantScope       — all_participants | random_participant | leader | group | housed_entities
  EventGrantType              — condition | item
  EventChoiceResolutionType   — individual | group_average | leader_designates
  EventThresholdType          — filth

  ACTIVE INSTANCES
  ActiveEvent                 — live event instance
  ActiveEventStep             — current/completed step of a live event
