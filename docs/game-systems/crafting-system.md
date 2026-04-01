CRAFTING SYSTEM — DESIGN REFERENCE
===================================
Last updated: 2026-03-29 (per-entity discovery, minCraftingLevel, craftingXpReward, Compost interaction)

This file is the authoritative reference for how the crafting and ingredient
processing systems work in EchoPaw. Read this before writing recipe seeding
code, crafting queries, or any system that creates, reads, or consumes crafted
or processed items.

Ingredient types are INTERNAL to this system. They are not used by event
effects, storage filtering, UI classification, or any other system. Those
systems use ItemType instead.


─────────────────────────────────────────────
1. OVERVIEW
─────────────────────────────────────────────

The crafting system is a single unified recipe framework that replaces the
old CraftingRecipe, IngredientAction, and Preparation systems. It handles:

  - Single-item transforms    dry Yarrow Leaf → Dried Yarrow Leaf
  - Processing chains         dry → grind → brew (sequential recipes)
  - Multi-ingredient crafting 2× Stick + any Fiber item → Splint
  - Butchering / rendering    Rabbit Corpse → Meat + Pelt + Bones (by weight)
  - Concoctions               Dried Yarrow + Dried Catmint → brewed tea (ephemeral)
  - Time-gated recipes        Bake, Brew — require real time before output appears

Every recipe is defined as:
  CraftingInteraction (verb) + RecipeSlots (inputs) + RecipeOutputs (outputs)


─────────────────────────────────────────────
2. MEASUREMENT TYPES
─────────────────────────────────────────────

MeasurementType is a global seed table that defines how ingredient quantities
are expressed. Each ingredient type has exactly one measurement type.

  Seeded values:
    Weight   g       powders, dried herbs, pastes, fat, meat
    Count    units   sticks, stones, whole berries, seeds, feathers
    Volume   ml      liquids — water, juice, oil, honey

The measurement type determines the unit for RecipeSlot.quantity and for
StoredItem quantity interpretation within the crafting context.

RULE: Weight and volume are not interchangeable. Honey by grams ≠ honey by ml
(honey is ~1.4× denser than water). Each ingredient type picks one unit and
stays consistent. Recipes never convert between measurement types.


─────────────────────────────────────────────
3. INGREDIENT TYPES
─────────────────────────────────────────────

IngredientType is a global seed table of crafting-specific classification
labels. Each type has one name and one MeasurementType.

Ingredient types drive two things:
  1. Slot matching — RecipeSlotOption uses required/excluded tags to determine
     which items satisfy a slot (see section 5).
  2. Output tagging — RecipeOutput can add or remove ingredient types from
     the ephemeral item it creates (see section 7).

Seeded types:
  Raw plant:    Flower, Root, Leaf, Stalk, Seed, Bark, Berry, Bud    (Count)
  Raw fungi:    Mushroom                                              (Count)
  Raw animal:   Pelt, Feather, Bone, Sinew, Egg                      (Count)
  Raw material: Wood, Stone, Vine, Reed, Shell, Fiber, Cobweb, Moss  (Count)
  Processed:    Dried, Cooked, Rotten, Ground, Paste, Mash, Shredded, Char   (null / Weight)
  Bulk animal:  Meat, Fat, Clay                                       (Weight)
  Flavor tags:  Sweet, Bitter, Sour, Savory, Spicy, Mild             (null)
  End results:  Tea, Poultice, Salve, Tincture, Broth, Meal          (null)
  Liquids:      Liquid, Juice, Oil, Resin                            (Volume)
  Smithing:     Ore, Ingot, Gem, Hide, Leather, Cloth, Ceramic       (Count)
  Smithing:     Coal, Slag                                            (Weight)

An item can carry multiple ingredient types. A honey item might carry both
Liquid (Volume) and Sweet (Volume). The slot option that requires both tags
will only match items that have all of them.

RULE: Ingredient types are global and have no guildId. Only Item_IngredientType
(the junction) is guild-scoped.


─────────────────────────────────────────────
4. ITEM INGREDIENT TYPE TAGGING
─────────────────────────────────────────────

Item_IngredientType attaches ingredient types to items for crafting purposes.

  guildId          "global" for seeded assignments; guild snowflake for custom.
  itemId           FK → Item
  ingredientTypeId FK → IngredientType

  @@id([guildId, itemId, ingredientTypeId])

A guild can override or extend the ingredient type tags of any item, including
globally seeded items. When resolving which tags an item has in a crafting
context, the app queries: guildId IN ["global", <this_guild>].

