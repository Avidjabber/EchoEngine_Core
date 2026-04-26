-- Config table: which profile a skill tree node replaces and with what.
CREATE TABLE "SkillTreeNode_ProfileOverride" (
    "nodeId"               INTEGER NOT NULL,
    "originalProfileId"    INTEGER NOT NULL,
    "replacementProfileId" INTEGER NOT NULL,
    CONSTRAINT "SkillTreeNode_ProfileOverride_pkey"                     PRIMARY KEY ("nodeId"),
    CONSTRAINT "SkillTreeNode_ProfileOverride_nodeId_fkey"              FOREIGN KEY ("nodeId")               REFERENCES "SkillTreeNode"("id")        ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT "SkillTreeNode_ProfileOverride_originalProfileId_fkey"   FOREIGN KEY ("originalProfileId")    REFERENCES "ItemEquipmentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SkillTreeNode_ProfileOverride_replacementProfileId_fkey" FOREIGN KEY ("replacementProfileId") REFERENCES "ItemEquipmentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "SkillTreeNode_ProfileOverride_originalProfileId_idx"    ON "SkillTreeNode_ProfileOverride"("originalProfileId");
CREATE INDEX "SkillTreeNode_ProfileOverride_replacementProfileId_idx" ON "SkillTreeNode_ProfileOverride"("replacementProfileId");

-- State table: per-entity active profile overrides, written when the source node is granted.
CREATE TABLE "Entity_ProfileOverride" (
    "id"                   SERIAL  NOT NULL,
    "entityId"             INTEGER NOT NULL,
    "originalProfileId"    INTEGER NOT NULL,
    "replacementProfileId" INTEGER NOT NULL,
    "sourceNodeId"         INTEGER NOT NULL,
    CONSTRAINT "Entity_ProfileOverride_pkey"                     PRIMARY KEY ("id"),
    CONSTRAINT "Entity_ProfileOverride_entityId_fkey"            FOREIGN KEY ("entityId")             REFERENCES "Entity"("id")               ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT "Entity_ProfileOverride_originalProfileId_fkey"   FOREIGN KEY ("originalProfileId")    REFERENCES "ItemEquipmentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entity_ProfileOverride_replacementProfileId_fkey" FOREIGN KEY ("replacementProfileId") REFERENCES "ItemEquipmentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entity_ProfileOverride_sourceNodeId_fkey"        FOREIGN KEY ("sourceNodeId")         REFERENCES "SkillTreeNode"("id")        ON DELETE CASCADE  ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Entity_ProfileOverride_entityId_originalProfileId_key" ON "Entity_ProfileOverride"("entityId", "originalProfileId");
CREATE INDEX "Entity_ProfileOverride_entityId_idx"    ON "Entity_ProfileOverride"("entityId");
CREATE INDEX "Entity_ProfileOverride_sourceNodeId_idx" ON "Entity_ProfileOverride"("sourceNodeId");
