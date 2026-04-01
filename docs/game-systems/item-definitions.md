ITEM DEFINITIONS — DESIGN REFERENCE
====================================
Last updated: 2026-03-29

This file is the authoritative reference for how item definitions work in EchoPaw.
Read this before writing item seeding code, item-adjacent queries, or any system
that creates, reads, or consumes items.


─────────────────────────────────────────────
1. WHAT IS AN ITEM DEFINITION?
─────────────────────────────────────────────

An "item definition" is everything that describes what an item IS — its name,
physical properties, what it can do, and how it behaves. It is NOT a physical
instance of the item sitting in someone's storage (that is a StoredItem — see
section 7).

Item definitions are split across several tables. The Item table is the root.
Everything else hangs off it via FK.

  Item                      — core identity, physical properties, and measurement
  MeasurementType           — global seed: Count, Weight, Volume
  ItemType / Item_Type      — classification tags (many-to-many)
  Storage_ItemType          — which item types a storage accepts
  ItemWarning / Item_Warning — safety labels, optionally spawn conditions
  Item_IngredientType       — crafting ingredient classification tags (see docs/crafting-system.md)
  ItemAction                — verb applied to an item (eat, apply, drink, etc.)
  ItemEffect                — symptom-level effect of an action (treat/worsen)
  ItemConditionEffect       — condition-level effect of an action (treat/worsen/cure/transform)
  ItemEffectType            — seed table: treat, worsen, cure, transform
  ItemAction_Output         — items produced when an action is performed
  ItemEquipmentProfile      — combat and equip properties (weapons, armor, etc.)
  ItemEquipmentProfile_Condition         — conditions applied on action fire or while equipped
  ItemEquipmentProfile_RequiredItem      — items that must also be equipped


─────────────────────────────────────────────
2. ITEM — CORE TABLE
─────────────────────────────────────────────

Every item has exactly one Item row.

  guildId           String   "global" for seeded items; guild snowflake for custom items.

  codeName          String   Snake_case machine identifier. Unique per guild (DB-enforced).
                             Used for bulk updates, seed references, and any lookup that
                             must resolve to exactly one item.
                               Seeded:    yarrow_leaf, catmint, rabbit_pelt
                               Ephemeral: yarrow_leaf_a3f9b2  (source codeName + random suffix
                                          generated at craft time — guarantees uniqueness without
                                          special-casing the unique constraint)

  name              String   Human-readable display name. NOT unique — ephemeral items
                             regularly share names ("Dried Yarrow Leaf"). Assembled at
                             craft time as "{preName} {source.name} {postName}" (trimmed).
  description       String?  Optional flavour/display text.

  measurementTypeId Int?     FK → MeasurementType. How this item's quantity is
                             displayed and used in recipes (Count, Weight, Volume).
                             Null defaults to count-based behaviour.
                             Does NOT affect physical weight — all items have a
                             physical weight regardless of measurement type.

  averageWeight     Float    Average weight of one unit in grams. 0 = weightless.
                             Always present — even count items have a weight per unit.
                             Feeds storage weightCapacity:
                               Count  → StoredItem.quantity × averageWeight
                               Weight → StoredItem.quantity (quantity IS the grams)
                               Volume → still tracked for encumbrance; fluid limit
                                        uses averageVolume instead.
  weightVariance    Float    ± fraction applied to averageWeight when a StoredItem
                             is created. 0 = always exactly averageWeight.
                             e.g. 0.1 → actual weight is between 0.9× and 1.1×.

  averageVolume     Float    Average volume of one unit in ml. 0 = ignored.
                             Only meaningful for Volume items; feeds storage
                             fluidCapacity. Ignored for Count and Weight items.

  decayDays         Int?     Base days until fully decayed. Null = never decays.
  maxDurability     Int?     Max durability for equipment. Null = indestructible.
  maxUses           Int?     Max uses before the item is depleted. Null = unlimited.
  fuelValue         Int?     Fuel units provided when used as a heat/cooking source.
                             Null = item cannot be used as fuel.
  isEphemeral       Boolean  True = created at craft time by the recipe system
                             (e.g. Dried Yarrow Leaf, Yarrow Paste). The Item row
                             is deleted when the last StoredItem referencing it is
                             consumed or removed.

