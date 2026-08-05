/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import {
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { emoji } from "#config/emoji";
import { logger } from "#utils/logger";

// ─── Render Helpers ────────────────────────────────────────────────────────────

export function buildPollEmbed(poll, authorObj) {
  const totalVotes = Object.keys(poll.votes).length;
  const counts = {};
  poll.options.forEach((_, idx) => (counts[idx] = 0));

  Object.values(poll.votes).forEach((idx) => {
    if (counts[idx] !== undefined) counts[idx]++;
  });

  const optionLines = poll.options.map((opt, idx) => {
    const count = counts[idx];
    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    const progressBlocks = Math.round((pct / 100) * 8);
    const bar = "█".repeat(progressBlocks) + "░".repeat(8 - progressBlocks);
    const letter = String.fromCharCode(65 + idx); // A, B, C, D, E

    return `**${letter}. ${opt}**\n[\`${bar}\`] **${pct}%** (\`${count} votes\`)`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({
      name: authorObj ? `${authorObj.username}'s Poll` : "Server Poll",
      iconURL: authorObj ? authorObj.displayAvatarURL({ dynamic: true }) : undefined,
    })
    .setTitle(`📊 ${poll.question}`)
    .setDescription(optionLines.join("\n\n"))
    .addFields({
      name: `${emoji.users} Total Votes`,
      value: `\`${totalVotes.toLocaleString()}\``,
      inline: true,
    })
    .setFooter({ text: `Poll ID: ${poll.pollId} • Click a button below to vote!` })
    .setTimestamp(new Date(poll.createdAt));

  return embed;
}

export function buildPollButtons(poll) {
  const row = new ActionRowBuilder();

  poll.options.forEach((opt, idx) => {
    const letter = String.fromCharCode(65 + idx);
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`poll_vote_${poll.pollId}_${idx}`)
        .setLabel(`Option ${letter}`)
        .setStyle(ButtonStyle.Primary)
    );
  });

  return row;
}

// ─── Command Class ─────────────────────────────────────────────────────────────

class PollCommand extends Command {
  constructor() {
    super({
      name: "poll",
      description: "Create an interactive community poll (up to 5 options)",
      usage: "poll <question> | <opt1> | <opt2> ...",
      examples: [
        "poll Should we add new channels? | Yes | No",
        "poll Favorite Game? | Minecraft | Valorant | GTA V",
      ],
      userPermissions: [PermissionFlagsBits.ManageMessages],
      botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
      enabledSlash: true,
      slashData: {
        name: "poll",
        description: "Create an interactive community poll (up to 5 options)",
        defaultMemberPermissions: PermissionFlagsBits.ManageMessages,
        options: [
          { name: "question", description: "The poll question", type: 3, required: true },
          { name: "option1", description: "Option A", type: 3, required: true },
          { name: "option2", description: "Option B", type: 3, required: true },
          { name: "option3", description: "Option C (optional)", type: 3, required: false },
          { name: "option4", description: "Option D (optional)", type: 3, required: false },
          { name: "option5", description: "Option E (optional)", type: 3, required: false },
        ],
      },
    });
  }

  async execute({ ctx }) {
    const db = ctx.client.db;
    const guildId = ctx.guild.id;

    let question = "";
    let options = [];

    if (ctx.isSlash) {
      question = ctx.interaction.options.getString("question").trim();
      const o1 = ctx.interaction.options.getString("option1")?.trim();
      const o2 = ctx.interaction.options.getString("option2")?.trim();
      const o3 = ctx.interaction.options.getString("option3")?.trim();
      const o4 = ctx.interaction.options.getString("option4")?.trim();
      const o5 = ctx.interaction.options.getString("option5")?.trim();

      if (o1) options.push(o1);
      if (o2) options.push(o2);
      if (o3) options.push(o3);
      if (o4) options.push(o4);
      if (o5) options.push(o5);
    } else {
      const fullText = ctx.args.join(" ");
      const parts = fullText.split("|").map((p) => p.trim()).filter(Boolean);

      if (parts.length < 3) {
        return ctx.reply({
          content: `${emoji.cross} Format: \`.poll Question | Option A | Option B [| Option C]\``,
        });
      }

      question = parts[0];
      options = parts.slice(1, 6); // Max 5 options
    }

    if (options.length < 2) {
      return ctx.reply({
        content: `${emoji.cross} A poll requires at least 2 options.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      // Create poll record in DB
      const poll = await db.createPoll(guildId, ctx.author.id, ctx.channel.id, question, options);

      const embed   = buildPollEmbed(poll, ctx.author);
      const buttons = buildPollButtons(poll);

      const sentMsg = await ctx.channel.send({ embeds: [embed], components: [buttons] });
      await db.setPollMessageId(poll.pollId, sentMsg.id);

      if (ctx.isSlash) {
        return ctx.reply({ content: `${emoji.check} Poll created!`, flags: MessageFlags.Ephemeral });
      }
    } catch (err) {
      logger.error("Poll", "Failed to create poll", err);
      return ctx.reply({
        content: `${emoji.cross} Failed to create poll: ${err.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

export default new PollCommand();
// bread end
