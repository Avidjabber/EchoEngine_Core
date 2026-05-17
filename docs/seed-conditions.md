WARRIOR CATS — CONDITION SEED LIST
====================================
Last updated: 2026-05-15

Status key:
  [ ] planned   — fields decided; not yet uploaded
  [x] seeded    — uploaded and confirmed in DB
  [~] partial   — some sub-tables still missing

All DCs, caps, and progression math calibrated against the baseline cat (CON 10, avg roll 10.5).
See docs/game-systems/condition-system.md sections 2–4 for the full calibration reference.

Condition chain arrows: → worsen  ↗ recover  ⊕ spawn  ⟶ spreads_as


════════════════════════════════════════════════════════
RESPIRATORY ILLNESS CHAIN
════════════════════════════════════════════════════════

[ ] white_cough
    name:          WhiteCough
    type:          Progressive
    context:       illness
    DC:            8       (avg cat improves ~0.31/day; mild but persistent)
    cap:           7.0     (~11d to clear without treatment)
    contagion DC:  10      (moderately contagious; spreads in shared dens)
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.15
    links:
      worsen → green_cough
      spreads_as → white_cough   (contagion spreads as WhiteCough)
    symptomTags:   Coughing, Wheezing, Runny Nose, Congestion, Fatigue
    envRules:
      cold   worsen 0.5
      frost  worsen 0.8
      damp   worsen 0.3
      warm   improve 0.3

[ ] green_cough
    name:          GreenCough
    type:          Progressive
    context:       illness
    DC:            13      (worsens ~0.22/day untreated; ~11d to BlackCough)
    cap:           5.0
    contagion DC:  12      (highly contagious)
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.35
    links:
      recover → white_cough
      worsen  → black_cough
      spreads_as → white_cough   (kits and weaker cats contract the milder form)
    symptomTags:   Coughing, Rattling Breath, Difficulty Breathing, Fever, Lethargy,
                   Weakness, Wheezing, Labored Breathing
    envRules:
      cold   worsen 0.8
      frost  worsen 1.0
      damp   worsen 0.5
      smoke  worsen 0.6
      warm   improve 0.3

[ ] black_cough
    name:          BlackCough
    type:          Progressive
    context:       illness
    DC:            20      (worsens ~0.48/day; ~7d to death; best herbs barely help)
    cap:           7.0
    contagion DC:  8       (extremely contagious)
    isHidden:      false
    isFatalAtCap:  true
    energyDebuf:   0.60
    blocksVerbal:  true    (cat is too ill to communicate clearly)
    links:
      (none — isFatalAtCap; no recover link; condition is nearly always fatal)
    symptomTags:   Coughing, Gasping for Air, Open-mouth Breathing, Rattling Breath,
                   Cyanosis (Bluish Tongue/Gums), Fever, Emaciation, Weakness,
                   Labored Breathing, Pale Gums, Lethargy
    envRules:
      cold   worsen 1.0
      frost  worsen 1.0
      damp   worsen 0.8
      smoke  worsen 1.0
      warm   improve 0.2   (marginal; rarely saves them)

[ ] flu
    name:          Flu
    type:          Progressive
    context:       illness
    DC:            10      (coin-flip; barely improves without herbs; ~140d to clear)
    cap:           14.0
    contagion DC:  14
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.25
    links:
      worsen → green_cough    (untreated flu deteriorates into GreenCough)
    symptomTags:   Fever, Chills, Fatigue, Lethargy, Weakness, Coughing, Nausea,
                   Loss of Appetite, Dehydration, Shivering
    envRules:
      cold  worsen 0.5
      damp  worsen 0.3
      warm  improve 0.2

[ ] asthma
    name:          Asthma
    type:          Chronic
    context:       illness
    DC:            6       (avg cat improves ~0.40/day; rarely fatal alone)
    cap:           5.0
    spawnThreshold: 0.80   (episode spawns at 80% progression — 4.0 of 5.0)
    contagion DC:  null    (not contagious — inherited/developed condition)
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.10
    links:
      spawn ⊕ asthma_episode   (fires when progression ≥ 4.0)
    symptomTags:   Wheezing, Difficulty Breathing, Coughing, Congestion
    envRules:
      pollen worsen 0.8
      smoke  worsen 1.0
      dusty  worsen 0.6
      cold   worsen 0.4