RULE: codeName is unique per guild at the DB level. Use codeName for all programmatic
lookups — never look up an item by display name when you need exactly one result.
RULE: Display names (name) are not unique. Never call findUnique on name.


─────────────────────────────────────────────
3. MEASUREMENT TYPES
─────────────────────────────────────────────

MeasurementType is a global seed table (no guildId). It defines how an item's
quantity is stored, displayed, and matched in recipe slots.

  Seeded values:
    Count   unit: "units"  — discrete countable items (leaves, bones, pelts)
    Weight  unit: "g"      — bulk materials measured directly by mass (paste, powder)
    Volume  unit: "ml"     — liquids and fluids (oil, juice, liquid extracts)

All items have a physical averageWeight regardless of measurement type. The
measurement type governs display and recipe language only. Storage limits are
enforced separately per type (weightCapacity vs fluidCapacity — see section 7).


─────────────────────────────────────────────
4. ITEM TYPES
─────────────────────────────────────────────

Items are classified by a many-to-many tag system. An item can have multiple types.

  ItemType         — global seed table of classification labels
  Item_Type        — junction: which types an item has
  Storage_ItemType — junction: which types a storage accepts

Tags drive three things:
  1. System participation — e.g. only items with the Plant or Medicine type
     are queried by the medicine system.
  2. Storage acceptance   — a storage only holds items that match at least one
     of its accepted types. A storage with no entries accepts nothing.
  3. UI filtering         — inventory displays filter by type.

Trait and Ability items are never shown in the normal inventory. Inventory queries
are written to explicitly include only the types they want — there is no
isHiddenFromInventory flag.

Seeded types:
  Weapon    deals damage or has a combat attack action
  Armor     provides AC or damage mitigation
  Shield    equippable shield
  Trait     biological/species characteristic (claws, bite, innate abilities)
  Ability   rank-granted innate ability (Rallying Cry, Battle Cry, etc.)
  Spell     magical action item
  Tool      non-combat usable tool
  Plant     flora — gathered, used in medicine and processing
  Medicine  usable in the medicine/treatment system (herbs, bandages, splints)
  Fuel      can be used as a heat/cooking fuel source
  Food      consumable item
  Ore       raw unrefined ore; drives smelting system participation
  Ingot     smelted metal bar; drives forging system participation
  Gem       gemstones and crystals
  Leather   tanned hide; distinct from raw Pelt ingredient type

Note: Ore, Ingot, Gem, and Leather are included to support a future smithing
and forging system. The structure system (forge, kiln, tanning rack) is not
yet implemented — these types are seeded ahead of time so items can be
classified correctly when that system is built.


─────────────────────────────────────────────
5. ITEM WARNINGS
─────────────────────────────────────────────

Warnings are reusable static labels (e.g. "Dangerous for Kits", "Causes Vomiting").
They live on ItemWarning and are linked to items via Item_Warning.

  ItemWarning
    conditionDefId           FK → ConditionDef. The condition spawned when triggered.
    triggeredByInteractionId FK → ItemInteraction. Which interaction fires it.
    If BOTH are null: display-only warning — shown in UI but no automation.
    If BOTH are set: when an entity performs that interaction on the item,
                     the condition is spawned on that entity.

  Item_Warning (junction)
    durationDays  Int?  Overrides the condition's natural duration for this item.
                        Null = use the ConditionDef's default duration.

RULE: Use ItemWarning for hard condition spawns (e.g. Yarrow causes Vomiting,
lethal items for kits). Use ItemEffect (effectType = worsen) for soft, gradual
side effects that nudge a symptom's progressionValue on an existing condition.


