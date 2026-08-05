/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import { PermissionFlagsBits, AttachmentBuilder, MessageFlags, EmbedBuilder } from "discord.js";
import { generateBirthdayCard } from "#utils/birthdayCardGenerator";
import { emoji } from "#config/emoji";
import { logger } from "#utils/logger";

class BirthdayAdminCommand extends Command {
  constructor() {
    super({
      name: "birthdayadmin",
      description: "Configure birthday announcement channel, role rewards, or send a test preview (Admin)",
      usage: "birthdayadmin <setup|test|config>",
      examples: [
        "birthdayadmin setup channel:#birthdays role:@Birthday Star",
        "birthdayadmin test user:@user",
      ],
      userPermissions: [PermissionFlagsBits.ManageGuild],
      botPermissions: [PermissionFlagsBits.ManageRoles],
      enabledSlash: true,
      slashData: {
        name: "birthdayadmin",
        description: "Configure birthday announcement channel, role rewards, or send a test preview (Admin)",
        defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
        options: [
          {
            name: "setup",
            description: "Set birthday announcement channel and optional birthday role",
            type: 1, // SUB_COMMAND
            options: [
              {
                name: "channel",
                description: "Dedicated text channel for birthday card announcements",
                type: 7, // CHANNEL
                required: true,
              },
              {
                name: "role",
                description: "Temporary 24-hour role granted on user's birthday (optional)",
                type: 8, // ROLE
                required: false,
              },
            ],
          },
          {
            name: "test",
            description: "Send a test Canvas Birthday Card & role preview for a user",
            type: 1, // SUB_COMMAND
            options: [
              {
                name: "user",
                description: "User to generate test birthday preview for",
                type: 6, // USER
                required: true,
              },
            ],
          },
          {
            name: "config",
            description: "View current birthday system configuration",
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

      // ── Setup ──────────────────────────────────────────────────────────────
      if (sub === "setup") {
        const channel = ctx.interaction.options.getChannel("channel");
        const role    = ctx.interaction.options.getRole("role");

        if (!channel.isTextBased()) {
          return ctx.reply({ content: `${emoji.cross} Please select a valid text channel.`, flags: MessageFlags.Ephemeral });
        }

        const updateData = { channelId: channel.id, enabled: true };
        if (role) updateData.roleId = role.id;

        await db.setBirthdayConfig(guildId, updateData);

        const roleStr = role ? ` and role ${role}` : "";
        return ctx.reply({
          content: `${emoji.check} Birthday announcement channel set to ${channel}${roleStr}! 🎉 Members will get their Canvas Birthday Card posted here automatically!`,
        });
      }

      // ── Test Preview ───────────────────────────────────────────────────────
      if (sub === "test") {
        await ctx.sendTyping().catch(() => {});
        const targetUser = ctx.interaction.options.getUser("user");

        const cfg = await db.getBirthdayConfig(guildId);
        let targetChannel = ctx.channel;

        if (cfg.channelId) {
          const ch = ctx.guild.channels.cache.get(cfg.channelId);
          if (ch && ch.isTextBased()) targetChannel = ch;
        }

        try {
          const avatarURL = targetUser.displayAvatarURL({ extension: "png", size: 256 });
          const imageBuffer = await generateBirthdayCard({
            username: targetUser.username,
            avatarURL,
            serverName: ctx.guild.name,
            age: null,
          });

          const attachment = new AttachmentBuilder(imageBuffer, { name: `birthday-test-${targetUser.id}.png` });

          await targetChannel.send({
            content: `🎉 **TEST BIRTHDAY PREVIEW:** Happy Birthday ${targetUser}! 🎂🥳`,
            files: [attachment],
          });

          // Test assign role if configured
          if (cfg.roleId) {
            const role = ctx.guild.roles.cache.get(cfg.roleId);
            const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
            if (role && member) {
              await member.roles.add(role, "Test Birthday Role").catch(() => {});
            }
          }

          return ctx.reply({
            content: `${emoji.check} Sent test Canvas Birthday Card to ${targetChannel}!`,
            flags: MessageFlags.Ephemeral,
          });
        } catch (err) {
          logger.error("Birthday", "Failed to generate test birthday card", err);
          return ctx.reply({ content: `${emoji.cross} Failed to generate preview: ${err.message}`, flags: MessageFlags.Ephemeral });
        }
      }

      // ── View Config ────────────────────────────────────────────────────────
      if (sub === "config") {
        const cfg = await db.getBirthdayConfig(guildId);
        const chStr = cfg.channelId ? `<#${cfg.channelId}>` : "Not Set";
        const rStr  = cfg.roleId ? `<@&${cfg.roleId}>` : "None";

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`🎂 Birthday System Configuration`)
          .addFields(
            { name: "Announcement Channel", value: chStr, inline: true },
            { name: "Birthday Role Reward", value: rStr,  inline: true },
            { name: "System Enabled",       value: cfg.enabled ? "Yes 🟢" : "No 🔴", inline: true }
          )
          .setFooter({ text: ctx.guild.name })
          .setTimestamp();

        return ctx.reply({ embeds: [embed] });
      }
    } else {
      return ctx.reply({
        content: `Use slash command \`/birthdayadmin <setup|test|config>\``,
      });
    }
  }
}

export default new BirthdayAdminCommand();
// bread end
