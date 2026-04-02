// Re-export the singleton client and class for convenience.
// Feature services (e.g. GuildService, EntityService) should import apiClient
// from here and use it to make typed calls to the API.
//
// Example service pattern:
//
//   import { apiClient } from '../services/api';
//   import type { GuildSettings } from '@prisma/primary';
//
//   export async function getGuildSettings(guildId: string) {
//       return apiClient.get<GuildSettings>(`/guilds/${guildId}/settings`);
//   }

export { apiClient, ApiClient } from './apiClient';
