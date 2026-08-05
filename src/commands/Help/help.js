/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { config } from "#config/config";
import { emoji } from "#config/emoji";

class HelpCommand extends Command {
  constructor() {
    super({
      name: "help",
      description: "Show all available commands and features",
      usage: "help",
      examples: ["help"],
      userPermissions: [],
      botPermissions: [],
      enabledSlash: true,
      slashData: {
        name: "help",
        description: "Show all available commands and features",
      },
    });
  }

  async execute({ ctx }) {
    const helpContent = [
      `## 🎫 TicketBot Command Directory`,
      ``,
      `All commands are available via Slash \`/\` and Prefix \`${config.prefix}\`.`,
      ``,
      `### 🎫 1. Ticket System`,
      `${emoji.add} \`add <@user>\` • ${emoji.lock} \`close [reason]\` • ${emoji.trash} \`delete\` • ${emoji.remove} \`remove <@user>\` • ${emoji.unlock} \`reopen\``,
      ``,
      `### 🎂 2. Birthday Celebration System (Canvas Card & Role)`,
      `🎂 \`birthday <set|view|list|remove>\` • ${emoji.settings} \`birthdayadmin <setup|test|config>\``,
      ``,
      `### 📊 3. Leveling & XP System (Canvas Cards)`,
      `${emoji.crown} \`rank [@user]\` — *Dynamic Canvas Rank Card image*\n` +
      `${emoji.stats} \`leaderboard\` (\`top\`, \`lb\`) — *Dynamic Canvas Top 10 Leaderboard image*\n` +
      `${emoji.settings} \`leveladmin <addxp|addrole|setchannel|setxpchannel|setprogression|roles|reset>\``,
      ``,
      `### 💡 4. Suggestions System`,
      `${emoji.light} \`suggest <text>\` — *Submit suggestion with voting buttons*\n` +
      `${emoji.settings} \`suggest-manage <setup|accept|deny|consider>\``,
      ``,
      `### ⭐ 5. Feedback & Reviews System`,
      `${emoji.starFill} \`feedback <1-5> <message>\` (\`review\`) — *Submit 1-5 star review*\n` +
      `${emoji.settings} \`feedback-manage <setup|stats>\``,
      ``,
      `### 📊 6. Interactive Poll System`,
      `${emoji.poll} \`poll <question> <option1> <option2> ...\` — *Live voting buttons & progress bars*`,
      ``,
      `### 👋 7. Welcome & Goodbye System`,
      `${emoji.bell} \`welcome\` — *Interactive panel for join/leave embeds, auto-role, DM & test preview*`,
      ``,
      `### 🎨 8. Custom Rich Embed Builder`,
      `${emoji.note} \`embed [#channel]\` — *Interactive modal-driven embed designer & preview*`,
      ``,
      `### 🛠️ 9. Admin & Server Settings`,
      `${emoji.dashboard} \`panel\` • ${emoji.settings} \`settings\` • ${emoji.info} \`setprefix <prefix>\` • ${emoji.cross} \`blacklist <add|remove|list>\` • ${emoji.settings} \`staffrole <add|remove|list>\``,
    ].join("\n");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(helpContent)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(ButtonStyle.Link)
            .setURL(config.links.supportServer),
          new ButtonBuilder()
            .setLabel("GitHub Repository")
            .setStyle(ButtonStyle.Link)
            .setURL(config.links.github)
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# © 2026 KAJUKATLI — TicketBot v2.0")
      );

    await ctx.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}

export default new HelpCommand();
// bread end
