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
      description: "Manage leveling, XP, and level role rewards (Admin)",
      usage: "leveladmin <addxp|addrole|removerole|reset>",
      examples: [
        "leveladmin addxp @user 500",
        "leveladmin addrole 5 @role",
      ],
      userPermissions: [PermissionFlagsBits.ManageGuild],
      botPermissions: [PermissionFlagsBits.ManageRoles],
      enabledSlash: true,
      slashData: {
        name: "leveladmin",
        description: "Manage leveling, XP, and level role rewards (Admin)",
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
        content: `Use slash command \`/leveladmin <addxp|addrole|roles|reset>\``,
      });
    }
  }
}

export default new LevelAdminCommand();
// bread end
