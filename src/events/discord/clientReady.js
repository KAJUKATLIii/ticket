/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { ActivityType, REST, Routes } from "discord.js";
import { logger } from "#utils/logger";
import { config } from "#config/config";

export default {
  name: "clientReady",
  once: true,
  async execute({ client }) {
    logger.success("Bot", `Logged in as ${client.user.tag}`);
    logger.info("Bot", `Serving ${client.guilds.cache.size} guilds`);

    // Set bot presence to: Watching tickets for insane community
    client.user.setActivity("tickets for insane community", {
      type: ActivityType.Watching,
    });
    logger.info("Bot", "Activity set: Watching tickets for insane community");

    try {
      const slashCommandsData =
        client.commandHandler.getSlashCommandsData();

      if (!slashCommandsData || slashCommandsData.length === 0) {
        logger.info("Slash", "No slash commands to register");
        return;
      }

      const rest = new REST({ version: "10" }).setToken(config.token);

      const currentCommands = await rest.get(
        Routes.applicationCommands(client.user.id),
      );

      const currentMap = new Map(
        currentCommands.map((c) => [c.name, c]),
      );

      const normalize = (cmd) => {
        const { id, application_id, version, guild_id, ...rest } = cmd;
        return rest;
      };

      const toUpdate = slashCommandsData.filter((cmd) => {
        const existing = currentMap.get(cmd.name);
        if (!existing) return true;
        return (
          JSON.stringify(normalize(existing)) !==
          JSON.stringify(normalize(cmd))
        );
      });

      if (toUpdate.length === 0) {
        logger.success("Slash", "Commands already in sync");
        return;
      }

      const merged = [];
      const updateMap = new Map(toUpdate.map((c) => [c.name, c]));

      for (const cmd of currentCommands) {
        if (updateMap.has(cmd.name)) {
          merged.push(updateMap.get(cmd.name));
          updateMap.delete(cmd.name);
        } else {
          merged.push(cmd);
        }
      }

      merged.push(...updateMap.values());

      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: merged },
      );

      logger.success(
        "Slash",
        `Updated ${toUpdate.length} commands`,
      );
    } catch (err) {
      logger.error("Slash", "Auto register failed", err);
    }
  },
};
