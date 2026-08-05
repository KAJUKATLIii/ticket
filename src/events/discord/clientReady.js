/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { ActivityType, REST, Routes } from "discord.js";
import { logger } from "#utils/logger";
import { config } from "#config/config";
import { initBirthdayChecker } from "#utils/birthdayChecker";

export default {
  name: "clientReady",
  once: true,
  async execute({ client }) {
    logger.success("Bot", `Logged in as ${client.user.tag}`);
    logger.info("Bot", `Serving ${client.guilds.cache.size} guilds`);

    // Set bot presence
    client.user.setActivity(" HELPING AAYUSH IS INSANE AND BANDHILKI SMP", {
      type: ActivityType.Watching,
    });
    logger.info("Bot", "HELPING AAYUSH IS INSANE AND BANDHILKI SMP");

    // Initialize Birthday Checker task
    initBirthdayChecker(client);

    try {
      const slashCommandsData = client.commandHandler.getSlashCommandsData();

      if (!slashCommandsData || slashCommandsData.length === 0) {
        logger.info("Slash", "No slash commands found to register.");
        return;
      }

      logger.info("Slash", `Registering and refreshing all ${slashCommandsData.length} slash commands...`);

      const rest = new REST({ version: "10" }).setToken(config.token);

      // Force register/reload all commands with Discord API
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: slashCommandsData },
      );

      logger.success(
        "Slash",
        `Successfully reloaded and registered all ${slashCommandsData.length} commands globally!`,
      );
    } catch (err) {
      logger.error("Slash", "Failed to reload slash commands", err);
    }
  },
};

// bread reloader
