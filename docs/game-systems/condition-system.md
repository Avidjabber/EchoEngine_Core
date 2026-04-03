CONDITION SYSTEM — DESIGN REFERENCE
====================================
Last updated: 2026-04-03

This file is the authoritative reference for how conditions work in EchoPaw.
Read this before touching any condition seeding or condition-adjacent code.


─────────────────────────────────────────────
1. CONDITION TYPES
─────────────────────────────────────────────

Timed
  - Resolves automatically after maxDays.
  - No CON roll. Progression tracks elapsed days (0 → maxDays).
  - spawnThreshold: if set, a 'spawn' link fires once progression reaches
    (spawnThreshold × progressionCap). Example: Rat Bite (maxDays 3,
    progressionCap 3.0, spawnThreshold 0.1) → check fires at progression 0.3
    (roughly day 1 of 3).
  - RULE: if a Timed condition has spawnThreshold, progressionCap MUST be set.
    Set progressionCap = maxDays (one tick per day → condition reaches cap on
    the final day). Without it, the threshold expression is undefined.
  - Use for: wounds, poisoning — things that resolve on their own unless
    something goes wrong.

Progressive
  - Cat rolls CON every day against dailyRollDC.
  - progressionCap MUST be set, or worsen/spawn links can never trigger.
  - Starts at progressionCap / 2.
  - Roll < DC  → progression INCREASES by (DC − roll) / DC
  - Roll > DC  → progression DECREASES by (roll − DC) / DC
  - Roll = DC  → no change
  - Reaches cap → worsen link fires (or isFatalAtCap if no link).
  - Reaches 0  → recover link fires (or condition clears if no link).
  - Use for: illnesses with natural recovery curves — coughs, infections,
    diseases that can go either way.

Chronic
  - Same CON roll mechanic as Progressive.
  - progressionCap MUST be set (spawn/worsen links need it).
  - Never self-clears at 0 — progression floors at 0 and stays.
  - spawnThreshold: spawn link fires when progression >= (threshold × cap).
  - Use for: asthma, mange, falling sickness — permanent conditions that
    flare up rather than resolve.

LifeCycle
  - Advances after maxDays (like Timed), then fires worsen link.
  - No CON roll. No spawn. Just a timer chain.
  - Use for: pregnancy stages, nursing — biological progressions with
    fixed durations.

Permanent
  - No rolls, no timers, no links. Stays forever.
  - Use for: broken leg, deafness, lost eye.


─────────────────────────────────────────────
2. THE BASELINE CAT
─────────────────────────────────────────────

The "average" cat has CON 10 → modifier +0.
All progression cap decisions should be calibrated against this baseline.

With a d20 roll (no modifier), average roll = 10.5.

Net daily change at each DC level (CON 10 baseline, no medication):

  DC 5   → improves ~0.47/day  (very easy to beat; mostly floors at 0)
  DC 6   → improves ~0.40/day  (easy)
  DC 8   → improves ~0.31/day  (comfortable recovery for healthy cats)
  DC 10  → improves ~0.05/day  (coin-flip; barely recovers without help)
  DC 12  → worsens  ~0.13/day  (needs herb treatment to arrest)
  DC 13  → worsens  ~0.22/day  (needs treatment)
  DC 14  → worsens  ~0.25/day  (dangerous without medicine)
  DC 16  → worsens  ~0.34/day  (urgent — days matter)
  DC 20  → worsens  ~0.48/day  (nearly always worsens; best medicine barely helps)
  DC 25  → worsens  ~0.58/day  (CON 10 cat can NEVER beat this; inevitable decline)

"Worsens" means the condition moves toward its cap.
"Improves" means it moves toward 0.


─────────────────────────────────────────────
3. MEDICATION / HERBS
─────────────────────────────────────────────

Medication directly modifies EntityCondition.progressionValue — it is NOT
a bonus to the CON roll. The CON roll happens independently each day; medicine
is then applied on top.

A cat may receive treatment for a specific condition at most ONCE PER DAY.
This is enforced via EntityTreatmentLog (one row per entityConditionId per day).

Treatment quality range (progressionChange subtracted):
  ~0.1–0.2  Raw herb, low-skill administrant
  ~0.3–0.4  Prepared herb or average skill
  ~0.5–0.6  Crafted poultice, high skill

So for a DC 8 condition (avg cat improves 0.31/day naturally):
  - Good medicine (+0.5) → net improvement ~0.81/day — clears fast
  - No medicine        → net improvement ~0.31/day — clears in ~11 days

For a DC 16 condition (avg cat worsens 0.34/day):
  - Good medicine (+0.5) → net improvement ~0.16/day — slowly recovers
  - Average medicine (+0.3) → net −0.04/day — barely holds the line
  - No medicine           → worsens 0.34/day → death in ~7 days

