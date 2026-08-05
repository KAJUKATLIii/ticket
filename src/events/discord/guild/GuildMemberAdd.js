/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { EmbedBuilder } from "discord.js";
import { logger } from "#utils/logger";
import { emoji } from "#config/emoji";
import { resolvePlaceholders } from "#commands/Settings/Welcome";

export default {
  name: "guildMemberAdd",
  async execute({ eventArgs, client }) {
    const [member] = eventArgs;
    const { guild }  = member;

    try {
      const cfg = await client.db.getWelcome(guild.id);

      // ── Nothing configured ────────────────────────────────────────────────
      if (!cfg || !cfg.enabled) return;

      // ── Resolve message text ──────────────────────────────────────────────
      const rawMessage = cfg.message ||
        `Welcome {user} to **{server}**! 🎉 You are our **#{membercount}** member.`;
      const resolved = resolvePlaceholders(rawMessage, member);

      // ── Build embed ───────────────────────────────────────────────────────
      const color  = cfg.color ? parseInt(cfg.color.replace("#", ""), 16) : 0x5865f2;

      const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({
          name:    `${member.user.username} just joined!`,
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(resolved)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: `${emoji.id} User ID`,      value: `\`${member.user.id}\``,             inline: true },
          { name: `${emoji.date} Joined`,      value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
          { name: `${emoji.users} Members`,    value: `\`${guild.memberCount}\``,          inline: true },
        )
        .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) ?? undefined })
        .setTimestamp();

      // ── Send to welcome channel ───────────────────────────────────────────
      if (cfg.channelId) {
        const channel = guild.channels.cache.get(cfg.channelId);
        if (channel?.isTextBased()) {
          await channel.send({ embeds: [embed] });
        } else {
          logger.warn("Welcome", `Channel ${cfg.channelId} not found or not text-based in ${guild.id}`);
        }
      }

      // ── DM the new member ─────────────────────────────────────────────────
      if (cfg.dmEnabled) {
        const dmEmbed = new EmbedBuilder()
          .setColor(color)
          .setTitle(`👋 Welcome to ${guild.name}!`)
          .setDescription(resolved)
          .setThumbnail(guild.iconURL({ dynamic: true }) ?? null)
          .setTimestamp();

        await member.send({ embeds: [dmEmbed] }).catch(() => {
          logger.debug("Welcome", `DM failed for ${member.user.tag} — DMs likely closed`);
        });
      }

      // ── Assign auto-role ──────────────────────────────────────────────────
      if (cfg.roleId) {
        const role = guild.roles.cache.get(cfg.roleId);
        if (role) {
          await member.roles.add(role, "Welcome auto-role").catch((err) => {
            logger.warn("Welcome", `Failed to assign role ${cfg.roleId}: ${err.message}`);
          });
        }
      }

      logger.info("Welcome", `Welcomed ${member.user.tag} in ${guild.name}`);
    } catch (err) {
      logger.error("Welcome", `Failed to process member join for ${member.user.tag}`, err);
    }
  },
};

// bread end