This is the ONLY table outside of the recipe models themselves that uses
ingredient types. Nothing else in the system reads Item_IngredientType.


─────────────────────────────────────────────
5. CRAFTING INTERACTIONS
─────────────────────────────────────────────

CraftingInteraction is a global seed table of crafting verbs. It is entirely
separate from ItemInteraction, which covers medicine use and item consumption.

  Herbalism / food:
    Brew      time-gated; produces ephemeral concoctions (teas, poultices)
    Dry       transforms items; extends decay; adds Dried ingredient type tag
    Grind     transforms dried/mineral items into powder/paste
    Mash      crushes berries/roots; produces juice + mash outputs
    Bake      time-gated; cooking recipes
    Render    extracts fat/oil from raw materials
    Crush     breaks apart seeds, shells, or bark

  General crafting:
    Butcher   breaks down a carcass into byproducts by weight proportion
    Craft     general assembly (splint, bandage, tool construction)
    Carve     shapes bone, stone, or wood using a cutting tool
    Weave     interlaces fiber, vine, or reed into cloth or cord
    Tan       processes raw hide into leather (requires tanning rack — not yet implemented)
    Compost   breaks down rotten food, spoiled herbs, and plant scraps into compost
              (output feeds the farming system — not yet implemented)

  Smithing / forging (structure system not yet implemented):
    Smelt     melts ore into ingots (requires forge or furnace structure)
    Forge     shapes a heated ingot into tools, weapons, or armor (requires forge structure)
    Temper    hardens metal through heat cycles (requires forge structure)
    Kiln      fires clay items into ceramics (requires kiln structure)

A CraftingInteraction has no behavior of its own. Behavior is defined by the
recipe that uses it. The same verb (Dry) can have different skill requirements,
inputs, and outputs depending on which recipe is matched.

Note: Smelt, Forge, Temper, Kiln, and Tan are seeded now so recipes can be
authored and discovered ahead of the structure system being built. Until
structures are implemented, the app should gate these recipes behind a
structure check that is always treated as unmet.

Note: Compost is seeded ahead of the farming system. It requires no structure,
but has no defined output items yet. Until the farming system is built, Compost
recipes should be treated as having no outputs — ingredients are consumed and
nothing is produced.


─────────────────────────────────────────────
6. RECIPES
─────────────────────────────────────────────

Recipe is the root table. One row per distinct crafting operation.

  guildId               "global" for seeded recipes; guild snowflake for custom.
  name                  Unique within a guild.
  craftingInteractionId The verb used to trigger this recipe.
  requiresDiscovery     true = hidden until the entity discovers it via
                        experimentation or an admin grants it directly.
  craftingTimeMins      null = instant. Non-null = minutes that must pass
                        before outputs are produced (e.g. 480 = 8 hours for
                        overnight drying, 30 for brewing a tea).
  maxBatchSize          null = unlimited. Maximum number of times this recipe
                        can be executed in a single crafting action.
  minCraftingLevel      null = no minimum. Minimum crafting skill level the
                        entity must have to attempt this recipe. Checked before
                        the skill roll — an entity below the minimum cannot
                        attempt the recipe at all.
  craftingXpReward      XP granted to the entity on a successful craft.
                        0 = no XP (default). Leaf drying and similar trivial
                        recipes may grant a small amount; more complex recipes
                        (berry drying, concoctions) grant more.

Discovery tracking:
  Entity_DiscoveredRecipe records which entities have discovered a recipe.
  One row per entity+recipe pair. Discovery is per-cat — each entity must
  discover a recipe themselves through experimentation or an admin grant.
  There is no group-level discovery; knowing a recipe does not share it.


─────────────────────────────────────────────
7. RECIPE SLOTS (INPUTS)
─────────────────────────────────────────────

Each RecipeSlot defines one ingredient requirement. A recipe with three slots
requires three distinct ingredients to be satisfied before it can fire.

  slotIndex         Display/processing order (ascending).
  label             Optional display label, e.g. "Binding", "Tool".
  quantity          The per-batch minimum amount of this ingredient.
                    This value is set by the recipe author and is not
                    alterable by the player. See section 8 for how batch
                    count scales total required quantities.
  measurementTypeId Unit for quantity — must match the ingredient type's unit.
  consumedOnUse     true  = ingredient is consumed when the recipe fires.
                    false = TOOL SLOT. The item is required but returned to
                    storage after crafting (mortar and pestle, knife, etc.).
  scalesWithBatch   true  = total required = quantity × batch_count.
                    false = quantity is fixed regardless of batch count.

  The four combinations and their meaning:

    consumedOnUse=true,  scalesWithBatch=true
      Standard ingredient. 2× batches consumes 2× the ingredient.
      e.g. Herbs in a brewed tea.

    consumedOnUse=true,  scalesWithBatch=false
      Fixed catalyst. Consumed exactly once regardless of batch count.
      e.g. A rare binding agent that is always needed in equal measure.

    consumedOnUse=false, scalesWithBatch=true
      Scaling tool. Returned after crafting, but costs 1 durability per batch.
      e.g. Carving tools for wooden statues — 2 statues costs 2 durability.

    consumedOnUse=false, scalesWithBatch=false
      Fixed tool. Required but costs only 1 durability total.
      e.g. A fire source needed to bake — used once regardless of batch count.