─────────────────────────────────────────────
6. HERB / MEDICINE SYSTEM
─────────────────────────────────────────────

Herbs and medicine items use ItemAction + ItemEffect + ItemConditionEffect to
define what happens when an entity uses them.

  ItemInteraction (global seed data)
    The delivery verb — how an entity receives an item's effect.
    Seeded values: eat, drink, apply, inhale, burn.
    Crafting and processing verbs (brew, grind, dry, etc.) are NOT item interactions;
    they live on CraftingInteraction. See docs/crafting-system.md.

  ItemAction (one row per item + interaction combo)
    energyCost      Energy consumed when used outside combat.
    consumedOnUse   false = item remains after use (reusable tools, applicators).
    An item can have multiple ItemAction rows (e.g. catmint can be eaten OR brewed).

  ItemEffectType (seed table)
    treat     — reduces progressionValue by effectiveness
    worsen    — increases progressionValue by effectiveness
    cure      — removes the EntityCondition row entirely (condition effects only)
    transform — replaces the condition with outputConditionDef (condition effects only)

  ItemEffect (one row per action + symptom combo)
    Targets a Symptom. Valid effectTypes: treat, worsen.
    effectTypeId   FK → ItemEffectType
    effectiveness  Base potency for this item+action+symptom pairing.
                   Added to StoredItem.craftBonus when used as a crafting ingredient.

  ItemConditionEffect (one row per action + condition combo)
    Targets a ConditionDef directly. Valid effectTypes: treat, worsen, cure, transform.
    effectTypeId         FK → ItemEffectType
    effectiveness        Float? — required for treat/worsen; null for cure/transform.
    outputConditionDefId Int?   — required for transform; null for treat/worsen/cure.
    Both tables are applied when an item action fires. An item can have entries in
    both — e.g. Catmint treats the Coughing symptom generally AND treats Greencough
    specifically at a higher effectiveness.

  Example — Catmint + Eat:
    ItemEffect          → Coughing symptom,  treat, 1.0   (general)
    ItemConditionEffect → Greencough,        treat, 3.0   (specific bonus)
    ItemConditionEffect → Whitecough,        treat, 2.0   (specific bonus)

  Example — Yarrow + Eat:
    ItemWarning         → spawns Vomiting condition (hard trigger, not an effect row)
    ItemConditionEffect → Ingested Poisoning, transform, → Post-Poisoned

  ItemAction_Output
    Items produced when an action is performed (e.g. applying a poultice leaving
    residue, using a kit consuming a bandage). Supports quantity variance and a
    drop DC. craftBonusApplies: true = StoredItem.craftBonus carries to the output.

RULE: Combat actions (attacks, spells, rank abilities) do NOT use ItemAction.
      They live entirely on ItemEquipmentProfile. No ItemAction row is needed
      for combat-only items.


─────────────────────────────────────────────
7. STORAGE AND STORED ITEMS
─────────────────────────────────────────────

