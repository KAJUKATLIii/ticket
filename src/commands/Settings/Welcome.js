/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import {
  PermissionFlagsBits,
  MessageFlags,
  ChannelType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} from "discord.js";
import { emoji } from "#config/emoji";
import { logger } from "#utils/logger";

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Replace placeholders in a welcome/leave message template. */
export function resolvePlaceholders(template, member) {
  return template
    .replace(/\{user\}/g,          member.toString())
    .replace(/\{username\}/g,      member.user.username)
    .replace(/\{displayname\}/g,   member.displayName ?? member.user.username)
    .replace(/\{tag\}/g,           member.user.tag)
    .replace(/\{server\}/g,        member.guild.name)
    .replace(/\{membercount\}/g,   member.guild.memberCount.toString())
    .replace(/\{id\}/g,            member.user.id);
}

/** Helper to build the welcome embed for actual sends or live test previews. */
export function buildWelcomeEmbed(cfg, member) {
  const rawMessage = cfg.message ||
    `Welcome {user} to **{server}**! 🎉 You are our **#{membercount}** member.`;
  const resolved = resolvePlaceholders(rawMessage, member);
  const color = cfg.color ? parseInt(cfg.color.replace("#", ""), 16) : 0x5865f2;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: `${member.user.username} just joined!`,
      iconURL: member.user.displayAvatarURL({ dynamic: true }),
    })
    .setDescription(resolved)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: `${emoji.id} User ID`,   value: `\`${member.user.id}\``,                            inline: true },
      { name: `${emoji.date} Joined`,  value: `<t:${Math.floor(Date.now() / 1000)}:R>`,            inline: true },
      { name: `${emoji.users} Members`,value: `\`${member.guild.memberCount}\``,                  inline: true },
    )
    .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) ?? undefined })
    .setTimestamp();

  if (cfg.bannerUrl) {
    embed.setImage(cfg.bannerUrl);
  }

  return embed;
}

// ─── Render helpers ───────────────────────────────────────────────────────────

function statusBlock(cfg) {
  const enabled   = cfg.enabled    ? `${emoji.open} **Enabled**`     : `${emoji.closed} **Disabled**`;
  const channel   = cfg.channelId  ? `<#${cfg.channelId}>`        : "*not set*";
  const role      = cfg.roleId     ? `<@&${cfg.roleId}>`          : "*none*";
  const dm        = cfg.dmEnabled  ? `${emoji.check} On`          : `${emoji.cross} Off`;
  const ping      = cfg.pingUser   ? `${emoji.check} On`          : `${emoji.cross} Off`;
  const react     = cfg.autoReact  ? `${emoji.check} On (👋)`     : `${emoji.cross} Off`;
  const color     = cfg.color      ? `\`${cfg.color}\``            : "`#5865F2`";
  const banner    = cfg.bannerUrl  ? `[View Banner](${cfg.bannerUrl})` : "*none*";

  const preview   = cfg.message
    ? cfg.message.length > 70 ? cfg.message.slice(0, 70) + "…" : cfg.message
    : "*no message set*";

  return [
    `## ${emoji.bell} Welcome System Configuration`,
    ``,
    `${emoji.info}  **Status**       ${enabled}`,
    `${emoji.channel}  **Channel**      ${channel}`,
    `${emoji.users}  **Auto-Role**    ${role}`,
    `${emoji.note}  **Message**      ${preview}`,
    `${emoji.mute}  **DM User**      ${dm}`,
    `${emoji.mention}  **Ping User**    ${ping}`,
    `${emoji.heart}  **Auto-React**   ${react}`,
    `${emoji.image}  **Banner Image** ${banner}`,
    `${emoji.settings}  **Embed Color**  ${color}`,
    ``,
    `**Placeholders:** \`{user}\` \`{username}\` \`{displayname}\` \`{server}\` \`{membercount}\` \`{id}\``,
  ].join("\n");
}

