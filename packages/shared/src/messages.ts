// Echo's voice — all user-facing strings live here.
// Static strings are plain values. Dynamic strings are arrow functions that return a string.
// Keep sections grouped by feature so it's easy to find and update Echo's tone.

export const messages = {

    // ── Global ────────────────────────────────────────────────────────────────
    errorGeneric:    `*"Oh dear, something went wrong..."*`,
    errorUnexpected: `*"I'm not quite sure what you even did... please let my creator know how you got this error!"*`,
    errorDatabase:   `*"Oh no! I encountered an unexpected issue with my database. I'll clean it up as fast as I can!"*`,
    invalidPerms:    `*"Excuse me, but I'm afraid only an admin can do such things."*`,
    invalidSubcommand: `*"That's not a valid option, silly!"*`,
    notYourButton:   `*"Those aren't your buttons to press!"*`,
    deferMessage:    `*"I'll have it done with the flick of my tail!"*`,
    timeout:         `*"Oh dear, it seems something took too long to respond! Please try again."*`,

    textInputTooLong: (maxLength: number) =>
        `*"Oh my, that's a bit too long! Could you please keep it under ${maxLength} characters?"*`,

    apiError: (error: { code: string; name: string; description: string; problems?: { message: string }[] | null }) => {
        if (error.code === 'OPERATION_FAILED') return messages.errorDatabase;
        if (error.problems?.length) {
            const list = error.problems.map(p => `• ${p.message}`).join('\n');
            return `❌ **${error.name}**\n${list}`;
        }
        return `❌ **${error.name}** — ${error.description}`;
    },

    // ── Welcome ───────────────────────────────────────────────────────────────
    welcomeHeader: `## Welcome to EchoEngine!`,

    welcomeBody:
        `*"Oh! It looks like this is my first time in your server — how exciting! I'm Echo, a world simulation bot built for roleplay servers with a DnD/RPG-inspired twist. Think of me as a little engine quietly keeping your world alive in the background.*\n\n` +
        `*Here's a taste of what I can get up to:"*\n\n` +
        `- **Real-time Weather & Seasons** — *the skies change whether your characters are ready or not.*\n` +
        `- **Condition System** — *wounds, illnesses, species traits, and combat buffs, all tracked so you don't have to.*\n` +
        `- **Medical System** — *user-created medications and herbal supplies, tied directly into conditions.*\n` +
        `- **Crafting** — *a flexible system with user-defined items and outcomes.*\n` +
        `- **Species & Character Customization** — *broad tools to tailor both to whatever world you're building.*\n` +
        `- **Groups & Rankings** — *organized factions with hierarchies and multi-character support.*\n` +
        `- **Character Progression** — *experience, stats, and health tracked across as many characters as your players can handle.*\n` +
        `- *And quite a bit more!*\n\n`,

    welcomeCta:
        `*"Whenever you're ready, \`/echo help\` is a wonderful place to start if you'd like a proper introduction to everything I can do. Or, if you're the adventurous type and would rather just see what happens — the **Modules** button below will get you moving!*\n\n` +
        `*Oh, and if something isn't working quite right, or you've had a bright idea you'd like to share, the **Feedback** button will take you straight to our public repository. My team keeps a close eye on it, and we truly love hearing from the people who use me!"*\n\n` +
        `-# Important: We will never ask for your password or personal information — not in Discord, not anywhere. If anyone claiming to be from the EchoEngine team ever asks for these, do not share them.`,

    // ── Dens ──────────────────────────────────────────────────────────────────
    denNotSet:      `*"No dens have been set up just yet! An admin will need to use \`/server den set\` to give me a place to speak first."*`,
    denRestricted:  `*"I can only speak in my dens, I'm afraid!"*`,
    denNotFound:    `*"This place isn't one of my dens yet."*`,
    noDens:         `*"I don't have any dens in this server yet."*`,

    denRegistered:        `## Den Registered\nThis channel has been registered as an Echo Den. Bot commands and activity will be posted here.`,
    denAlreadyRegistered: (channelId: string) => `*"I've already made a nest in <#${channelId}>!"*`,
    denRegistrationFailed:(description: string) => `*"Oh dear, I ran into a little trouble setting that up: ${description}"*`,
    denRemoved:           (channelId: string) => `*"Understood — I'll stay quiet in <#${channelId}> from now on."*`,

} as const;

export type MessageKey = keyof typeof messages;