Storage is a container owned by a group or entity. StoredItem is a physical
instance of an Item sitting inside a Storage.

  Storage — key fields:
    weightCapacity     Float?  Null = no weight limit. Enforced as:
                                 Count  → sum of (StoredItem.quantity × Item.averageWeight)
                                 Weight → sum of StoredItem.quantity directly
                               Volume items do not consume weightCapacity.
    fluidCapacity      Float?  Null = no fluid limit (ml). Enforced as:
                                 Volume → sum of StoredItem.quantity directly
                               Count and Weight items do not consume fluidCapacity.
    expirationModifier Float   Multiplier on item spoilage rates. >1.0 = spoils faster.
    isPrimaryStorage   Boolean The group's designated primary storage for accepted types.
    acceptsAll         Boolean True = accepts any item type (personal entity storage).

  Storage_ItemType — which ItemType tags a storage accepts. An item must match at
  least one accepted type to be stored. Ignored when acceptsAll = true.

  StoredItem — key fields:
    quantity          Amount in the item's measurement unit:
                        Count  → number of units (e.g. 5 leaves)
                        Weight → grams (e.g. 80g of paste)
                        Volume → millilitres (e.g. 150ml of oil)
    storedAt          Timestamp used to calculate decay progress.
    craftBonus        Flat bonus accumulated through crafting skill rolls. Carried
                      forward to recipe outputs when RecipeOutput.craftBonusApplies = true.
    currentDurability Tracks remaining durability. Null when maxDurability is null.
    usesRemaining     Tracks uses left. Null when maxUses is null. Decremented on use.
    isEquipped        True = currently equipped by the owning entity.
    chosenProfileId   Which ItemEquipmentProfile was selected at equip time.
    equippedAt        Timestamp set when equipped; null when not equipped.

  Decay formula (app-side):
    decay% = days_elapsed / (item.decayDays × storage.expirationModifier × season_modifier)
    Only relevant when item.decayDays is non-null.

  RULE: currentDurability and usesRemaining must always be null if their respective
        Item.maxDurability / Item.maxUses are null, and non-null otherwise.


─────────────────────────────────────────────
8. EQUIPMENT SYSTEM
─────────────────────────────────────────────

Items that can be equipped have one or more ItemEquipmentProfile rows. Multiple
profiles represent different equip modes (e.g. one-handed vs two-handed grip).

  EquipmentSlotType
    The slot category: Hand, Head, Chest, Innate, etc.
    defaultCapacity   How many slots of this type an entity has by default.
    isUnlimited       true = capacity is never enforced (Innate slot — used for
                      biological attacks, innate rank abilities, spells).
    Per-species overrides live in Species_EquipmentLoadout.

  ItemEquipmentProfile — key fields:
    slotTypeId      Which slot this profile occupies.
    slotCost        Slots consumed (2 for two-handed, 1 for everything else).
    label           Display name for this mode ("One-Handed", "Two-Handed"); null = no label.
    acModifier      Flat AC modifier while equipped. Positive = bonus, negative = penalty.

  Damage:
    damageDiceCount / damageDiceSides / damageTypeId
    elementalDiceCount / elementalDiceSides / elementalDamageTypeId  (secondary)
    Null = this profile deals no inherent damage (shields, pure armor).

  Healing:
    healDiceCount / healDiceSides  (for medic kit type items used in combat)
    healBonus lives in Roll modifiers below — flat bonus applied to heal rolls.

  Combat action metadata (null actionCategoryId = no combat use):
    actionCategoryId     FK → CombatActionCategory
    actionTypeId         FK → ItemActionType (attack, heal, buff, debuff)
    targetScopeId        FK → CombatTargetScope (self, single, all_allies, etc.)
    cooldownRounds       Rounds before action can be used again.
    durationRounds       0 = instantaneous effect.
    isMagical            true = damage/heal counts as magical.
    behaviorEffectTypeId Stateful behaviors: guard, taunt, parry, etc.

  Requirement flags:
    requiresVerbal       Blocked by conditions with blocksVerbal = true.
    requiresSomatic      Blocked by conditions with blocksSomatic = true.
    allowedInSpar        false = profile cannot be used in a spar context.

  Roll modifiers:
    hitStatId / damageStatId / healStatId   Stat modifier added to respective rolls.
    hitBonus / damageBonus / healBonus       Flat bonuses on top of stat modifier.

  Optional triggers:
    triggersEventDefId  Event fired when this action is used.
    triggerDC           Minimum d20 roll required to fire (1 = always, 20 = nat 20).

  Summon fields (only when actionType = 'summon'):
    summonSpeciesId / summonDiceCount / summonDiceSides

  Condition sub-table (ItemEquipmentProfile_Condition):
    onEquip = true  → condition applied while equipped, removed on unequip.
                      applicationDC, combatInstancedOnly, roundDuration ignored.
    onEquip = false → condition applied when the action fires.

    appliesTo       "target" (default) = applied to the action target.
                    "self" = applied to the entity using the action.
                    One profile can have both (e.g. Grapple applies "Grappling" to self
                    and "Grappled" to target using two rows with different appliesTo).

    removes         true = action removes the condition rather than applying it.
                    applicationDC becomes the removal DC. If the removed EntityCondition
                    has a linkedConditionId, the linked partner is also removed.

    linkedProfileConditionId  Self-referential FK. When two rows on the same profile
                    are linked here, the app creates their EntityCondition rows and sets
                    EntityCondition.linkedConditionId on each pointing to the other.
                    Used for mutually-dependent condition pairs (Grappling ↔ Grappled).

  ItemEquipmentProfile_RequiredItem   Other items that must also be equipped.

  Slot enforcement (app-side):
    Sum chosenProfile.slotCost for all equipped items sharing the same slotTypeId.
    Compare against Species_EquipmentLoadout.capacity if a row exists,
    otherwise EquipmentSlotType.defaultCapacity.
    isUnlimited slots skip enforcement entirely.