RULE: Tool slots are always returned regardless of success or failure.
RULE: Durability deduction for tool slots is app-side. If a tool has
insufficient durability to complete all requested batches, the app produces
as many batches as durability allows and cancels the rest.


─────────────────────────────────────────────
8. BATCH SCALING
─────────────────────────────────────────────

When a player initiates a crafting action, they choose a batch count between
1 and Recipe.maxBatchSize (or unlimited if maxBatchSize is null).

For each slot, the total ingredient required is:

  scalesWithBatch = true:   total = slot.quantity × batch_count
  scalesWithBatch = false:  total = slot.quantity  (always)

Outputs scale the same way:

  RecipeOutput fixed mode:  output_qty = avgQuantity × batch_count (± variance per batch)
  RecipeOutput proportional: output_qty = inputWeight × inputProportion (already batch-relative)

Players cannot alter the per-batch quantity — that is defined by the recipe
author. They can only choose how many batches to run.

Example — Brew Tea (maxBatchSize = 3):

  Slot 1: Dried Leaf, 5g, scalesWithBatch=true
  Slot 2: Water,      50ml, scalesWithBatch=true
  Slot 3: Clay Pot,   1 unit, consumedOnUse=false, scalesWithBatch=false

  Batch count = 2:
    Slot 1 requires 10g of dried leaf   (5 × 2)
    Slot 2 requires 100ml of water      (50 × 2)
    Slot 3 requires 1 clay pot          (fixed, returned after)

Example — Carve Wooden Statue (maxBatchSize = 2):

  Slot 1: Wood,         1 unit, scalesWithBatch=true
  Slot 2: Carving Tool, 1 unit, consumedOnUse=false, scalesWithBatch=true

  Batch count = 2:
    Slot 1 requires 2 units of wood    (1 × 2, consumed)
    Slot 2 requires 1 carving tool     (fixed quantity, returned)
    Carving tool loses 2 durability    (1 per batch)

  If the carving tool has only 1 durability remaining:
    App produces 1 statue, cancels the second, returns the tool.


─────────────────────────────────────────────
9. SLOT OPTIONS (INPUT MATCHING)
─────────────────────────────────────────────

Each RecipeSlot has one or more RecipeSlotOptions. Options have an OR
relationship — satisfying any one option satisfies the slot.

Each option uses one of two matching strategies (app-enforced; mutually
exclusive):

  SPECIFIC ITEM (itemId non-null)
    Only this exact seeded item satisfies the option.
    e.g. "must be Yarrow Leaf specifically"

  TAG INTERSECTION (itemId null + requiredTags)
    Any item that carries ALL required tags AND NONE of the excluded tags
    satisfies the option.
    e.g. requiredTags = [Liquid, Sweet] → honey or tree sap qualify;
         plain water does not (lacks Sweet).

  RecipeSlotOption_RequiredTag — ingredient types item MUST have (AND).
  RecipeSlotOption_ExcludedTag — ingredient types item must NOT have (AND NOT).

Examples:

  Dry recipe input slot:
    Option 1: requiredTags = [Leaf], excludedTags = [Dried]
    → any leaf item that has not already been dried

  Brew recipe input slot (accepts any dried herb):
    Option 1: requiredTags = [Dried, Leaf]
    Option 2: requiredTags = [Dried, Root]
    → either a dried leaf OR a dried root satisfies the slot

  Craft splint:
    Slot 1 — Option 1: itemId = Stick (specific)
    Slot 1 — Option 2: itemId = Stick (second slot, also specific)
    Slot 2 — Option 1: requiredTags = [Fiber]
    → exactly 2 sticks + any fiber item

RULE: An item satisfying one slot cannot simultaneously satisfy another slot
in the same recipe. Each consumed item maps to exactly one slot.