[ ] asthma_episode
    name:          Asthma Episode
    type:          Timed
    context:       illness
    maxDays:       2
    progressionCap: 2.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.50
    blocksVerbal:  true
    symptomTags:   Gasping for Air, Open-mouth Breathing, Difficulty Breathing, Coughing
    envRules:
      pollen worsen 0.8
      smoke  worsen 1.0


════════════════════════════════════════════════════════
INFECTION CHAIN
════════════════════════════════════════════════════════

[ ] minor_infection
    name:          Minor Infection
    type:          Progressive
    context:       illness
    DC:            8       (avg cat improves ~0.31/day; heals naturally with time)
    cap:           7.0
    contagion DC:  null    (not airborne; contact-spread only — handled at wound level)
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.10
    links:
      recover → (removed; clears naturally)
      worsen  → moderate_infection
    symptomTags:   Infection, Swelling, Inflammation, Pus, Wound, Fever
    envRules:
      damp  worsen 0.4
      muddy worsen 0.5
      warm  worsen 0.3   (heat accelerates bacterial growth)
      cold  improve 0.2

[ ] moderate_infection
    name:          Moderate Infection
    type:          Progressive
    context:       illness
    DC:            12      (worsens ~0.13/day untreated; ~20d to Major if untreated)
    cap:           5.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.25
    links:
      recover → minor_infection
      worsen  → major_infection
    symptomTags:   Infection, Festering Wound, Pus, Fever, Swelling, Weakness, Lethargy
    envRules:
      damp  worsen 0.5
      muddy worsen 0.7
      warm  worsen 0.4
      cold  improve 0.2

[ ] major_infection
    name:          Major Infection
    type:          Progressive
    context:       illness
    DC:            16      (worsens ~0.34/day; ~7d to death)
    cap:           5.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  true
    energyDebuf:   0.50
    links:
      recover → moderate_infection
    symptomTags:   Festering Wound, Pus, Fever, Shock, Weakness, Emaciation,
                   Swollen Lymph Nodes, Pale Gums, Lethargy
    envRules:
      damp  worsen 0.7
      muddy worsen 0.9
      warm  worsen 0.5


════════════════════════════════════════════════════════
PNEUMONIA
════════════════════════════════════════════════════════

[ ] pneumonia
    name:          Pneumonia
    type:          Progressive
    context:       illness
    DC:            14      (worsens ~0.25/day; ~14d to death without treatment)
    cap:           7.0
    contagion DC:  null    (secondary condition; not directly contagious)
    isHidden:      false
    isFatalAtCap:  true
    energyDebuf:   0.55
    blocksVerbal:  true
    links:
      recover → white_cough   (cat clears to mild respiratory condition)
    symptomTags:   Labored Breathing, Rattling Breath, Difficulty Breathing, Fever,
                   Coughing, Weakness, Rapid Breathing, Lethargy, Pale Gums
    envRules:
      cold   worsen 0.8
      damp   worsen 0.6
      smoke  worsen 0.8
      warm   improve 0.3


════════════════════════════════════════════════════════
WOUNDS (Timed — progressionCap = maxDays, spawnThreshold controls infection risk)
════════════════════════════════════════════════════════
NOTE: All wounds are body-part-specific (bodyPartId set at application).
      Infection spawn uses probabalistic check — threshold does NOT guarantee infection.

[ ] graze
    name:          Graze
    type:          Timed
    context:       injury
    maxDays:       3
    progressionCap: 3.0
    spawnThreshold: 0.80   (check fires on day 3; graze rarely infects — surface only)
    isFatalAtCap:  false
    links:
      spawn ⊕ minor_infection
    symptomTags:   Wound, Bleeding, Scabs
    envRules:
      muddy worsen 0.3
      damp  worsen 0.2

