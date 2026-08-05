/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { MessageFlags } from "discord.js";
import { logger } from "#utils/logger";
import { emoji } from "#config/emoji";
import { buildPollEmbed, buildPollButtons } from "#commands/Poll/Poll";

export default {
  name: "interactionCreate",
  async execute({ eventArgs, client }) {
    const [interaction] = eventArgs;

    if (!interaction.isButton()) return;
    const { customId } = interaction;

    if (!customId.startsWith("poll_vote_")) return;

    // CustomId format: poll_vote_<pollId>_<optionIndex>
    const parts = customId.split("_");
    const optionIndex = parseInt(parts.pop(), 10);
    const pollId = parts.slice(2).join("_");

    try {
      const poll = await client.db.getPoll(pollId);

      if (!poll) {
        return interaction.reply({
          content: `${emoji.cross} Poll not found.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Record / update vote
      const updatedPoll = await client.db.votePoll(pollId, interaction.user.id, optionIndex);
      if (!updatedPoll) return;

      const authorObj = await client.users.fetch(poll.userId).catch(() => null);
      const embed   = buildPollEmbed(updatedPoll, authorObj);
      const buttons = buildPollButtons(updatedPoll);

      await interaction.update({ embeds: [embed], components: [buttons] });
    } catch (err) {
      logger.error("PollVotes", `Failed to register vote for poll ${pollId}`, err);
      await interaction.reply({
        content: `${emoji.cross} Error recording vote: ${err.message}`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
  },
};

// bread end
