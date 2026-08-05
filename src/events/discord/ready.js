/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { ActivityType } from "discord.js";
import { logger } from "#utils/logger";

export default {
  name: "ready",
  once: true,
  async execute({ client }) {
    logger.success("Bot", `Logged in as ${client.user.tag}`);

    // Set status to: Watching tickets for insane community
    client.user.setActivity("tickets for insane community", {
      type: ActivityType.Watching,
    });

    logger.info("Bot", "Activity set: Watching tickets for insane community");
  },
};
