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

// ─── Embed Builder Helper ──────────────────────────────────────────────────────

function buildEmbedFromDraft(draft, member) {
  const embed = new EmbedBuilder();

  if (draft.title)       embed.setTitle(draft.title);
  if (draft.description) embed.setDescription(draft.description);
  if (draft.url)         embed.setURL(draft.url);

  const color = draft.color ? parseInt(draft.color.replace("#", ""), 16) : 0x5865f2;
  embed.setColor(color);

  if (draft.authorName) {
    embed.setAuthor({
      name: draft.authorName,
      iconURL: draft.authorIcon || undefined,
    });
  }

  if (draft.thumbnail) embed.setThumbnail(draft.thumbnail);
  if (draft.image)     embed.setImage(draft.image);

  if (draft.footerText) {
    embed.setFooter({
      text: draft.footerText,
      iconURL: draft.footerIcon || undefined,
    });
  }

  if (draft.timestamp) embed.setTimestamp();

  if (draft.fields && draft.fields.length > 0) {
    for (const f of draft.fields) {
      embed.addFields({ name: f.name, value: f.value, inline: !!f.inline });
    }
  }

  // Fallback description if completely empty
  if (!draft.title && !draft.description && (!draft.fields || draft.fields.length === 0)) {
    embed.setDescription("*Empty embed preview — use the buttons below to customize!*");
  }

  return embed;
}

function statusBlock(draft, targetChannel) {
  const title       = draft.title       ? `\`${draft.title}\``       : "*none*";
  const desc        = draft.description ? `\`${draft.description.slice(0, 40)}${draft.description.length > 40 ? "…" : ""}\`` : "*none*";
  const color       = draft.color       ? `\`${draft.color}\``       : "`#5865F2`";
  const author      = draft.authorName  ? `\`${draft.authorName}\``  : "*none*";
  const fieldsCount = draft.fields      ? draft.fields.length        : 0;
  const channel     = targetChannel     ? `<#${targetChannel.id}>`   : "*current channel*";
  const timestamp   = draft.timestamp   ? `${emoji.check} On`        : `${emoji.cross} Off`;

  return [
    `## 🎨 Interactive Embed Builder`,
    ``,
    `Customize your embed using the controls below, preview it live, and dispatch it to any channel!`,
    ``,
    `${emoji.note} **Title:** ${title}`,
    `${emoji.info} **Description:** ${desc}`,
    `${emoji.settings} **Color:** ${color}`,
    `${emoji.user} **Author:** ${author}`,
    `${emoji.tag} **Fields:** \`${fieldsCount}/25\``,
    `${emoji.time} **Timestamp:** ${timestamp}`,
    `${emoji.channel} **Target Channel:** ${channel}`,
  ].join("\n");
}

function buildControlPanel(draft, targetChannel) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(statusBlock(draft, targetChannel)))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("eb_edit_main").setLabel("Title & Description").setStyle(ButtonStyle.Primary).setEmoji("📝"),
        new ButtonBuilder().setCustomId("eb_set_color").setLabel("Color").setStyle(ButtonStyle.Secondary).setEmoji("🎨"),
        new ButtonBuilder().setCustomId("eb_set_author").setLabel("Author").setStyle(ButtonStyle.Secondary).setEmoji("👤"),
        new ButtonBuilder().setCustomId("eb_set_images").setLabel("Images").setStyle(ButtonStyle.Secondary).setEmoji("🖼️"),
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("eb_add_field").setLabel("Add Field").setStyle(ButtonStyle.Secondary).setEmoji("➕"),
        new ButtonBuilder().setCustomId("eb_set_footer").setLabel("Footer").setStyle(ButtonStyle.Secondary).setEmoji("🦶"),
        new ButtonBuilder().setCustomId("eb_toggle_ts").setLabel(`Timestamp: ${draft.timestamp ? "ON" : "OFF"}`).setStyle(ButtonStyle.Secondary).setEmoji("⏱️"),
        new ButtonBuilder().setCustomId("eb_preview").setLabel("Live Preview").setStyle(ButtonStyle.Success).setEmoji("🧪"),
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("eb_send").setLabel("Send Embed").setStyle(ButtonStyle.Success).setEmoji("🚀"),
        new ButtonBuilder().setCustomId("eb_reset").setLabel("Reset").setStyle(ButtonStyle.Danger).setEmoji("♻️"),
      )
    );

  return container;
}