function buildPanel(cfg) {
  const toggleLabel = cfg.enabled ? "Disable" : "Enable";
  const toggleStyle = cfg.enabled ? ButtonStyle.Danger : ButtonStyle.Success;

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(statusBlock(cfg)))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("welcome_toggle").setLabel(toggleLabel).setStyle(toggleStyle).setEmoji(cfg.enabled ? "🔕" : "🔔"),
        new ButtonBuilder().setCustomId("welcome_set_channel").setLabel("Set Channel").setStyle(ButtonStyle.Primary).setEmoji("📢"),
        new ButtonBuilder().setCustomId("welcome_set_message").setLabel("Set Message").setStyle(ButtonStyle.Primary).setEmoji("📝"),
        new ButtonBuilder().setCustomId("welcome_test").setLabel("Test Preview").setStyle(ButtonStyle.Success).setEmoji("🧪"),
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("welcome_set_role").setLabel("Auto-Role").setStyle(ButtonStyle.Secondary).setEmoji("🛡️"),
        new ButtonBuilder().setCustomId("welcome_toggle_dm").setLabel(`DM: ${cfg.dmEnabled ? "ON" : "OFF"}`).setStyle(ButtonStyle.Secondary).setEmoji("📨"),
        new ButtonBuilder().setCustomId("welcome_toggle_ping").setLabel(`Ping: ${cfg.pingUser ? "ON" : "OFF"}`).setStyle(ButtonStyle.Secondary).setEmoji("🔔"),
        new ButtonBuilder().setCustomId("welcome_toggle_react").setLabel(`React: ${cfg.autoReact ? "ON" : "OFF"}`).setStyle(ButtonStyle.Secondary).setEmoji("👋"),
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("welcome_set_banner").setLabel("Banner Image").setStyle(ButtonStyle.Secondary).setEmoji("🖼️"),
        new ButtonBuilder().setCustomId("welcome_set_color").setLabel("Embed Color").setStyle(ButtonStyle.Secondary).setEmoji("🎨"),
        new ButtonBuilder().setCustomId("welcome_reset").setLabel("Reset").setStyle(ButtonStyle.Danger).setEmoji("♻️"),
      )
    );

  return container;
}

// ─── Command ──────────────────────────────────────────────────────────────────