For a DC 25 condition (avg cat worsens ~0.58/day, can never beat DC):
  - Any medicine only slows inevitable decline (dementia, terminal illness)
  - Even best medicine (+0.6) leaves net worsening of ~−0.02/day


─────────────────────────────────────────────
4. PROGRESSION CAP GUIDELINES
─────────────────────────────────────────────

The condition spawns at cap/2. Worsen fires at cap. Recover fires at 0.
Design the cap to answer: "How many days does it take an UNTREATED average
cat to go from spawn point to the next stage?"

Formula (approximate):
  days_to_worsen = (cap / 2) / net_worsening_rate
  days_to_recover = (cap / 2) / net_improvement_rate

Reference caps (approved):

  CONDITION            DC   CAP    UNTREATED DAYS TO WORSEN (avg cat)
  ────────────────────────────────────────────────────────────────────
  Cough                8    7.0    n/a (avg cat improves; ~11d to clear)
  Upset Stomach        8    3.0    n/a (improves; ~5d to clear)
  Confusion            8    2.0    n/a (symptom-level; ~3d)
  Disorientation       8    2.0    n/a (symptom-level; ~3d)
  Minor Infection      8    7.0    n/a (avg cat improves; ~11d to clear)
  Nausea               8    3.0    n/a
  Congestion           8    5.0    n/a
  Difficulty Breathing 8    2.0    n/a (symptom)
  Wheezing             8    2.0    n/a (symptom)
  Asthma (Chronic)     6    5.0    episodes spawn at 80% threshold
  Falling Sickness (C) 5    5.0    episodes spawn at 70% threshold
  WhiteCough           8    7.0    n/a (avg cat recovers; cold/low CON tips it)
  Flu                  10   14.0   ~140d naturally (barely improves; needs herbs)
  GreenCough           13   5.0    ~11d to BlackCough (must treat)
  Moderate Infection   12   5.0    ~20d to Major (needs treatment)
  Pneumonia            14   7.0    ~14d to death (urgent)
  Major Infection      16   5.0    ~7d to death (very urgent)
  BlackCough           20   7.0    ~7d to death (best medicine required)
  Early Dementia       25   120.0  ~103d per stage (inevitable; medicine slows)
  Moderate Dementia    25   80.0   ~69d per stage
  Severe Dementia      25   60.0   ~52d per stage
  Terminal Dementia    25   14.0   ~12d to death


─────────────────────────────────────────────
5. LINKS
─────────────────────────────────────────────

block      — parent condition prevents the child from being applied while active.
             e.g. Nursing blocks Pregnancy from being applied.
recover    — fires when progression reaches 0. Replaces parent with child.
             Transitions to a milder condition.
worsen     — fires when progression reaches cap. Replaces parent with child.
             Transitions to a worse condition.
spawn      — fires once when progression crosses spawnThreshold × cap. Creates a
             new parallel condition on the entity (e.g. a wound spawning an infection).
             The original condition continues — it is NOT replaced.
spreads_as — defines what condition is transmitted when this condition spreads via
             contagion. e.g. GreenCough spreads_as WhiteCough (kits contract the
             milder form). The contagion roll still uses the parent's contagionResistDC.

Important: ANY condition with a worsen or spawn link MUST have progressionCap set,
or the link trigger value is undefined and can never fire. This includes Timed
conditions — set progressionCap = maxDays for those.


─────────────────────────────────────────────
6. isFatalAtCap
─────────────────────────────────────────────

If set to true and progression reaches cap with no worsen link (or no worsen
link target exists), the entity dies.

Used on: Pneumonia, Major Infection, BlackCough, Terminal Dementia.


─────────────────────────────────────────────
7. CONTAGION
─────────────────────────────────────────────

contagionResistDC: CON roll DC for nearby cats to resist catching the condition.
Null = not contagious.

Contagion rolls happen on proximity events (patrols, sharing dens, etc.).


─────────────────────────────────────────────
8. ENV RULES (difficultyMod)
─────────────────────────────────────────────

envRules add a flat mod to dailyRollDC when a matching env condition is active.
Example: GreenCough + Cold env → effective DC becomes 13 + 3 = 16.
This stacks against the same cat baseline, making cold weather genuinely deadly
for sick cats.


─────────────────────────────────────────────
9. SPAWN THRESHOLD (Timed wounds → infections)
─────────────────────────────────────────────

For Timed wound conditions, spawnThreshold × progressionCap gives the
progression value at which the spawn check fires (once). Lower = earlier risk.
Since progressionCap = maxDays for Timed conditions, this effectively means the
check fires at (spawnThreshold × maxDays) days into the condition's lifetime.

