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
      `### 🎫 Ticket Commands`,
      `${emoji.add} \`add <@user>\` • ${emoji.lock} \`close [reason]\` • ${emoji.trash} \`delete\` • ${emoji.remove} \`remove <@user>\` • ${emoji.unlock} \`reopen\``,
      ``,
      `### 📢 Welcome & Goodbye System`,
      `${emoji.bell} \`welcome\` — *Interactive panel for join/leave embeds, auto-role, DM & test preview*`,
      ``,
      `### 📊 Leveling & XP System`,
      `${emoji.crown} \`rank [@user]\` • ${emoji.stats} \`leaderboard\` (\`top\`, \`lb\`) • ${emoji.settings} \`leveladmin <addxp|addrole|setchannel|setxpchannel|setprogression|roles|reset>\``,
      ``,
      `### 💡 Suggestions System`,
      `${emoji.light} \`suggest <text>\` • ${emoji.settings} \`suggest-manage <setup|accept|deny|consider>\``,
      ``,
      `### ⭐ Feedback & Reviews System`,
      `${emoji.starFill} \`feedback <1-5> <message>\` (\`review\`) • ${emoji.settings} \`feedback-manage <setup|stats>\``,
      ``,
      `### 📊 Interactive Poll System`,
      `${emoji.poll} \`poll <question> <option1> <option2> ...\` — *Live voting buttons & progress bars*`,
      ``,
      `### 🎨 Custom Rich Embed Builder`,
      `${emoji.note} \`embed [#channel]\` — *Interactive modal-driven embed designer & preview*`,
      ``,
      `### 🛠️ Admin & Server Settings`,
      `${emoji.dashboard} \`panel\` • ${emoji.settings} \`settings\` • ${emoji.info} \`setprefix\` • ${emoji.cross} \`blacklist <add|remove|list>\``,
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
