/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { EmbedBuilder } from "discord.js";
import { logger } from "#utils/logger";
import { config } from "#config/config";
import { validateCommand } from "#utils/permissionHandler";
import { CommandContext } from "#classes/Context";
import { emoji } from "#config/emoji";

let db;

const CUSTOM_PREFIXES = {
  GLOBAL: ["yuki"],
  USER_SPECIFIC: {
    "931059762173464597": ["babu", "bish", "qt", "cutie", "baccha"],
    "937380760875302974": ["sex"],
  },
};

const mentionRegexCache = new Map();

const getMentionRegex = (clientId) => {
  if (!mentionRegexCache.has(clientId)) {
    mentionRegexCache.set(clientId, new RegExp(`^<@!?${clientId}>\\s*$`));
  }
  return mentionRegexCache.get(clientId);
};

const getMentionPrefixRegex = (clientId) => {
  const key = `prefix_${clientId}`;
  if (!mentionRegexCache.has(key)) {
    mentionRegexCache.set(key, new RegExp(`^<@!?${clientId}>\\s+`));
  }
  return mentionRegexCache.get(key);
};

const sendError = (message, title, description) => {
  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle(`${emoji.cross} ${title}`)
    .setDescription(description);

  message.reply({ embeds: [embed] }).catch(() => {
    message.reply({ content: `${emoji.cross} **${title}**: ${description}` }).catch(() => {});
  });
};

const parseMentionPrefix = (content, clientId) => {
  const regex = getMentionPrefixRegex(clientId);
  const match = content.match(regex);
  if (!match) return null;
  const parts = content.slice(match[0].length).trim().split(/\s+/);
  return parts.length > 0 && parts[0] ? { parts, type: "mention" } : null;
};

const parseGuildPrefix = async (content, guildId) => {
  let guildPrefix = ".";
  try {
    guildPrefix = (await db.getPrefix(guildId)) || config.prefix || ".";
  } catch {
    guildPrefix = config.prefix || ".";
  }

  const lowerContent = content.toLowerCase();

  if (lowerContent.startsWith(guildPrefix.toLowerCase())) {
    const sliced = content.slice(guildPrefix.length).trim();
    if (!sliced) return null;
    const parts = sliced.split(/\s+/);
    return parts.length > 0 && parts[0] ? { parts, type: "guild", guildPrefix } : null;
  }
  return null;
};

const parseCustomPrefix = (content, userId) => {
  const userPrefixes = CUSTOM_PREFIXES.USER_SPECIFIC[userId];
  const allPrefixes = userPrefixes
    ? [...CUSTOM_PREFIXES.GLOBAL, ...userPrefixes]
    : CUSTOM_PREFIXES.GLOBAL;

  const lowerContent = content.toLowerCase();
  for (const prefix of allPrefixes) {
    if (lowerContent.startsWith(prefix.toLowerCase())) {
      const sliced = content.slice(prefix.length).trim();
      if (!sliced) continue;
      const parts = sliced.split(/\s+/);
      return parts.length > 0 && parts[0] ? { parts, type: "custom" } : null;
    }
  }
  return null;
};

const parseCommand = async (message, client) => {
  const content = message.content.trim();
  if (!content) return null;

  return (
    parseMentionPrefix(content, client.user.id) ||
    (await parseGuildPrefix(content, message.guild.id)) ||
    parseCustomPrefix(content, message.author.id)
  );
};

const handleMentionOnly = async (message, client) => {
  const mentionRegex = getMentionRegex(client.user.id);
  if (!mentionRegex.test(message.content.trim())) return false;

  let guildPrefix = ".";
  try {
    guildPrefix = (await db.getPrefix(message.guild.id)) || config.prefix || ".";
  } catch {
    guildPrefix = config.prefix || ".";
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
    .setTitle(`🤖 Server Prefix Info`)
    .setDescription(`My prefix in **${message.guild.name}** is \`${guildPrefix}\`.\n\nUse \`${guildPrefix}help\` to view all commands!`)
    .setFooter({ text: `Code by KAJUKATLI` });

  await message.reply({ embeds: [embed] }).catch(() => {
    message.reply({ content: `My prefix in this server is \`${guildPrefix}\`. Use \`${guildPrefix}help\` for commands!` }).catch(() => {});
  });

  return true;
};

const getCommand = (parts, commandHandler) => {
  if (!parts || parts.length === 0 || !parts[0]) return { command: null, args: [] };

  const firstPart = parts[0].toLowerCase();

  const arrayCommands = commandHandler.arrayCommands.get(firstPart);
  if (arrayCommands?.length > 0) {
    for (const cmd of arrayCommands) {
      const nameLength = cmd.name.length;
      if (parts.length < nameLength) continue;

      let matches = true;
      for (let i = 0; i < nameLength; i++) {
        if (parts[i].toLowerCase() !== cmd.name[i].toLowerCase()) {
          matches = false;
          break;
        }
      }

      if (matches) return { command: cmd, args: parts.slice(nameLength) };
    }
  }

  const aliasedName = commandHandler.aliases.get(firstPart);
  if (aliasedName) {
    const command = commandHandler.commands.get(aliasedName);
    if (command) return { command, args: parts.slice(1) };
  }

  const directCommand = commandHandler.commands.get(firstPart);
  if (directCommand) return { command: directCommand, args: parts.slice(1) };

  return { command: null, args: [] };
};

export default {
  name: "messageCreate",
  async execute({ eventArgs, client }) {
    db = client.db;
    const [message] = eventArgs;
    if (message.author.bot || !message.guild) return;

    const [isBlacklisted, mentionHandled] = await Promise.all([
      db.isUserBlacklisted(message.guild.id, message.author.id).catch(() => false),
      handleMentionOnly(message, client),
    ]);

    if (isBlacklisted || mentionHandled) return;

    const commandInfo = await parseCommand(message, client);
    if (!commandInfo) return;

    const { command, args } = getCommand(commandInfo.parts, client.commandHandler);
    if (!command) return;

    if (command.cooldown) {
      const cooldown = client.commandHandler.isOnCooldown(
        command,
        message.author.id,
        message.guild.id
      );

      if (cooldown) {
        if (
          client.commandHandler.shouldNotifyAboutCooldown(
            command,
            message.author.id,
            message.guild.id
          )
        ) {
          const timestamp = Math.floor((Date.now() + cooldown) / 1000);
          return sendError(
            message,
            "Cooldown",
            `Wait <t:${timestamp}:R>`
          );
        }
        return;
      }

      await client.commandHandler.setCooldown(
        command,
        message.author.id,
        message.guild.id
      );
    }

    try {
      const ctx = new CommandContext({ client, message, args });
      const permissionValidation = await validateCommand(ctx, command);

      if (!permissionValidation.valid) {
        return sendError(
          message,
          permissionValidation.error.title,
          permissionValidation.error.description
        );
      }

      await command.execute({ ctx, args });
    } catch (error) {
      const displayName = Array.isArray(command.name)
        ? command.name.join(" ")
        : command.name;
      logger.error("MessageCreate", `Error executing prefix command: ${displayName}`, error);
      sendError(message, "Command Error", "An error occurred while running this command.");
    }
  },
};

// bread async