─────────────────────────────────────────────
10. RECIPE OUTPUTS
─────────────────────────────────────────────

Each RecipeOutput defines one item produced by the recipe. A recipe can have
any number of outputs — seeded items, ephemeral items, or a mix of both.

  outputItemId      FK → Item. Non-null = seeded output.
                    Null = ephemeral output (app creates Item at craft time).

  OUTPUT MODES (RecipeOutputMode seed table):

    fixed
      outputQuantity = avgQuantity ± (avgQuantity × quantityVariance)
      e.g. avgQuantity=1.0, quantityVariance=0.0 → always produces exactly 1
      e.g. avgQuantity=400.0, quantityVariance=0.2 → rolls between 320–480g

    proportional
      outputQuantity = consumedInputWeight × inputProportion
      Used for butchering and rendering where output scales with input size.
      e.g. inputProportion=0.5 → a 1200g rabbit yields 600g of meat.
      avgQuantity and quantityVariance are ignored in this mode.

  dropDC            Minimum d20 roll to produce this output.
                    1 = always produced (default).
                    20 = only on a natural 20.
                    Use for probabilistic byproducts (pelt drop, rare extract).

  onFailure         false (default) = produced on successful skill roll.
                    true = produced on failed skill roll.
                    A recipe can have both success and failure outputs.
                    e.g. success → Dried Yarrow Leaf; failure → Ruined Herb.

  craftBonusApplies true = the source StoredItem.craftBonus is carried forward
                    to the output StoredItem.craftBonus. Used for processing
                    chains where skill quality should propagate (dried herb
                    craftBonus affects brewed tea potency).

  EPHEMERAL MODIFIERS (ignored for seeded outputs — outputItemId non-null):

  preName / postName
                    Assemble the display name: "{preName} {source.name} {postName}".
                    Either or both can be null (unchanged / omitted).

  decayDaysMultiplier Float?
                    Multiplied against the source item's decayDays.
                    null = unchanged. 10.0 = lasts 10× longer after drying.

  decayVariance     Float?
                    Overrides the source item's weightVariance field, which
                    controls the spread of actual decay timing.
                    null = inherit from source.

  effectivenessMultiplier Float?
                    Multiplied against every copied ItemEffect and
                    ItemConditionEffect effectiveness value on the ephemeral
                    item. null = unchanged. 1.5 = 50% more potent.

  outputMeasurementTypeId Int?
                    Overrides measurementTypeId on the ephemeral item.
                    null = inherit from source.
                    Use when the crafting process changes how the output is
                    measured (e.g. Count leaf → Weight powder after grinding).
                    Must be consistent with the measurement type implied by
                    any addTags — enforced app-side at recipe creation.

  RecipeOutput_FoodOverride (sub-table, optional)
                    Sparse overrides for food profile values. Only non-null
                    fields are applied; null fields inherit from the source
                    item's food profile. Fields:
                      meatNutritionPerGram
                      meatHydrationPerGram
                      plantNutritionPerGram
                      plantHydrationPerGram

RULE: Tool slots (consumedOnUse = false) are never used as the source for
proportional outputs. Proportional mode operates on consumed input weight only.


─────────────────────────────────────────────
11. EPHEMERAL ITEMS
─────────────────────────────────────────────