Typical values:
  0.1  — Rat Bite   (almost always infects; danger is the bacteria, not the wound)
  0.25 — Deep wounds (significant infection risk)
  0.35 — Bite Wound
  0.4  — Scratch Wound
  0.8  — Graze      (rarely infects; surface only)

The spawn check is probabilistic — having a low threshold doesn't guarantee
infection, it just means the check happens sooner and more aggressively.


─────────────────────────────────────────────
10. RUNTIME STATE — EntityCondition
─────────────────────────────────────────────

Each active condition on a cat is one EntityCondition row. Key runtime fields:

  progressionValue  Float   Current position on the 0 → cap scale. Starts at
                            cap/2 for Progressive/Chronic. Incremented/decremented
                            by the daily CON roll result. Decremented further by
                            medication (EntityTreatmentLog.progressionChange).
                            Floors at 0.0; never stored above cap.

  discoveryLevel    Int     The highest examination roll made on this entity so far
                            (across all medicine cats, all days). Determines which
                            symptoms and condition names are visible to players.
                            Updated whenever an EntityInspectionLog roll beats the
                            current value. Default 0 = nothing revealed.

  lastTreatedAt     DateTime? Denormalized timestamp of the most recent treatment.
                            Used for quick "has this condition been treated today?"
                            checks without querying the full log. The log is still
                            the source of truth for history.

  onsetAt           DateTime? When the condition first appeared on the entity.

  sourceEntityId    Int?    The entity whose combat action applied this condition.
                            Null for natural onset (illness, environmental, out-of-combat).
                            Used by ConditionBehaviorEffect redirect target "source" to
                            resolve which entity to redirect toward/away from. Also
                            identifies the other party in linked condition pairs.

  linkedConditionId Int?    Self-referential FK to a paired EntityCondition on another
                            entity. Used for mutually dependent conditions (e.g. "Grappling"
                            on A linked to "Grappled" on B). When either is removed, the
                            app removes the linked partner as well.
                            Set at application time from ItemEquipmentProfile_Condition
                            rows that share a linkedProfileConditionId.


─────────────────────────────────────────────
11. EXAMINATION (EntityInspectionLog)
─────────────────────────────────────────────

When a medicine cat examines a sick cat, one row is written to
EntityInspectionLog with the roll result.

Rules (enforced at application layer):
  - A medicine cat may examine the SAME patient at most once per calendar day.
    Second attempt by the same medicine cat on the same day is rejected.
  - Multiple different medicine cats CAN each examine the same patient on the
    same day (each gets their own row).
  - After each examination, if rollResult > EntityCondition.discoveryLevel,
    discoveryLevel is updated to the new value.

What the roll reveals:
  Each Symptom has a defaultRoll threshold. A symptom is visible when
  discoveryLevel >= symptom.defaultRoll.
  The condition's own name may also be hidden (isHidden = true on ConditionDef)
  until discoveryLevel is high enough.

  Low roll  → basic visible symptoms only (e.g. "looks tired, coughing")
  High roll → full symptom picture + condition name identified

Example:
  Blackworm has GreenCough. Leafpool rolls 12, SunriseGaze rolls 18.
  discoveryLevel becomes 18. All symptoms with defaultRoll ≤ 18 are now visible.
  If SunriseGaze had rolled 8 instead, Leafpool's 12 would stand.


─────────────────────────────────────────────
12. TREATMENT (EntityTreatmentLog)
─────────────────────────────────────────────

When a medicine cat administers medicine, one row is written to
EntityTreatmentLog and progressionValue is decremented by progressionChange.

Rules (enforced at application layer):
  - A specific condition (entityConditionId) may be treated at most once per
    calendar day, regardless of how many medicine cats are available.
  - This is per-condition, not per-patient. A cat with both WhiteCough and a
    Bite Wound can receive treatment for each condition on the same day —
    they are separate EntityCondition rows and separate treatment slots.

progressionChange magnitude is determined by:
  - The item used (herb vs. crafted poultice)
  - The crafter's skill level (if item was crafted)
  - The administrant's Medicine skill roll (if applicable)
  Approximate range: 0.1 (raw herb, low skill) → 0.6 (crafted, high skill)

After treatment:
  - EntityCondition.progressionValue -= progressionChange (clamped to 0.0)
  - EntityCondition.lastTreatedAt = now()
  - EntityTreatmentLog row created for history

The daily CON roll and treatment are independent — both apply on the same day.
Order of operations: CON roll first, then treatment on top.


─────────────────────────────────────────────
13. COMBAT BEHAVIOR EFFECTS (ConditionBehaviorEffect)
─────────────────────────────────────────────