[ ] scratch_wound
    name:          Scratch Wound
    type:          Timed
    context:       injury
    maxDays:       5
    progressionCap: 5.0
    spawnThreshold: 0.40   (check fires at day 2 of 5)
    isFatalAtCap:  false
    links:
      spawn ⊕ minor_infection
    symptomTags:   Wound, Bleeding, Scabs, Inflammation
    envRules:
      muddy worsen 0.3
      damp  worsen 0.2

[ ] bite_wound
    name:          Bite Wound
    type:          Timed
    context:       injury
    maxDays:       7
    progressionCap: 7.0
    spawnThreshold: 0.35   (check fires at day 2-3 of 7; significant infection risk)
    isFatalAtCap:  false
    links:
      spawn ⊕ minor_infection
    symptomTags:   Wound, Bleeding, Swelling, Inflammation, Pain
    envRules:
      muddy worsen 0.4
      damp  worsen 0.3

[ ] deep_wound
    name:          Deep Wound
    type:          Timed
    context:       injury
    maxDays:       10
    progressionCap: 10.0
    spawnThreshold: 0.25   (check fires at day 2-3 of 10; high infection risk)
    isFatalAtCap:  false
    energyDebuf:   0.20
    links:
      spawn ⊕ moderate_infection   (deep wounds skip straight to moderate infection)
    symptomTags:   Wound, Bleeding, Swelling, Pain, Inflammation, Discharge
    envRules:
      muddy worsen 0.5
      damp  worsen 0.4

[ ] rat_bite
    name:          Rat Bite
    type:          Timed
    context:       injury
    maxDays:       3
    progressionCap: 3.0
    spawnThreshold: 0.10   (check fires almost immediately — day 1; bacteria, not the wound)
    isFatalAtCap:  false
    links:
      spawn ⊕ moderate_infection   (rat bites are highly infectious — straight to moderate)
    symptomTags:   Wound, Bleeding, Swelling, Inflammation
    envRules:
      muddy worsen 0.5
      damp  worsen 0.4

[ ] burn_wound
    name:          Burn
    type:          Timed
    context:       injury
    maxDays:       14
    progressionCap: 14.0
    spawnThreshold: 0.30   (check fires around day 4)
    isFatalAtCap:  false
    energyDebuf:   0.25
    links:
      spawn ⊕ minor_infection
    symptomTags:   Burn, Blistering, Pain, Wound, Swelling
    envRules:
      damp  worsen 0.3
      heat  worsen 0.4


════════════════════════════════════════════════════════
PERMANENT INJURIES
════════════════════════════════════════════════════════

[ ] broken_leg
    name:          Broken Leg
    type:          Permanent
    context:       injury
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.30
    NOTE: Body-part-specific. Applied by admin; removed only by admin (represents healed
          but permanently damaged bone — "three-legs" archetype).
    statEffects:
      Dexterity  -3
      Strength   -1
    profEffects:
      (movement/patrol proficiencies if defined — TBD once proficiencies are seeded)
    symptomTags:   Limping, Broken Bone, Reluctance to Move, Pain

[ ] lost_eye
    name:          Lost Eye
    type:          Permanent
    context:       injury
    isHidden:      false
    isFatalAtCap:  false
    NOTE: One-eyed cats. Applied by admin.
    statEffects:
      Dexterity  -1
      Wisdom     -1
    symptomTags:   Loss of Vision, Cloudy Eye

[ ] deaf
    name:          Deaf
    type:          Permanent
    context:       injury
    isHidden:      false
    isFatalAtCap:  false
    NOTE: Permanent hearing loss.
    statEffects:
      Wisdom  -2
    symptomTags:   Loss of Hearing

[ ] torn_muscle
    name:          Torn Muscle
    type:          Permanent
    context:       injury
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.15
    NOTE: Chronic weakness from an old injury that never fully healed.
    statEffects:
      Strength   -2
      Dexterity  -1
    symptomTags:   Muscle Wasting, Stiffness, Limping, Pain

