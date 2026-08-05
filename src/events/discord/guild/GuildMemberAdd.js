/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { EmbedBuilder } from "discord.js";
import { logger } from "#utils/logger";
import { resolvePlaceholders, buildWelcomeEmbed } from "#commands/Welcome/Welcome";

export default {
  name: "guildMemberAdd",
  async execute({ eventArgs, client }) {
    const [member] = eventArgs;
    const { guild }  = member;

    try {
      const cfg = await client.db.getWelcome(guild.id);

      // ── Nothing configured ────────────────────────────────────────────────
      if (!cfg || !cfg.enabled) return;

      // ── Build welcome embed ───────────────────────────────────────────────
      const embed = buildWelcomeEmbed(cfg, member);

      // ── Send to welcome channel ───────────────────────────────────────────
      if (cfg.channelId) {
        const channel = guild.channels.cache.get(cfg.channelId);
        if (channel?.isTextBased()) {
          const content = cfg.pingUser ? `${member}` : undefined;
          const sentMsg = await channel.send({ content, embeds: [embed] });

          // ── Auto React ────────────────────────────────────────────────────
          if (cfg.autoReact) {
            await sentMsg.react("👋").catch(() => {});
          }
        } else {
          logger.warn("Welcome", `Channel ${cfg.channelId} not found or not text-based in ${guild.id}`);
        }
      }

      // ── DM the new member ─────────────────────────────────────────────────
      if (cfg.dmEnabled) {
        const rawMessage = cfg.message ||
          `Welcome {user} to **{server}**! 🎉 You are our **#{membercount}** member.`;
        const resolved = resolvePlaceholders(rawMessage, member);
        const color = cfg.color ? parseInt(cfg.color.replace("#", ""), 16) : 0x5865f2;

        const dmEmbed = new EmbedBuilder()
          .setColor(color)
          .setTitle(`👋 Welcome to ${guild.name}!`)
          .setDescription(resolved)
          .setThumbnail(guild.iconURL({ dynamic: true }) ?? null)
          .setTimestamp();

        if (cfg.bannerUrl) {
          dmEmbed.setImage(cfg.bannerUrl);
        }

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