Conditions can modify how combat actions are processed for the entity holding
them. Each ConditionBehaviorEffect row intercepts a class of actions and applies
a behavior. Multiple rows on the same condition stack independently.

  perspective   "outgoing" — triggers on actions made BY the condition holder
                             (e.g. Confused redirects their own attacks).
                "incoming" — triggers on actions directed AT the condition holder
                             (e.g. Being Guarded redirects incoming attacks to source).

  actionTypeId  Which action type (attack, heal, buff, debuff) this affects.
                Null = affects all action types.

  behaviorType  (seed table — ConditionBehaviorType)
    redirect    Moves the action to a different target. Requires redirectTarget.
                triggerChance controls probability (1.0 = always, 0.5 = 50%).
    cancel      Prevents the action entirely. triggerChance = probability of cancel.
                Used for Parry, Block, Evasion mechanics.
    bias        Shifts AI targeting weight. Requires redirectTarget and biasWeight.
                Positive biasWeight = toward target (Taunt).
                Negative biasWeight = away from target (Fear, Intimidate).
    restrict    Limits what actions the entity may use. Requires restrictActionTypeId.
                restrictIsBlock = false → entity may ONLY use this action type (Provoked).
                restrictIsBlock = true  → entity may NOT use this action type (Silenced).

  redirectTarget  (seed table — BehaviorRedirectTarget)
    source        EntityCondition.sourceEntityId — whoever applied this condition.
                  Covers Taunt (redirect attacker's strikes toward the taunter),
                  Guard (redirect incoming attacks to the guardian),
                  and any exploitation mark (Hunter's Strike, Finish Move).
    self          The entity holding the condition (confusion self-hit).
    random_ally   A random member of the holder's own side.
    random_enemy  A random member of the opposing side.

EXAMPLES:

  Taunted (on enemy)
    outgoing, attack type, redirect → source, triggerChance 1.0
    Enemy's attacks always go to whoever taunted them.

  Being Guarded (on ally)
    incoming, attack type, redirect → source, triggerChance 1.0
    Attacks aimed at the guarded ally are redirected to the guardian.

  Grappled (on target)
    outgoing, attack type, restrict, restrictIsBlock true
    Grappled entity cannot make attack actions.

  Confused (on entity)
    outgoing, attack type, redirect → random_ally, triggerChance 0.5
    50% chance each attack hits a random ally instead of the intended target.

  Fear (on entity)
    outgoing, attack type, bias → source, biasWeight -2.0
    Entity strongly avoids targeting whoever frightened them.

  Parry (on entity)
    incoming, attack type, cancel, triggerChance 0.25
    25% chance to cancel an incoming physical attack entirely.

RULE: Behavior effects are evaluated at action resolution, not at action
selection. The action is declared normally; the behavior layer intercepts it
before damage/healing is applied.


─────────────────────────────────────────────
14. CONDITION-GRANTED ITEMS (ConditionDef_GrantedItem)
─────────────────────────────────────────────

A condition can grant access to ability items whose actions appear in the
entity's combat menu without requiring the item to be in inventory.

This enables contextual combat actions that only make sense in a specific state:
  - "Grappled"   grants "Break Free"  (stat roll to escape the grapple)
  - "Grappling"  grants "Release"     (voluntarily end the grapple, no roll needed)
  - "Bleeding"   grants "Apply Pressure" (reduce wound progression at cost of action)
  - "Poisoned"   grants "Purge"       (expel poison; may trigger a vomiting warning)
  - "Berserk"    grants "Frenzy"      (bonus attack only available while raging)
  - Stunned      grants "Shake It Off" (stat roll to clear the condition early)

  grantedToSource  false (default) = item granted to the condition holder.
                   true = item granted to EntityCondition.sourceEntityId.
                   Enables exploitation moves — the entity that APPLIED the condition
                   gets access to follow-up actions:
                     "Knocked Down" (grantedToSource true) → grants "Pounce" to attacker
                     "Marked"       (grantedToSource true) → grants "Hunter's Strike" to marker

  usesPerApplication  Max times the item can be used during this condition instance.
                      Null = unlimited. "Second Wind" should be capped at 1.
                      Tracked at runtime per EntityCondition.

  minProgression  Item only available when progressionValue >= this value.
                  Used for desperation mechanics:
                    "Last Stand" — only appears when Near Death progression >= 3.0

  maxProgression  Item only available when progressionValue <= this value.
                  Used to gate actions to manageable states:
                    "Apply Pressure" — only available while bleeding progression <= 4.0

Both thresholds null = always available while the condition is active.

RULE: Granted items are combat-only unless the item's own profile has
allowedInSpar = false or other restrictions. The condition granting the item
does not override the item's own restriction flags.