[ ] tail_loss
    name:          Lost Tail
    type:          Permanent
    context:       injury
    isHidden:      false
    isFatalAtCap:  false
    NOTE: Cosmetic/roleplay. Minor balance impact.
    statEffects:
      Dexterity  -1
    symptomTags:   (none visible — it's just gone)


════════════════════════════════════════════════════════
CHRONIC CONDITIONS
════════════════════════════════════════════════════════

[ ] falling_sickness
    name:          Falling Sickness
    type:          Chronic
    context:       illness
    DC:            5       (avg cat improves ~0.47/day; manageable with herbs)
    cap:           5.0
    spawnThreshold: 0.70   (episode at 70% progression — 3.5 of 5.0)
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.10
    links:
      spawn ⊕ falling_episode
    symptomTags:   Seizure, Tremors, Disorientation, Confusion
    envRules:
      (none — not environment-sensitive)

[ ] falling_episode
    name:          Falling Sickness Episode
    type:          Timed
    context:       illness
    maxDays:       1
    progressionCap: 1.0
    contagion DC:  null
    isFatalAtCap:  false
    energyDebuf:   0.70
    symptomTags:   Seizure, Unconsciousness, Sudden Collapse, Tremors

[ ] elder_stiffness
    name:          Elder Joint Stiffness
    type:          Chronic
    context:       illness
    DC:            5       (manageable; flares in cold weather)
    cap:           4.0
    spawnThreshold: 0.75
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.15
    links:
      spawn ⊕ stiffness_flare
    statEffects:
      Dexterity  -1
      Strength   -1
    symptomTags:   Stiffness, Joint Pain, Difficulty Rising, Reluctance to Move
    envRules:
      cold     worsen 0.7
      freezing worsen 1.0
      warm     improve 0.4

[ ] stiffness_flare
    name:          Joint Stiffness Flare
    type:          Timed
    context:       illness
    maxDays:       3
    progressionCap: 3.0
    isFatalAtCap:  false
    energyDebuf:   0.40
    statEffects:
      Dexterity  -2
      Strength   -2
    symptomTags:   Stiffness, Joint Pain, Reluctance to Move, Difficulty Rising, Trembling When Standing


════════════════════════════════════════════════════════
DEMENTIA CHAIN (Elder condition — slow inevitable decline)
════════════════════════════════════════════════════════

[ ] dementia_early
    name:          Early Memory Loss
    type:          Progressive
    context:       illness
    DC:            25      (CON 10 cat can NEVER beat this; inevitable decline)
    cap:           120.0   (~103d per stage at worsening rate ~0.58/day)
    contagion DC:  null
    isHidden:      true    (name hidden until medicine cat diagnoses; appears as confusion/forgetfulness)
    isFatalAtCap:  false
    energyDebuf:   0.05
    links:
      worsen → dementia_moderate
    symptomTags:   Memory Loss, Confusion, Disorientation, Sudden Personality Change
    envRules:
      (none)

[ ] dementia_moderate
    name:          Moderate Dementia
    type:          Progressive
    context:       illness
    DC:            25
    cap:           80.0    (~69d per stage)
    contagion DC:  null
    isHidden:      true
    isFatalAtCap:  false
    energyDebuf:   0.15
    statEffects:
      Intelligence  -2
      Wisdom        -2
    links:
      worsen → dementia_severe
    symptomTags:   Memory Loss, Confusion, Disorientation, Hallucination-like Behavior,
                   Sudden Personality Change, Depression (Low Mood / Unresponsiveness)
    envRules:
      (none)

[ ] dementia_severe
    name:          Severe Dementia
    type:          Progressive
    context:       illness
    DC:            25
    cap:           60.0    (~52d per stage)
    contagion DC:  null
    isHidden:      true
    isFatalAtCap:  false
    energyDebuf:   0.35
    statEffects:
      Intelligence  -4
      Wisdom        -4
      Charisma      -2
    links:
      worsen → dementia_terminal
    symptomTags:   Memory Loss, Confusion, Disorientation, Hallucination-like Behavior,
                   Loss of Coordination (Ataxia), Depression (Low Mood / Unresponsiveness),
                   Withdrawal, Aggression
    envRules:
      (none)

[ ] dementia_terminal
    name:          Terminal Dementia
    type:          Progressive
    context:       illness
    DC:            25
    cap:           14.0    (~12d to death)
    contagion DC:  null
    isHidden:      true
    isFatalAtCap:  true
    energyDebuf:   0.70
    statEffects:
      Intelligence  -6
      Wisdom        -6
      Charisma      -4
    links:
      (none — isFatalAtCap)
    symptomTags:   Memory Loss, Unconsciousness, Sudden Collapse, Emaciation,
                   Failure to Thrive, Lethargy
    envRules:
      (none)


════════════════════════════════════════════════════════
BIOLOGICAL (LifeCycle)
════════════════════════════════════════════════════════

[ ] pregnant_early
    name:          Pregnant (Early)
    type:          LifeCycle
    context:       biological
    maxDays:       30      (~1 moon)
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.10
    links:
      worsen → pregnant_late   (transitions after 30 days)
      block  → pregnant_early  (blocks a second pregnancy applying while active)
    symptomTags:   Nausea, Loss of Appetite, Fatigue, Swollen Abdomen (Fluid Buildup)

[ ] pregnant_late
    name:          Pregnant (Late)
    type:          LifeCycle
    context:       biological
    maxDays:       30      (~1 moon)
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.25
    links:
      worsen → nursing
      block  → pregnant_early
    symptomTags:   Swollen Abdomen (Fluid Buildup), Pot Belly, Fatigue, Reluctance to Move,
                   Difficulty Rising

[ ] nursing
    name:          Nursing
    type:          LifeCycle
    context:       biological
    maxDays:       45      (~1.5 moons — kits weaned)
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.20
    links:
      worsen → (removed; nursing ends naturally — no follow-on condition)
      block  → pregnant_early   (nursing blocks new pregnancy)
    symptomTags:   Fatigue, Low Milk Production


════════════════════════════════════════════════════════
DIGESTIVE / POISONING
════════════════════════════════════════════════════════

[ ] upset_stomach
    name:          Upset Stomach
    type:          Progressive
    context:       illness
    DC:            8       (avg cat improves ~0.31/day; clears in ~5d)
    cap:           3.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.15
    links:
      worsen → poisoned   (if extremely bad — e.g. eating deathberries in small quantity)
    symptomTags:   Nausea, Vomiting, Bellyache, Loss of Appetite, Diarrhea
    envRules:
      (none)

[ ] poisoned
    name:          Poisoned
    type:          Progressive
    context:       illness
    DC:            16      (worsens ~0.34/day; ~7d to death — needs immediate purge)
    cap:           5.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  true
    energyDebuf:   0.50
    links:
      recover → upset_stomach   (if treated in time — residual stomach upset)
    symptomTags:   Vomiting, Diarrhea, Nausea, Shock, Weakness, Seizure,
                   Foaming at Mouth, Drooling, Pale Gums, Sudden Collapse
    envRules:
      (none)


════════════════════════════════════════════════════════
SYMPTOM-LEVEL CONDITIONS
════════════════════════════════════════════════════════
Short-lived Progressive conditions (DC 8) that self-clear on avg. Spawned by larger
illnesses, environmental events, or applied directly by events/admin. No contagion.
DCs and caps match the approved reference table in condition-system.md section 4.

[ ] cough
    name:          Cough
    type:          Progressive
    context:       illness
    DC:            8       (~11d to clear; avg cat improves naturally)
    cap:           7.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  false
    NOTE: Generic irritant cough — smoke, dust, cold air. Not a disease. Does NOT chain
          into GreenCough. Spawnable from events or env exposure.
    symptomTags:   Coughing, Congestion
    envRules:
      smoke  worsen 0.6
      dusty  worsen 0.4
      cold   worsen 0.3
      pollen worsen 0.3

[ ] congestion
    name:          Congestion
    type:          Progressive
    context:       illness
    DC:            8       (~8d to clear)
    cap:           5.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  false
    NOTE: Nasal congestion from irritants or as a spawned symptom of WhiteCough.
    symptomTags:   Congestion, Runny Nose, Sneezing
    envRules:
      cold   worsen 0.4
      damp   worsen 0.3
      pollen worsen 0.5

[ ] wheezing
    name:          Wheezing
    type:          Progressive
    context:       illness
    DC:            8       (~3d to clear from cap/2)
    cap:           2.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  false
    NOTE: Spawnable by Asthma, GreenCough, or smoke events.
    symptomTags:   Wheezing, Rattling Breath
    envRules:
      smoke  worsen 0.5
      cold   worsen 0.3
      pollen worsen 0.4

[ ] difficulty_breathing
    name:          Difficulty Breathing
    type:          Progressive
    context:       illness
    DC:            8       (~3d to clear from cap/2)
    cap:           2.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.30
    blocksVerbal:  true
    NOTE: Spawnable by Asthma Episode, Pneumonia recovery, or severe smoke events.
    symptomTags:   Difficulty Breathing, Labored Breathing, Rapid Breathing
    envRules:
      smoke  worsen 0.8
      pollen worsen 0.6

[ ] nausea
    name:          Nausea
    type:          Progressive
    context:       illness
    DC:            8       (~5d to clear)
    cap:           3.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.10
    NOTE: Spawnable by Poisoned (recover link), bad food events, motion sickness events.
          Distinct from Upset Stomach — no vomiting or diarrhea, just queasiness.
    symptomTags:   Nausea, Loss of Appetite
    envRules:
      (none)

[ ] disorientation
    name:          Disorientation
    type:          Progressive
    context:       illness
    DC:            8       (~3d to clear from cap/2)
    cap:           2.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.15
    NOTE: Spawnable by Concussion, Falling Sickness episode, or head-injury events.
    symptomTags:   Disorientation, Loss of Balance, Dizziness, Loss of Coordination (Ataxia)
    envRules:
      (none)

[ ] confusion_illness
    name:          Confused (Illness)
    type:          Progressive
    context:       illness
    DC:            8       (~3d to clear from cap/2)
    cap:           2.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.10
    NOTE: Illness/injury-sourced confusion. DISTINCT from the combat debuff `confused`.
          Spawnable by Concussion, Falling Sickness episode, advanced Dementia.
    symptomTags:   Confusion, Head Tilt, Sensitivity to Sound, Hallucination-like Behavior
    envRules:
      (none)


════════════════════════════════════════════════════════
PARASITES & SKIN
════════════════════════════════════════════════════════

[ ] parasites
    name:          Parasites
    type:          Chronic
    context:       illness
    DC:            8       (avg cat improves; Chronic means it floors at 0 but never self-removes)
    cap:           6.0
    spawnThreshold: 0.70   (severe infestation at 70% — 4.2 of 6.0 triggers flare)
    contagion DC:  18      (low — only via heavily contaminated water/food or prolonged den-sharing)
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.20
    links:
      spawn ⊕ parasitic_flare
    statEffects:
      Constitution  -1
    symptomTags:   Weight Loss, Diarrhea, Pot Belly, Lethargy, Visible Ribs, Loss of Appetite,
                   Vomiting, Bloating
    envRules:
      muddy  worsen 0.3
      fouled worsen 0.5
      putrid worsen 0.7

[ ] parasitic_flare
    name:          Parasitic Flare
    type:          Timed
    context:       illness
    maxDays:       3
    progressionCap: 3.0
    contagion DC:  null
    isFatalAtCap:  false
    energyDebuf:   0.45
    symptomTags:   Vomiting, Diarrhea, Bellyache, Weakness, Lethargy, Blood in Stool

[ ] mange
    name:          Mange
    type:          Chronic
    context:       illness
    DC:            7       (avg cat improves ~0.38/day; manageable but persistent)
    cap:           8.0
    spawnThreshold: 0.80   (severe mange at 80% — 6.4 of 8.0; open sores risk infection)
    contagion DC:  10      (spreads via close contact and shared sleeping spots)
    isHidden:      false
    isFatalAtCap:  false
    energyDebuf:   0.10
    links:
      spawn ⊕ minor_infection   (severe mange creates open sores)
    symptomTags:   Hair Loss, Itching, Scabs, Hot Spots, Rash, Dry Skin,
                   Flaky Skin (Dandruff), Skin Discoloration
    envRules:
      damp   worsen 0.4
      humid  worsen 0.5
      warm   worsen 0.3


════════════════════════════════════════════════════════
HEAD TRAUMA & ENVIRONMENTAL EXPOSURE
════════════════════════════════════════════════════════

[ ] concussion
    name:          Concussion
    type:          Timed
    context:       injury
    maxDays:       7
    progressionCap: 7.0
    spawnThreshold: 0.20   (disorientation kicks in almost immediately — day 1-2)
    isFatalAtCap:  false
    energyDebuf:   0.25
    NOTE: Body-part-specific (head). Applied after falls, head blows, or combat hits to
          the head. Spawns both Disorientation and Confusion (Illness) as parallel conditions.
    links:
      spawn ⊕ disorientation
      spawn ⊕ confusion_illness
    symptomTags:   Disorientation, Dizziness, Sensitivity to Sound, Sensitivity to Light,
                   Confusion, Head Tilt, Loss of Balance, Nausea
    envRules:
      (none)

[ ] eye_infection
    name:          Eye Infection
    type:          Timed
    context:       injury
    maxDays:       7
    progressionCap: 7.0
    spawnThreshold: 0.60   (check fires around day 4; infection can spread if untreated)
    isFatalAtCap:  false
    energyDebuf:   0.05
    NOTE: Body-part-specific (eye). Treatable with marigold or sanicle poultice.
    links:
      spawn ⊕ minor_infection
    symptomTags:   Eye Discharge, Red Eyes, Squinting, Sensitivity to Light, Cloudy Eye,
                   Swelling
    envRules:
      dusty worsen 0.4
      smoke worsen 0.3

[ ] frostbite
    name:          Frostbite
    type:          Timed
    context:       injury
    maxDays:       7
    progressionCap: 7.0
    spawnThreshold: 0.40   (check fires around day 3; tissue damage invites infection)
    isFatalAtCap:  false
    energyDebuf:   0.15
    NOTE: Body-part-specific (paws, ears, tail tip). Triggered by prolonged freezing
          exposure. Treat with gentle warmth and dock-leaf or coltsfoot poultice.
    links:
      spawn ⊕ minor_infection
    symptomTags:   Pain, Swelling, Blistering, Thickened Skin, Wound
    envRules:
      freezing worsen 0.8
      frost    worsen 0.6
      icy      worsen 0.3

[ ] heat_stroke
    name:          Heat Stroke
    type:          Timed
    context:       illness
    maxDays:       3
    progressionCap: 3.0
    contagion DC:  null
    isHidden:      false
    isFatalAtCap:  true    (heat stroke is rapidly fatal without treatment)
    energyDebuf:   0.60
    NOTE: Triggered by prolonged scorching/heat exposure without shade or water.
          Treat with water, cool damp moss, and shade. Time-critical.
    links:
      recover → nausea   (residual queasiness after recovery)
    symptomTags:   Panting, Rapid Breathing, Fever, Dehydration, Shock,
                   Vomiting, Sudden Collapse, Excessive Thirst
    envRules:
      scorching worsen 1.0
      heat      worsen 0.7
      humid     worsen 0.4


════════════════════════════════════════════════════════
COMBAT BUFFS / DEBUFFS (combatInstancedOnly = true)
════════════════════════════════════════════════════════
NOTE: These conditions are combat-scoped only. They apply during combat and are
      removed when the combat ends (combatInstancedOnly = true). They do NOT use
      daily rolls, progression caps, or links unless noted.

[ ] grappling
    name:          Grappling
    type:          Permanent
    context:       debuff
    combatInstancedOnly: true
    isHidden:      false
    links:
      block → grappling   (can't grapple while already grappling)
    grantedItems:
      Release (item)   — grantedToSource false (holder gets Release action)
    behaviorEffects:
      outgoing, attack type, restrict, restrictIsBlock false
      (grappler can ONLY make attack actions — no healing or buffs while grappling)

[ ] grappled
    name:          Grappled
    type:          Permanent
    context:       debuff
    combatInstancedOnly: true
    isHidden:      false
    grantedItems:
      Break Free (item)  — grantedToSource false
    behaviorEffects:
      outgoing, attack type, restrict, restrictIsBlock true
      (grappled entity CANNOT make attack actions)

[ ] pinned
    name:          Pinned
    type:          Permanent
    context:       debuff
    combatInstancedOnly: true
    isHidden:      false
    energyDebuf:   0.0    (not energy-draining — just locked down)
    behaviorEffects:
      outgoing, null (all types), cancel, triggerChance 1.0
      (all outgoing actions cancelled while pinned)
    grantedItems:
      Break Free (item) — grantedToSource false

[ ] taunted
    name:          Taunted
    type:          Permanent
    context:       debuff
    combatInstancedOnly: true
    isHidden:      false
    behaviorEffects:
      outgoing, attack type, redirect → source, triggerChance 1.0
      (all attacks redirected to whoever taunted them)

[ ] being_guarded
    name:          Being Guarded
    type:          Permanent
    context:       buff
    combatInstancedOnly: true
    isHidden:      false
    behaviorEffects:
      incoming, attack type, redirect → source, triggerChance 1.0
      (incoming attacks redirected to the guardian — source = guard caster)

[ ] fear
    name:          Fear
    type:          Permanent
    context:       debuff
    combatInstancedOnly: true
    isHidden:      false
    behaviorEffects:
      outgoing, attack type, bias → source, biasWeight -2.0
      (entity strongly avoids attacking whoever frightened them)

[ ] confused
    name:          Confused
    type:          Permanent
    context:       debuff
    combatInstancedOnly: true
    isHidden:      false
    behaviorEffects:
      outgoing, attack type, redirect → random_ally, triggerChance 0.5
      (50% chance attacks hit a random ally)

[ ] stunned
    name:          Stunned
    type:          Permanent
    context:       debuff
    combatInstancedOnly: true
    isHidden:      false
    grantedItems:
      Shake It Off (item) — grantedToSource false
    behaviorEffects:
      outgoing, null (all types), cancel, triggerChance 1.0

[ ] marked
    name:          Marked
    type:          Permanent
    context:       debuff
    combatInstancedOnly: true
    isHidden:      false
    grantedItems:
      Hunter's Strike (item) — grantedToSource true   (attacker who applied mark gets the follow-up)

[ ] bleeding_combat
    name:          Bleeding
    type:          Permanent
    context:       debuff
    combatInstancedOnly: true
    isHidden:      false
    NOTE: Combat-scoped bleeding. Post-combat, admin may apply a Scratch or Bite Wound
          manually if appropriate. No automatic out-of-combat carry-over by default.
    grantedItems:
      Apply Pressure (item) — grantedToSource false
                              maxProgression 4.0   (only available while bleeding is manageable)

[ ] near_death
    name:          Near Death
    type:          Permanent
    context:       debuff
    isDeathSaveFailureConsequence: true
    isHidden:      false
    NOTE: Post-combat consequence condition rolled when a cat fails all 3 death saving throws.
          Applied by engine at combat resolution; removed by medicine cat declaration.
    energyDebuf:   0.70
    statEffects:
      Strength      -3
      Dexterity     -3
      Constitution  -2
    symptomTags:   Weakness, Lethargy, Pale Gums, Shock, Sudden Collapse


════════════════════════════════════════════════════════
SEAL STATUS (STATUS TRACKING)
════════════════════════════════════════════════════════

Total conditions planned: 60
Seeded: 0
Remaining: 60

UPLOAD STRATEGY:

  Source file: docs/test_models/warrior-cats-conditions.xlsx
    — 60 conditions, 11 sheets, links fully populated.

  The service handles links in a two-phase pass internally: saves all definitions
  first, then resolves links. Circular dependencies (e.g. poisoned ↔ upset_stomach)
  and deep chains (green_cough → black_cough) are handled automatically.

  Single upload is sufficient. If you want to verify definitions before wiring chains,
  clear the links sheet in a copy and upload that first, then re-upload the full file.

  Pending sub-tables (left empty — populate after these packs are seeded):
    prof_effects    — needs proficiency pack seeded (broken_leg, deaf, dementia_*)
    combat_effects  — not currently needed for warrior cats setup
    combat_stat_effects — needs CombatStatEffectDef seeded (stunned AC mod, bleeding)
    damage_modifiers    — not currently needed
    granted_items   — needs items pack seeded (grappling, grappled, pinned, stunned,
                       marked, bleeding_combat)
