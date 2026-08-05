/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import { PermissionFlagsBits, MessageFlags, EmbedBuilder } from "discord.js";
import { emoji } from "#config/emoji";

class LevelAdminCommand extends Command {
  constructor() {
    super({
      name: "leveladmin",
      description: "Manage leveling, XP, channel, and level role rewards (Admin)",
      usage: "leveladmin <addxp|addrole|setchannel|roles|reset>",
      examples: [
        "leveladmin addxp @user 500",
        "leveladmin addrole 5 @role",
        "leveladmin setchannel #level-ups",
      ],
      userPermissions: [PermissionFlagsBits.ManageGuild],
      botPermissions: [PermissionFlagsBits.ManageRoles],
      enabledSlash: true,
      slashData: {
        name: "leveladmin",
        description: "Manage leveling, XP, channel, and level role rewards (Admin)",
        defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
        options: [
          {
            name: "addxp",
            description: "Give XP to a user",
            type: 1, // SUB_COMMAND
            options: [
              { name: "user", description: "User to give XP to", type: 6, required: true },
              { name: "amount", description: "Amount of XP", type: 4, required: true },
            ],
          },
          {
            name: "addrole",
            description: "Set a role reward for reaching a level",
            type: 1, // SUB_COMMAND
            options: [
              { name: "level", description: "Level requirement", type: 4, required: true },
              { name: "role", description: "Role to award", type: 8, required: true },
            ],
          },
          {
            name: "setchannel",
            description: "Configure level-up announcement channel or toggle messages",
            type: 1, // SUB_COMMAND
            options: [
              {
                name: "channel",
                description: "Select channel for level-up messages (leave empty to use current channel)",
                type: 7, // CHANNEL
                required: false,
              },
              {
                name: "toggle",
                description: "Turn level-up messages ON or OFF",
                type: 3, // STRING
                required: false,
                choices: [
                  { name: "🔔 Enable Level-Up Messages", value: "on" },
                  { name: "🔕 Disable Level-Up Messages", value: "off" },
                  { name: "💬 Reset to Current Channel", value: "current" },
                ],
              },
            ],
          },
          {
            name: "roles",
            description: "View all configured level role rewards",
            type: 1, // SUB_COMMAND
          },
          {
            name: "reset",
            description: "Reset XP levels for the entire server",
            type: 1, // SUB_COMMAND
          },
        ],
      },
    });
  }

  async execute({ ctx }) {
    const db = ctx.client.db;
    const guildId = ctx.guild.id;

    if (ctx.isSlash) {
      const sub = ctx.interaction.options.getSubcommand();

      // ── Add XP ─────────────────────────────────────────────────────────────
      if (sub === "addxp") {
        const user = ctx.interaction.options.getUser("user");
        const amount = ctx.interaction.options.getInteger("amount");

        const result = await db.addXP(guildId, user.id, amount);
        return ctx.reply({
          content: `${emoji.check} Added **${amount.toLocaleString()} XP** to ${user}! New Level: **${result.level}** (\`${result.xp.toLocaleString()} total XP\`)`,
        });
      }

      // ── Add Level Role Reward ──────────────────────────────────────────────
      if (sub === "addrole") {
        const level = ctx.interaction.options.getInteger("level");
        const role  = ctx.interaction.options.getRole("role");

        await db.setLevelRole(guildId, level, role.id);
        return ctx.reply({
          content: `${emoji.check} Set level reward! Reaching **Level ${level}** will now award ${role}.`,
        });
      }

      // ── Set Level-Up Channel / Toggle ──────────────────────────────────────
      if (sub === "setchannel") {
        const channel = ctx.interaction.options.getChannel("channel");
        const toggle  = ctx.interaction.options.getString("toggle");

        if (toggle === "off") {
          await db.setLevelConfig(guildId, { enabled: false });
          return ctx.reply({ content: `${emoji.closed} Level-up announcement messages have been **disabled**.` });
        }

        if (toggle === "current") {
          await db.setLevelConfig(guildId, { channelId: null, enabled: true });
          return ctx.reply({ content: `${emoji.check} Level-up messages will now be sent in the **channel where the member typed**.` });
        }

        if (channel) {
          if (!channel.isTextBased()) {
            return ctx.reply({ content: `${emoji.cross} Please select a valid text channel.`, flags: MessageFlags.Ephemeral });
          }
          await db.setLevelConfig(guildId, { channelId: channel.id, enabled: true });
          return ctx.reply({ content: `${emoji.check} Level-up announcements will now be sent in ${channel}!` });
        }

        const cfg = await db.getLevelConfig(guildId);
        const statusStr = cfg.enabled
          ? cfg.channelId ? `channel <#${cfg.channelId}>` : "current channel where user types"
          : "Disabled";

        return ctx.reply({
          content: `${emoji.info} Current Level-Up Config: **${statusStr}**. Use options to change channel or toggle ON/OFF.`,
        });
      }

      // ── View Level Roles ───────────────────────────────────────────────────
      if (sub === "roles") {
        const roles = await db.getLevelRoles(guildId);
        if (!roles || roles.length === 0) {
          return ctx.reply({ content: `${emoji.info} No level role rewards configured yet.` });
        }

        const lines = roles.map(r => `• **Level ${r.level}** ➔ <@&${r.roleId}>`);
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`🛡️ Level Role Rewards`)
          .setDescription(lines.join("\n"))
          .setTimestamp();

        return ctx.reply({ embeds: [embed] });
      }

      // ── Reset ──────────────────────────────────────────────────────────────
      if (sub === "reset") {
        await db.resetGuildLevels(guildId);
        return ctx.reply({
          content: `${emoji.check} Reset all leveling data for **${ctx.guild.name}**.`,
        });
      }
    } else {
      return ctx.reply({
        content: `Use slash command \`/leveladmin <addxp|addrole|setchannel|roles|reset>\``,
      });
    }
  }
}

export default new LevelAdminCommand();
// bread end
