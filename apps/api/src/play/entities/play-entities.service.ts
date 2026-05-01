import { Injectable } from '@nestjs/common';
import { PrimaryDatabaseService } from '../../database/primary.service';
import { PlayEntitiesRepository } from './play-entities.repository';

@Injectable()
export class PlayEntitiesService {
    constructor(
        private readonly repo: PlayEntitiesRepository,
        private readonly db:   PrimaryDatabaseService,
    ) {}

    getMyCharacters(guildId: string, userId: string) {
        return this.repo.findMyCharacters(guildId, userId);
    }

    // Grants a skill tree node to an entity. Handles the UPGRADES cascade (removes the
    // superseded node and its profile override) and writes Entity_ProfileOverride if the
    // node has a SkillTreeNode_ProfileOverride configured.
    async grantSkillTreeNode(entityId: number, nodeId: number): Promise<void> {
        const node = await this.db.skillTreeNode.findUnique({
            where:  { id: nodeId },
            select: {
                abilityDefId:    true,
                profileOverride: { select: { originalProfileId: true, replacementProfileId: true } },
                relations: {
                    where:  { relationType: { name: 'UPGRADES' } },
                    select: { targetNodeId: true },
                },
            },
        });
        if (!node) throw new Error(`Skill tree node ${nodeId} not found`);

        await this.db.$transaction(async tx => {
            // UPGRADES: remove the superseded node and any profile override it granted.
            for (const rel of node.relations) {
                await tx.entity_ProfileOverride.deleteMany({
                    where: { entityId, sourceNodeId: rel.targetNodeId },
                });
                await tx.entity_SkillTreeNode.deleteMany({
                    where: { entityId, nodeId: rel.targetNodeId },
                });
            }

            // Grant this node (idempotent — safe to call twice).
            const obtained = await tx.entity_SkillTreeNode.upsert({
                where:  { entityId_nodeId: { entityId, nodeId } },
                create: { entityId, nodeId },
                update: {},
                select: { id: true },
            });

            // Write profile override if the node defines one.
            if (node.profileOverride) {
                await tx.entity_ProfileOverride.upsert({
                    where:  { entityId_originalProfileId: { entityId, originalProfileId: node.profileOverride.originalProfileId } },
                    create: {
                        entityId,
                        originalProfileId:    node.profileOverride.originalProfileId,
                        replacementProfileId: node.profileOverride.replacementProfileId,
                        sourceNodeId:         nodeId,
                    },
                    update: {
                        replacementProfileId: node.profileOverride.replacementProfileId,
                        sourceNodeId:         nodeId,
                    },
                });
            }

            // Grant the ability if one is defined on the node.
            if (node.abilityDefId) {
                await tx.entity_Ability.create({
                    data: {
                        entityId,
                        abilityDefId: node.abilityDefId,
                        sourceType:   'skill_tree',
                        sourceId:     obtained.id,
                    },
                });
            }
        });
    }
}
