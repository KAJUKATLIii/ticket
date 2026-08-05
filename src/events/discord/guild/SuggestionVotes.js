/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { MessageFlags } from "discord.js";
import { logger } from "#utils/logger";
import { emoji } from "#config/emoji";
import { buildSuggestionEmbed, buildSuggestionButtons } from "#commands/Suggestions/Suggest";

export default {
  name: "interactionCreate",
  async execute({ eventArgs, client }) {
    const [interaction] = eventArgs;

    if (!interaction.isButton()) return;
    const { customId } = interaction;

    if (!customId.startsWith("sug_vote_")) return;

    const voteType = customId.startsWith("sug_vote_up_") ? "up" : "down";
    const suggestionId = customId.replace("sug_vote_up_", "").replace("sug_vote_down_", "");

    try {
      const sug = await client.db.getSuggestion(suggestionId);

      if (!sug) {
        return interaction.reply({
          content: `${emoji.cross} Suggestion not found.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Record vote
      const updatedSug = await client.db.voteSuggestion(suggestionId, interaction.user.id, voteType);
      if (!updatedSug) return;

      // Update embed and buttons in message
      const authorObj = await client.users.fetch(sug.userId).catch(() => null);
      const embed   = buildSuggestionEmbed(updatedSug, authorObj);
      const buttons = buildSuggestionButtons(updatedSug);

      await interaction.update({ embeds: [embed], components: [buttons] });
    } catch (err) {
      logger.error("SuggestionVotes", `Vote error for ${suggestionId}`, err);
      await interaction.reply({
        content: `${emoji.cross} Failed to process vote: ${err.message}`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
  },
};

// bread end
