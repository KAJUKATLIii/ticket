/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import { EmbedBuilder, MessageFlags } from "discord.js";
import { emoji } from "#config/emoji";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

class BirthdayCommand extends Command {
  constructor() {
    super({
      name: "birthday",
      description: "Set, view, or list server member birthdays",
      usage: "birthday <set|view|list|remove>",
      examples: [
        "birthday set month:8 day:15",
        "birthday view @user",
        "birthday list",
      ],
      userPermissions: [],
      botPermissions: [],
      enabledSlash: true,
      slashData: {
        name: "birthday",
        description: "Set, view, or list server member birthdays",
        options: [
          {
            name: "set",
            description: "Set your birth date",
            type: 1, // SUB_COMMAND
            options: [
              { name: "month", description: "Birth month (1 - 12)", type: 4, required: true },
              { name: "day", description: "Birth day (1 - 31)", type: 4, required: true },
              { name: "year", description: "Birth year e.g. 2000 (optional)", type: 4, required: false },
            ],
          },
          {
            name: "view",
            description: "View your or another user's birthday",
            type: 1, // SUB_COMMAND
            options: [
              { name: "user", description: "User to check (optional)", type: 6, required: false },
            ],
          },
          {
            name: "list",
            description: "View upcoming birthdays for this server",
            type: 1, // SUB_COMMAND
          },
          {
            name: "remove",
            description: "Remove your saved birthday date",
            type: 1, // SUB_COMMAND
          },
        ],
      },
    });
  }

  async execute({ ctx }) {
    const db = ctx.client.db;
    const guildId = ctx.guild.id;

    if (ctx.isSlash) {
      const sub = ctx.interaction.options.getSubcommand();

      // ── Set Birthday ───────────────────────────────────────────────────────
      if (sub === "set") {
        const month = ctx.interaction.options.getInteger("month");
        const day   = ctx.interaction.options.getInteger("day");
        const year  = ctx.interaction.options.getInteger("year");

        if (month < 1 || month > 12) {
          return ctx.reply({ content: `${emoji.cross} Invalid month. Must be between 1 and 12.`, flags: MessageFlags.Ephemeral });
        }
        if (day < 1 || day > 31) {
          return ctx.reply({ content: `${emoji.cross} Invalid day. Must be between 1 and 31.`, flags: MessageFlags.Ephemeral });
        }

        await db.setBirthday(guildId, ctx.author.id, { month, day, year });
        const monthName = MONTH_NAMES[month];
        const yearStr = year ? `, ${year}` : "";

        return ctx.reply({
          content: `${emoji.check} Your birthday has been set to **${monthName} ${day}${yearStr}**! 🎉 You'll get a special announcement card & role on your birthday!`,
        });
      }

      // ── View Birthday ──────────────────────────────────────────────────────
      if (sub === "view") {
        const targetUser = ctx.interaction.options.getUser("user") || ctx.author;
        const bday = await db.getBirthday(guildId, targetUser.id);

        if (!bday) {
          return ctx.reply({
            content: `${emoji.info} ${targetUser} has not set their birthday yet. Use \`/birthday set\` to register!`,
          });
        }

        const monthName = MONTH_NAMES[bday.month];
        const yearStr = bday.year ? `, ${bday.year}` : "";

        const embed = new EmbedBuilder()
          .setColor(0xFEE75C)
          .setAuthor({ name: `${targetUser.username}'s Birthday`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
          .setDescription(`🎂 **Birth Date:** ${monthName} ${bday.day}${yearStr}`)
          .setFooter({ text: ctx.guild.name })
          .setTimestamp();

        return ctx.reply({ embeds: [embed] });
      }

      // ── List Upcoming Birthdays ────────────────────────────────────────────
      if (sub === "list") {
        const bdays = await db.getGuildBirthdays(guildId);

        if (!bdays || bdays.length === 0) {
          return ctx.reply({ content: `${emoji.info} No members have registered their birthdays in this server yet.` });
        }

        const lines = bdays.slice(0, 15).map(b => {
          const monthName = MONTH_NAMES[b.month];
          return `• <@${b.userId}> ➔ **${monthName} ${b.day}**${b.year ? ` (\`${b.year}\`)` : ""}`;
        });

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`🎂 ${ctx.guild.name} Birthdays Directory`)
          .setDescription(lines.join("\n"))
          .setFooter({ text: "Use /birthday set to add yours!" })
          .setTimestamp();

        return ctx.reply({ embeds: [embed] });
      }

      // ── Remove Birthday ────────────────────────────────────────────────────
      if (sub === "remove") {
        await db.removeBirthday(guildId, ctx.author.id);
        return ctx.reply({ content: `${emoji.check} Removed your birthday record.` });
      }
    } else {
      return ctx.reply({
        content: `Use slash command \`/birthday <set|view|list|remove>\``,
      });
    }
  }
}

export default new BirthdayCommand();
// bread end