// ─── Command Implementation ───────────────────────────────────────────────────

class EmbedCommand extends Command {
  constructor() {
    super({
      name: "embed",
      description: "Create and send a custom rich embed message",
      usage: "embed [#channel]",
      examples: ["embed", "embed #announcements"],
      userPermissions: [PermissionFlagsBits.ManageMessages],
      botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
      enabledSlash: true,
      slashData: {
        name: "embed",
        description: "Create and send a custom rich embed message",
        defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
        options: [
          {
            name: "channel",
            description: "Channel to send the finished embed to (optional)",
            type: 7, // CHANNEL
            required: false,
          },
        ],
      },
    });
  }

  async execute({ ctx }) {
    let targetChannel = ctx.channel;

    if (ctx.isSlash) {
      const chOption = ctx.interaction.options.getChannel("channel");
      if (chOption && chOption.isTextBased()) {
        targetChannel = chOption;
      }
    }

    const draft = {
      title: "",
      description: "",
      color: "#5865F2",
      authorName: "",
      authorIcon: "",
      thumbnail: "",
      image: "",
      footerText: "",
      footerIcon: "",
      timestamp: false,
      fields: [],
    };

    const panel = buildControlPanel(draft, targetChannel);
    const msg = await ctx.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
    });

    this._collect(ctx, msg, draft, targetChannel);
  }

  _collect(ctx, msg, draft, targetChannel) {
    const filter = (i) => i.user.id === ctx.author.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 600_000 });

    collector.on("collect", async (i) => {
      try {
        // ── Main Title & Description Modal ───────────────────────────────────
        if (i.customId === "eb_edit_main") {
          const modal = new ModalBuilder()
            .setCustomId("eb_modal_main")
            .setTitle("Title & Description")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("title")
                  .setLabel("Embed Title")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("Announcement title...")
                  .setValue(draft.title || "")
                  .setMaxLength(256)
                  .setRequired(false)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("description")
                  .setLabel("Embed Description (supports Markdown)")
                  .setStyle(TextInputStyle.Paragraph)
                  .setPlaceholder("Enter your message content here...")
                  .setValue(draft.description || "")
                  .setMaxLength(4000)
                  .setRequired(false)
              )
            );
          await i.showModal(modal);

          try {
            const submit = await i.awaitModalSubmit({ filter: (m) => m.user.id === ctx.author.id, time: 180_000 });
            draft.title = submit.fields.getTextInputValue("title").trim();
            draft.description = submit.fields.getTextInputValue("description").trim();
            await submit.update({ components: [buildControlPanel(draft, targetChannel)], flags: MessageFlags.IsComponentsV2 });
          } catch { /* timeout */ }
          return;
        }

        // ── Color Modal ──────────────────────────────────────────────────────
        if (i.customId === "eb_set_color") {
          const modal = new ModalBuilder()
            .setCustomId("eb_modal_color")
            .setTitle("Set Embed Color")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("color")
                  .setLabel("Hex Color Code")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("#5865F2")
                  .setValue(draft.color || "#5865F2")
                  .setMinLength(4)
                  .setMaxLength(7)
                  .setRequired(true)
              )
            );
          await i.showModal(modal);

          try {
            const submit = await i.awaitModalSubmit({ filter: (m) => m.user.id === ctx.author.id, time: 60_000 });
            const color = submit.fields.getTextInputValue("color").trim();
            if (!/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(color)) {
              await submit.reply({ content: `${emoji.cross} Invalid hex color code e.g. \`#5865F2\`.`, flags: MessageFlags.Ephemeral });
            } else {
              draft.color = color;
              await submit.update({ components: [buildControlPanel(draft, targetChannel)], flags: MessageFlags.IsComponentsV2 });
            }
          } catch { /* timeout */ }
          return;
        }

        // ── Author Modal ─────────────────────────────────────────────────────
        if (i.customId === "eb_set_author") {
          const modal = new ModalBuilder()
            .setCustomId("eb_modal_author")
            .setTitle("Set Author Header")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("author_name")
                  .setLabel("Author Name")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("Server Staff / KAJUKATLI")
                  .setValue(draft.authorName || "")
                  .setRequired(false)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("author_icon")
                  .setLabel("Author Icon URL (optional)")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("https://i.imgur.com/icon.png")
                  .setValue(draft.authorIcon || "")
                  .setRequired(false)
              )
            );
          await i.showModal(modal);

          try {
            const submit = await i.awaitModalSubmit({ filter: (m) => m.user.id === ctx.author.id, time: 120_000 });
            draft.authorName = submit.fields.getTextInputValue("author_name").trim();
            draft.authorIcon = submit.fields.getTextInputValue("author_icon").trim();
            await submit.update({ components: [buildControlPanel(draft, targetChannel)], flags: MessageFlags.IsComponentsV2 });
          } catch { /* timeout */ }
          return;
        }

        // ── Images Modal ─────────────────────────────────────────────────────
        if (i.customId === "eb_set_images") {
          const modal = new ModalBuilder()
            .setCustomId("eb_modal_images")
            .setTitle("Set Thumbnail & Image")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("thumbnail")
                  .setLabel("Thumbnail URL (top-right small image)")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("https://i.imgur.com/thumb.png")
                  .setValue(draft.thumbnail || "")
                  .setRequired(false)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("image")
                  .setLabel("Main Banner Image URL")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("https://i.imgur.com/banner.png")
                  .setValue(draft.image || "")
                  .setRequired(false)
              )
            );
          await i.showModal(modal);

          try {
            const submit = await i.awaitModalSubmit({ filter: (m) => m.user.id === ctx.author.id, time: 120_000 });
            draft.thumbnail = submit.fields.getTextInputValue("thumbnail").trim();
            draft.image     = submit.fields.getTextInputValue("image").trim();
            await submit.update({ components: [buildControlPanel(draft, targetChannel)], flags: MessageFlags.IsComponentsV2 });
          } catch { /* timeout */ }
          return;
        }

        // ── Add Field Modal ───────────────────────────────────────────────────
        if (i.customId === "eb_add_field") {
          if (draft.fields.length >= 25) {
            await i.reply({ content: `${emoji.cross} Maximum 25 fields allowed per embed.`, flags: MessageFlags.Ephemeral });
            return;
          }

          const modal = new ModalBuilder()
            .setCustomId("eb_modal_field")
            .setTitle(`Add Field (${draft.fields.length + 1}/25)`)
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("name")
                  .setLabel("Field Title / Name")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("Rule #1")
                  .setMaxLength(256)
                  .setRequired(true)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("value")
                  .setLabel("Field Content / Value")
                  .setStyle(TextInputStyle.Paragraph)
                  .setPlaceholder("Be respectful to everyone.")
                  .setMaxLength(1024)
                  .setRequired(true)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("inline")
                  .setLabel("Inline? (Type 'yes' or 'no')")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("no")
                  .setValue("no")
                  .setMaxLength(3)
                  .setRequired(false)
              )
            );
          await i.showModal(modal);

          try {
            const submit = await i.awaitModalSubmit({ filter: (m) => m.user.id === ctx.author.id, time: 120_000 });
            const name   = submit.fields.getTextInputValue("name").trim();
            const value  = submit.fields.getTextInputValue("value").trim();
            const inlineStr = submit.fields.getTextInputValue("inline").trim().toLowerCase();
            const inline = inlineStr === "yes" || inlineStr === "true" || inlineStr === "y";

            draft.fields.push({ name, value, inline });
            await submit.update({ components: [buildControlPanel(draft, targetChannel)], flags: MessageFlags.IsComponentsV2 });
          } catch { /* timeout */ }
          return;
        }

        // ── Footer Modal ─────────────────────────────────────────────────────
        if (i.customId === "eb_set_footer") {
          const modal = new ModalBuilder()
            .setCustomId("eb_modal_footer")
            .setTitle("Set Footer")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("footer_text")
                  .setLabel("Footer Text")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("Insane Community • 2026")
                  .setValue(draft.footerText || "")
                  .setRequired(false)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("footer_icon")
                  .setLabel("Footer Icon URL (optional)")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("https://i.imgur.com/footer.png")
                  .setValue(draft.footerIcon || "")
                  .setRequired(false)
              )
            );
          await i.showModal(modal);

          try {
            const submit = await i.awaitModalSubmit({ filter: (m) => m.user.id === ctx.author.id, time: 120_000 });
            draft.footerText = submit.fields.getTextInputValue("footer_text").trim();
            draft.footerIcon = submit.fields.getTextInputValue("footer_icon").trim();
            await submit.update({ components: [buildControlPanel(draft, targetChannel)], flags: MessageFlags.IsComponentsV2 });
          } catch { /* timeout */ }
          return;
        }

        // ── Toggle Timestamp ─────────────────────────────────────────────────
        if (i.customId === "eb_toggle_ts") {
          draft.timestamp = !draft.timestamp;
          await i.update({ components: [buildControlPanel(draft, targetChannel)], flags: MessageFlags.IsComponentsV2 });
          return;
        }

        // ── Live Preview ─────────────────────────────────────────────────────
        if (i.customId === "eb_preview") {
          const previewEmbed = buildEmbedFromDraft(draft, ctx.member);
          await i.reply({
            content: "🧪 **Live Embed Preview:**",
            embeds: [previewEmbed],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        // ── Reset Draft ──────────────────────────────────────────────────────
        if (i.customId === "eb_reset") {
          draft.title = "";
          draft.description = "";
          draft.color = "#5865F2";
          draft.authorName = "";
          draft.authorIcon = "";
          draft.thumbnail = "";
          draft.image = "";
          draft.footerText = "";
          draft.footerIcon = "";
          draft.timestamp = false;
          draft.fields = [];
          await i.update({ components: [buildControlPanel(draft, targetChannel)], flags: MessageFlags.IsComponentsV2 });
          return;
        }

        // ── Send Embed to Target Channel ─────────────────────────────────────
        if (i.customId === "eb_send") {
          const finalEmbed = buildEmbedFromDraft(draft, ctx.member);

          try {
            await targetChannel.send({ embeds: [finalEmbed] });
            await i.reply({
              content: `${emoji.check} Successfully sent embed to ${targetChannel}!`,
              flags: MessageFlags.Ephemeral,
            });
            collector.stop("sent");
          } catch (err) {
            logger.error("EmbedBuilder", "Failed to send embed", err);
            await i.reply({
              content: `${emoji.cross} Failed to send embed: ${err.message}`,
              flags: MessageFlags.Ephemeral,
            });
          }
          return;
        }

      } catch (err) {
        logger.error("EmbedBuilder", "Collector error", err);
      }
    });

    collector.on("end", async (collected, reason) => {
      try {
        const expiredPanel = buildControlPanel(draft, targetChannel);
        expiredPanel.components.forEach((row) => {
          if (row.components) row.components.forEach((c) => c.setDisabled?.(true));
        });
        await msg.edit({ components: [expiredPanel], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } catch { /* ignore */ }
    });
  }
}

export default new EmbedCommand();
// bread end