When a RecipeOutput has outputItemId = null, the app creates a new Item row
at craft time. This ephemeral item is a full copy of the source item with
recipe-specified modifications applied.

  NAMING
    Display name (Item.name):
      preName   Prepended to source display name: "Dried" → "Dried Yarrow Leaf"
      postName  Appended to source display name: "Paste"  → "Yarrow Paste"
      Both can be set: "Dried" + "Powder" → "Dried Root Powder"
      App sets Item.name = "{preName} {source.name} {postName}" (trimmed).

    Code name (Item.codeName):
      App sets Item.codeName = "{source.codeName}_{randomHex6}"
      e.g. yarrow_leaf → yarrow_leaf_a3f9b2
      The random suffix guarantees the DB unique constraint is never violated
      regardless of how many ephemeral instances share the same display name.

  PROPERTY COPY
    The app copies all scalar fields from the source Item:
      averageWeight, weightVariance, decayDays, maxUses, fuelValue, etc.
    Then applies recipe modifiers in this order:
      outputMeasurementTypeId   replaces measurementTypeId if non-null.
      decayDaysMultiplier       multiplied against copied decayDays; null = unchanged.
      decayVariance             replaces copied weightVariance if non-null.
      effectivenessMultiplier   multiplied against all copied ItemEffect /
                                ItemConditionEffect effectiveness values; null = unchanged.
      RecipeOutput_FoodOverride sparse patch of food profile fields; only
                                non-null fields overwrite the copied values.

  CHILD ROW COPY
    The app creates new child rows pointing to the ephemeral Item:
      ItemAction + ItemEffect + ItemConditionEffect  (treatment values)
      ItemFoodProfile                                (nutritional values)
      Item_Type                                      (Weapon, Medicine, etc.)
    These are full independent rows — not references to the source.
    The ephemeral item can be used, stored, and deleted exactly like any
    other item. No special handling is required at the app layer.

  INGREDIENT TYPE TAGS
    Item_IngredientType rows are copied from the source, then:
      RecipeOutput_AddTag    adds new ingredient types to the output.
      RecipeOutput_RemoveTag removes ingredient types from the output.
    e.g. Dry recipe: copy source tags (Leaf) → add Dried → output has [Leaf, Dried].
    e.g. A recipe might add Dried and remove Fresh if a Fresh tag exists.

  SOURCE TRACKING
    Ephemeral items have no sourceItemId FK. The source item is known to the
    app during the crafting action (it has the consumed StoredItem). Once
    created, the ephemeral item stands alone — it is a full independent item.

  CLEANUP
    isEphemeral = true on the Item row signals the app to delete the Item
    after the last StoredItem referencing it is consumed or removed.
    Deletion cascades identically to any non-ephemeral item — no special path.

  PROCESSING CHAINS
    Ephemeral items can themselves be inputs to further recipes. Dried Yarrow
    Leaf (ephemeral, has [Leaf, Dried] tags) satisfies a Brew slot that
    requires [Dried, Leaf]. The chain dry → grind → brew is fully supported.
    The app always uses the current Item_IngredientType rows of the input item,
    whether it is seeded or ephemeral.

RULE: Ephemeral items never point back to their source. If you need to know
what an item was derived from, look at the crafting log (app-side), not the
schema.


─────────────────────────────────────────────
12. QUICK REFERENCE — WHICH TABLE FOR WHAT
─────────────────────────────────────────────

  "What unit does this ingredient use?"               → IngredientType.measurementTypeId → MeasurementType
  "What ingredient types does this item have?"        → Item_IngredientType (filter by guildId)
  "What crafting verb does this recipe use?"          → Recipe.craftingInteractionId → CraftingInteraction
  "How long does this recipe take?"                   → Recipe.craftingTimeMins (null = instant)
  "How many times can I run this recipe at once?"     → Recipe.maxBatchSize (null = unlimited)
  "Has this entity discovered this recipe?"           → Entity_DiscoveredRecipe
  "What crafting level is required for this recipe?"  → Recipe.minCraftingLevel (null = none)
  "How much XP does this recipe grant on success?"    → Recipe.craftingXpReward
  "What does this slot accept?"                       → RecipeSlotOption (itemId or requiredTags)
  "Can I use an already-dried item here?"             → RecipeSlotOption_ExcludedTag (Dried tag excluded)
  "Is this slot a reusable tool?"                     → RecipeSlot.consumedOnUse = false
  "Does this slot's quantity scale with batch count?" → RecipeSlot.scalesWithBatch
  "How much of this ingredient is needed per batch?"  → RecipeSlot.quantity
  "How many batches can run at once?"                 → Recipe.maxBatchSize (null = unlimited)
  "How much output does this recipe produce?"         → RecipeOutput.outputModeId + avgQuantity / inputProportion
  "What happens if I fail the skill roll?"            → RecipeOutput WHERE onFailure = true
  "Does this output always appear?"                   → RecipeOutput.dropDC (1 = always)
  "Does quality carry through processing?"            → RecipeOutput.craftBonusApplies
  "What item does this recipe output?"                → RecipeOutput.outputItemId (null = ephemeral)
  "What is the ephemeral item named?"                 → RecipeOutput.preName / postName + source Item.name
  "Does processing change the item's decay timing?"  → RecipeOutput.decayDaysMultiplier
  "Does processing change decay spread?"             → RecipeOutput.decayVariance
  "Does processing change treatment potency?"        → RecipeOutput.effectivenessMultiplier
  "Does processing change nutritional values?"       → RecipeOutput_FoodOverride (sparse patch)
  "Does processing change how quantity is measured?" → RecipeOutput.outputMeasurementTypeId
  "What tags does the output item have?"             → source Item_IngredientType + AddTag - RemoveTag
  "Is this item safe to delete normally?"            → yes; Item.isEphemeral only affects cleanup timing