─────────────────────────────────────────────
9. INGREDIENT TYPES AND CRAFTING
─────────────────────────────────────────────

Ingredient types are a crafting-system-exclusive concept. They are fully
documented in docs/crafting-system.md. Do not use ingredient types for
event effects, storage filtering, or any system outside of crafting —
those systems use ItemType instead.


─────────────────────────────────────────────
10. QUICK REFERENCE — WHICH TABLE FOR WHAT
─────────────────────────────────────────────

  "What kind of thing is this item?"                 → ItemType (tags via Item_Type)
  "How is this item's quantity measured?"            → Item.measurementTypeId → MeasurementType
  "How much does one unit of this item weigh?"       → Item.averageWeight (grams; always present)
  "How much volume does one unit occupy?"            → Item.averageVolume (ml; Volume items only)
  "Where can this item be stored?"                   → ItemType tags + Storage_ItemType
  "How much can a storage hold by weight?"           → Storage.weightCapacity
  "How much fluid can a storage hold?"               → Storage.fluidCapacity
  "Does this item decay?"                            → Item.decayDays (null = never decays)
  "Is this item dangerous to use?"                   → ItemWarning + Item_Warning
  "Does this item spawn a condition on use?"         → ItemWarning (conditionDefId + triggeredByInteractionId)
  "What does eating/applying this herb do?"          → ItemAction → ItemEffect (symptoms)
  "Does this item treat/affect a specific condition?"→ ItemAction → ItemConditionEffect
  "What does using this item produce?"               → ItemAction_Output
  "Can this item be equipped?"                       → ItemEquipmentProfile (one or more rows)
  "What slot does this item use?"                    → ItemEquipmentProfile.slotTypeId
  "Does this item deal damage?"                      → ItemEquipmentProfile.damageDiceCount
  "Does this item apply a condition to a target?"    → ItemEquipmentProfile_Condition (appliesTo = "target")
  "Does this item apply a condition to the user?"    → ItemEquipmentProfile_Condition (appliesTo = "self")
  "Does this item remove a condition?"               → ItemEquipmentProfile_Condition (removes = true)
  "Does this action create a mutual linked state?"   → ItemEquipmentProfile_Condition.linkedProfileConditionId
  "What crafting recipes use this item?"             → see docs/crafting-system.md
  "How many times can this item be used?"            → Item.maxUses → StoredItem.usesRemaining
  "Does this item wear down with use?"               → Item.maxDurability → StoredItem.currentDurability
  "Can this item be used as fuel?"                   → Item.fuelValue (null = not a fuel source)
  "Is this item granted by a condition?"             → ConditionDef_GrantedItem
  "Was this item created by the crafting system?"    → Item.isEphemeral