class WelcomeCommand extends Command {
  constructor() {
    super({
      name: "welcome",
      description: "Configure the welcome system for this server",
      usage: "welcome",
      examples: ["welcome"],
      userPermissions: [PermissionFlagsBits.ManageGuild],
      botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageRoles],
      enabledSlash: true,
      slashData: {
        name: "welcome",
        description: "Configure the welcome system for this server",
        defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
      },
    });
  }

  async execute({ ctx }) {
    const db  = ctx.client.db;
    const cfg = await db.getWelcome(ctx.guild.id);

    const panel = buildPanel(cfg);
    const msg   = await ctx.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
    });

    this._collect(ctx, msg, db);
  }

  // ─── Collector ──────────────────────────────────────────────────────────────

  _collect(ctx, msg, db) {
    const filter = (i) => i.user.id === ctx.author.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 300_000 });

    collector.on("collect", async (i) => {
      try {
        const cfg = await db.getWelcome(ctx.guild.id);

        // ── Toggle enabled ────────────────────────────────────────────────────
        if (i.customId === "welcome_toggle") {
          await db.setWelcome(ctx.guild.id, { enabled: !cfg.enabled });
          await i.update({ components: [buildPanel(await db.getWelcome(ctx.guild.id))], flags: MessageFlags.IsComponentsV2 });
          return;
        }

        // ── Toggle DM ─────────────────────────────────────────────────────────
        if (i.customId === "welcome_toggle_dm") {
          await db.setWelcome(ctx.guild.id, { dmEnabled: !cfg.dmEnabled });
          await i.update({ components: [buildPanel(await db.getWelcome(ctx.guild.id))], flags: MessageFlags.IsComponentsV2 });
          return;
        }

        // ── Toggle Ping ───────────────────────────────────────────────────────
        if (i.customId === "welcome_toggle_ping") {
          await db.setWelcome(ctx.guild.id, { pingUser: !cfg.pingUser });
          await i.update({ components: [buildPanel(await db.getWelcome(ctx.guild.id))], flags: MessageFlags.IsComponentsV2 });
          return;
        }

        // ── Toggle Auto-React ──────────────────────────────────────────────────
        if (i.customId === "welcome_toggle_react") {
          await db.setWelcome(ctx.guild.id, { autoReact: !cfg.autoReact });
          await i.update({ components: [buildPanel(await db.getWelcome(ctx.guild.id))], flags: MessageFlags.IsComponentsV2 });
          return;
        }

        // ── Test Preview ──────────────────────────────────────────────────────
        if (i.customId === "welcome_test") {
          const testEmbed = buildWelcomeEmbed(cfg, ctx.member);
          const content = cfg.pingUser ? `${ctx.member}` : undefined;
          await i.reply({
            content: `🧪 **Welcome Message Live Test Preview:**\n${content ?? ""}`,
            embeds: [testEmbed],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        // ── Reset ─────────────────────────────────────────────────────────────
        if (i.customId === "welcome_reset") {
          await db.clearWelcome(ctx.guild.id);
          await i.update({ components: [buildPanel({})], flags: MessageFlags.IsComponentsV2 });
          return;
        }

        // ── Set channel via modal ─────────────────────────────────────────────
        if (i.customId === "welcome_set_channel") {
          const modal = new ModalBuilder()
            .setCustomId("welcome_modal_channel")
            .setTitle("Set Welcome Channel")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("channel_id")
                  .setLabel("Channel ID or #channel-mention")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("Paste the channel ID e.g. 123456789012345678")
                  .setRequired(true)
              )
            );
          await i.showModal(modal);

          try {
            const submit = await i.awaitModalSubmit({ filter: (m) => m.user.id === ctx.author.id, time: 60_000 });
            const raw = submit.fields.getTextInputValue("channel_id").trim().replace(/\D/g, "");
            const ch  = ctx.guild.channels.cache.get(raw);
            if (!ch || !ch.isTextBased()) {
              await submit.reply({ content: `${emoji.cross} Invalid text channel ID.`, flags: MessageFlags.Ephemeral });
            } else {
              await db.setWelcome(ctx.guild.id, { channelId: ch.id });
              await submit.update({ components: [buildPanel(await db.getWelcome(ctx.guild.id))], flags: MessageFlags.IsComponentsV2 });
            }
          } catch { /* timed out */ }
          return;
        }

        // ── Set message via modal ─────────────────────────────────────────────
        if (i.customId === "welcome_set_message") {
          const modal = new ModalBuilder()
            .setCustomId("welcome_modal_message")
            .setTitle("Set Welcome Message")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("message")
                  .setLabel("Welcome message (supports placeholders)")
                  .setStyle(TextInputStyle.Paragraph)
                  .setPlaceholder("Welcome {user} to {server}! You are member #{membercount}.")
                  .setValue(cfg.message || "")
                  .setMaxLength(1000)
                  .setRequired(true)
              )
            );
          await i.showModal(modal);

          try {
            const submit = await i.awaitModalSubmit({ filter: (m) => m.user.id === ctx.author.id, time: 120_000 });
            const message = submit.fields.getTextInputValue("message").trim();
            await db.setWelcome(ctx.guild.id, { message });
            await submit.update({ components: [buildPanel(await db.getWelcome(ctx.guild.id))], flags: MessageFlags.IsComponentsV2 });
          } catch { /* timed out */ }
          return;
        }

        // ── Set auto-role via modal ───────────────────────────────────────────
        if (i.customId === "welcome_set_role") {
          const modal = new ModalBuilder()
            .setCustomId("welcome_modal_role")
            .setTitle("Set Auto-Role")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("role_id")
                  .setLabel("Role ID (leave blank to disable)")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("Paste the role ID e.g. 123456789012345678")
                  .setValue(cfg.roleId || "")
                  .setRequired(false)
              )
            );
          await i.showModal(modal);

          try {
            const submit = await i.awaitModalSubmit({ filter: (m) => m.user.id === ctx.author.id, time: 60_000 });
            const raw  = submit.fields.getTextInputValue("role_id").trim().replace(/\D/g, "");
            if (!raw) {
              await db.setWelcome(ctx.guild.id, { roleId: null });
              await submit.update({ components: [buildPanel(await db.getWelcome(ctx.guild.id))], flags: MessageFlags.IsComponentsV2 });
              return;
            }
            const role = ctx.guild.roles.cache.get(raw);
            if (!role) {
              await submit.reply({ content: `${emoji.cross} Role not found.`, flags: MessageFlags.Ephemeral });
            } else {
              await db.setWelcome(ctx.guild.id, { roleId: role.id });
              await submit.update({ components: [buildPanel(await db.getWelcome(ctx.guild.id))], flags: MessageFlags.IsComponentsV2 });
            }
          } catch { /* timed out */ }
          return;
        }

        // ── Set Banner image URL via modal ────────────────────────────────────
        if (i.customId === "welcome_set_banner") {
          const modal = new ModalBuilder()
            .setCustomId("welcome_modal_banner")
            .setTitle("Set Welcome Banner Image")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("banner_url")
                  .setLabel("Image / GIF URL (leave blank to disable)")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("https://i.imgur.com/example.png")
                  .setValue(cfg.bannerUrl || "")
                  .setRequired(false)
              )
            );
          await i.showModal(modal);

          try {
            const submit = await i.awaitModalSubmit({ filter: (m) => m.user.id === ctx.author.id, time: 60_000 });
            const url  = submit.fields.getTextInputValue("banner_url").trim();
            if (url && !/^https?:\/\/.+/i.test(url)) {
              await submit.reply({ content: `${emoji.cross} Invalid URL format. Must start with http:// or https://`, flags: MessageFlags.Ephemeral });
            } else {
              await db.setWelcome(ctx.guild.id, { bannerUrl: url || null });
              await submit.update({ components: [buildPanel(await db.getWelcome(ctx.guild.id))], flags: MessageFlags.IsComponentsV2 });
            }
          } catch { /* timed out */ }
          return;
        }

        // ── Set embed color via modal ─────────────────────────────────────────
        if (i.customId === "welcome_set_color") {
          const modal = new ModalBuilder()
            .setCustomId("welcome_modal_color")
            .setTitle("Set Embed Color")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("color")
                  .setLabel("Hex color code")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("#5865F2")
                  .setValue(cfg.color || "#5865F2")
                  .setMinLength(4)
                  .setMaxLength(7)
                  .setRequired(true)
              )
            );
          await i.showModal(modal);

          try {
            const submit = await i.awaitModalSubmit({ filter: (m) => m.user.id === ctx.author.id, time: 60_000 });
            const color  = submit.fields.getTextInputValue("color").trim();
            if (!/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(color)) {
              await submit.reply({ content: `${emoji.cross} Invalid hex color. Use format \`#RRGGBB\`.`, flags: MessageFlags.Ephemeral });
            } else {
              await db.setWelcome(ctx.guild.id, { color });
              await submit.update({ components: [buildPanel(await db.getWelcome(ctx.guild.id))], flags: MessageFlags.IsComponentsV2 });
            }
          } catch { /* timed out */ }
          return;
        }

      } catch (err) {
        logger.error("Welcome", "Collector error", err);
      }
    });

    collector.on("end", async () => {
      try {
        const cfg = await db.getWelcome(ctx.guild.id);
        const expired = buildPanel(cfg);
        expired.components.forEach(row => {
          if (row.components) row.components.forEach(c => c.setDisabled?.(true));
        });
        await msg.edit({ components: [expired], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } catch { /* ignore */ }
    });
  }
}

export default new WelcomeCommand();
// bread end
