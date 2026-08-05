/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { config } from "#config/config";
import { emoji } from "#config/emoji";

class HelpCommand extends Command {
  constructor() {
    super({
      name: "help",
      description: "Show all available commands and features organized by category",
      usage: "help",
      examples: ["help"],
      userPermissions: [],
      botPermissions: [],
      enabledSlash: true,
      slashData: {
        name: "help",
        description: "Show all available commands and features organized by category",
      },
    });
  }

  async execute({ ctx }) {
    const p = ctx.isSlash ? "/" : ".";

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🎫 TicketBot Command Directory`)
      .setDescription(
        `Welcome to **TicketBot**! All commands are available via Slash (\`/\`) and Prefix (\`.\`).\n\n` +
        `**Need Help?** Support Server: [discord.gg/ayushisinsane](${config.links.supportServer})`
      )
      .addFields(
        {
          name: `🎫 1. Ticket System`,
          value:
            `• \`${p}panel\` — Setup interactive ticket panel & category select menus\n` +
            `• \`${p}add <@user>\` — Add a member to the current ticket channel\n` +
            `• \`${p}remove <@user>\` — Remove a member from the ticket channel\n` +
            `• \`${p}close [reason]\` — Close ticket with confirmation & transcript\n` +
            `• \`${p}reopen\` — Reopen a closed ticket channel\n` +
            `• \`${p}delete\` — Delete a ticket channel & generate HTML transcript`,
          inline: false,
        },
        {
          name: `📊 2. Leveling & XP System`,
          value:
            `• \`${p}rank [@user]\` — View dynamic Canvas rank card image, level & XP\n` +
            `• \`${p}leaderboard\` (\`top\`, \`lb\`) — View top 10 Canvas leaderboard image\n` +
            `• \`${p}leveladmin addxp <@user> <amount>\` — Grant bonus XP to a user\n` +
            `• \`${p}leveladmin addrole <level> <@role>\` — Set auto-role reward for a level\n` +
            `• \`${p}leveladmin setchannel [#channel|off]\` — Set level-up announcement channel\n` +
            `• \`${p}leveladmin setxpchannel [#channel|all]\` — Restrict XP earning to a channel\n` +
            `• \`${p}leveladmin setprogression [maxlevel] [xprate]\` — Custom level cap & XP boost\n` +
            `• \`${p}leveladmin roles\` — View all configured level role rewards\n` +
            `• \`${p}leveladmin reset\` — Reset all leveling data for the server`,
          inline: false,
        },
        {
          name: `💡 3. Suggestions System`,
          value:
            `• \`${p}suggest <text>\` — Submit suggestion with voting buttons (auto-deletes)\n` +
            `• \`${p}suggest-manage setup <#channel>\` — Set dedicated suggestions channel\n` +
            `• \`${p}suggest-manage accept <id> [reason]\` — Approve suggestion (Green status)\n` +
            `• \`${p}suggest-manage deny <id> [reason]\` — Deny suggestion (Red status)\n` +
            `• \`${p}suggest-manage consider <id> [reason]\` — Mark under consideration`,
          inline: false,
        },
        {
          name: `⭐ 4. Feedback & Reviews System`,
          value:
            `• \`${p}feedback <1-5> <message>\` (\`review\`) — Submit star review & feedback\n` +
            `• \`${p}feedback-manage setup <#channel>\` — Set dedicated feedback channel\n` +
            `• \`${p}feedback-manage stats\` — View review statistics & average rating`,
          inline: false,
        },
        {
          name: `📊 5. Interactive Poll System`,
          value:
            `• \`${p}poll <question> <option1> <option2> ...\` — Create interactive poll with voting buttons & percentage progress bars`,
          inline: false,
        },
        {
          name: `👋 6. Welcome System`,
          value:
            `• \`${p}welcome channel <#channel>\` — Set welcome announcement channel\n` +
            `• \`${p}welcome message <text>\` — Custom welcome text ({user}, {server}, {membercount})\n` +
            `• \`${p}welcome mode <embed|normal>\` — Toggle Rich Embed vs Normal text\n` +
            `• \`${p}welcome test\` — Send an interactive test preview`,
          inline: false,
        },
        {
          name: `🎨 7. Embed Builder`,
          value:
            `• \`${p}embed\` — Build and send a custom styled embed with title, description & color`,
          inline: false,
        },
        {
          name: `⚙️ 8. Admin & Server Settings`,
          value:
            `• \`${p}setprefix <prefix>\` — Set custom server prefix (e.g. \`!\`, \`.\`)\n` +
            `• \`${p}blacklist <add|remove|list> <@user>\` — Manage blacklisted users\n` +
            `• \`${p}staffrole <add|remove|list> <@role>\` — Manage staff roles`,
          inline: false,
        }
      )
      .setFooter({ text: `⚡ Code by KAJUKATLii • TicketBot v2.0` })
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Support Server")
        .setStyle(ButtonStyle.Link)
        .setURL(config.links.supportServer),
      new ButtonBuilder()
        .setLabel("GitHub Repository")
        .setStyle(ButtonStyle.Link)
        .setURL(config.links.github)
    );

    return ctx.reply({ embeds: [embed], components: [buttons] });
  }
}

export default new HelpCommand();
// bread end
