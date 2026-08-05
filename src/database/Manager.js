/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import Database from "better-sqlite3";
import { EventEmitter } from "events";
import { resolve } from "path";
import { initializeDatabase, ensureDbDir } from "./Schema.js";
import { logger } from "#utils/logger";
import { config } from "../config/config.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();
const json = (v) => JSON.stringify(v ?? []);
const parse = (v, fallback = []) => {
  try { return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

// ─── Default category settings object ────────────────────────────────────────
const defaultCategorySettings = () => ({
  pingUser: true,
  pingRole: false,
  userCanClose: true,
  maxTicketsPerUser: 1,
  dmUserOnOpen: true,
  dmUserOnClose: true,
  welcomeMessage: null,
});

// ─── Row → plain object mappers ───────────────────────────────────────────────

function mapGuild(row) {
  if (!row) return null;
  return {
    guildId: row.guild_id,
    prefix: row.prefix,
    staffRoles: parse(row.staff_roles, []),
    welcome: parse(row.welcome, {}),
    blacklistedUsers: [],   // loaded separately when needed
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategory(row) {
  if (!row) return null;
  return {
    categoryId: row.category_id,
    panelId: row.panel_id,
    name: row.name,
    description: row.description,
    emoji: row.emoji,
    supportRoles: parse(row.support_roles, []),
    ticketChannelCategory: row.ticket_channel_category,
    namingFormat: row.naming_format,
    settings: parse(row.settings, defaultCategorySettings()),
    isActive: !!row.is_active,
  };
}

function mapPanel(row, categories = []) {
  if (!row) return null;
  return {
    panelId: row.panel_id,
    guildId: row.guild_id,
    name: row.name,
    channelId: row.channel_id,
    messageId: row.message_id,
    panelMessage: {
      title: row.panel_title,
      description: row.panel_description,
    },
    selectMenuConfig: {
      placeholder: row.select_placeholder,
      minValues: row.select_min,
      maxValues: row.select_max,
    },
    logs: parse(row.logs, {}),
    isActive: !!row.is_active,
    categories,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTicket(row, addedUsers = [], removedUsers = []) {
  if (!row) return null;
  return {
    ticketId: row.ticket_id,
    guildId: row.guild_id,
    panelId: row.panel_id,
    categoryId: row.category_id,
    channelId: row.channel_id,
    userId: row.user_id,
    status: row.status,
    controlMessageId: row.control_message_id,
    closedBy: row.closed_by,
    closedAt: row.closed_at,
    closeReason: row.close_reason,
    rating: row.rating_stars
      ? { stars: row.rating_stars, feedback: row.rating_feedback, ratedAt: row.rating_rated_at }
      : null,
    addedUsers,
    removedUsers,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSuggestion(row) {
  if (!row) return null;
  return {
    suggestionId: row.suggestion_id,
    guildId: row.guild_id,
    userId: row.user_id,
    channelId: row.channel_id,
    messageId: row.message_id,
    content: row.content,
    status: row.status,
    staffResponse: row.staff_response,
    staffId: row.staff_id,
    upvotes: parse(row.upvotes, []),
    downvotes: parse(row.downvotes, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── DatabaseManager ─────────────────────────────────────────────────────────

export class DatabaseManager extends EventEmitter {
  constructor(client) {
    super();
    this.client = client;
    /** @type {import('better-sqlite3').Database} */
    this.db = null;
  }

  // ── Connection ─────────────────────────────────────────────────────────────

  async connect(dbPath) {
    try {
      const resolvedPath = resolve(dbPath || config.database.path);
      ensureDbDir(resolvedPath);

      this.db = new Database(resolvedPath);
      initializeDatabase(this.db);

      logger.success("Database", `Connected to SQLite → ${resolvedPath}`);
      this.client.emit("databaseConnected");
    } catch (error) {
      logger.error("Database", "Connection failed", error);
      this.client.emit("databaseError", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      logger.info("Database", "Disconnected from SQLite");
      this.client.emit("databaseDisconnected");
    } catch (error) {
      logger.error("Database", "Disconnection failed", error);
      this.client.emit("databaseError", error);
    }
  }

  // ── Guild ──────────────────────────────────────────────────────────────────

  async getGuild(guildId) {
    const row = this.db.prepare("SELECT * FROM guilds WHERE guild_id = ?").get(guildId);
    if (!row) return null;
    const guild = mapGuild(row);
    guild.blacklistedUsers = this._getBlacklistedRows(guildId);
    return guild;
  }

  async createGuild(guildId, data = {}) {
    const existing = this.db.prepare("SELECT guild_id FROM guilds WHERE guild_id = ?").get(guildId);
    if (existing) return this.getGuild(guildId);
    this.db.prepare(
      `INSERT INTO guilds (guild_id, prefix, staff_roles, welcome, created_at, updated_at)
       VALUES (?, ?, ?, '{}', ?, ?)`
    ).run(guildId, data.prefix ?? "b", json(data.staffRoles ?? []), now(), now());
    logger.debug("Database", `Guild created: ${guildId}`);
    return this.getGuild(guildId);
  }

  async updateGuild(guildId, data) {
    await this.createGuild(guildId);
    const sets = [];
    const vals = [];
    if (data.prefix !== undefined)     { sets.push("prefix = ?");      vals.push(data.prefix); }
    if (data.staffRoles !== undefined) { sets.push("staff_roles = ?"); vals.push(json(data.staffRoles)); }
    sets.push("updated_at = ?"); vals.push(now());
    vals.push(guildId);
    this.db.prepare(`UPDATE guilds SET ${sets.join(", ")} WHERE guild_id = ?`).run(...vals);
    logger.debug("Database", `Guild updated: ${guildId}`);
    return this.getGuild(guildId);
  }

  async deleteGuild(guildId) {
    const guild = await this.getGuild(guildId);
    this.db.prepare("DELETE FROM guilds WHERE guild_id = ?").run(guildId);
    logger.debug("Database", `Guild deleted: ${guildId}`);
    return guild;
  }

  async setPrefix(guildId, prefix) {
    await this.createGuild(guildId);
    this.db.prepare("UPDATE guilds SET prefix = ?, updated_at = ? WHERE guild_id = ?")
      .run(prefix, now(), guildId);
    return this.getGuild(guildId);
  }

  async getPrefix(guildId) {
    const row = this.db.prepare("SELECT prefix FROM guilds WHERE guild_id = ?").get(guildId);
    return row?.prefix ?? config.prefix;
  }

  // ── Blacklist ──────────────────────────────────────────────────────────────

  _getBlacklistedRows(guildId) {
    return this.db.prepare("SELECT * FROM blacklisted_users WHERE guild_id = ?")
      .all(guildId)
      .map(r => ({
        userId: r.user_id,
        reason: r.reason,
        blacklistedBy: r.blacklisted_by,
        blacklistedAt: r.blacklisted_at,
      }));
  }

  async addBlacklistedUser(guildId, userId, reason, blacklistedBy) {
    await this.createGuild(guildId);
    this.db.prepare(
      `INSERT INTO blacklisted_users (guild_id, user_id, reason, blacklisted_by, blacklisted_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(guildId, userId, reason, blacklistedBy, now());
    this.client.emit("userBlacklisted", { guildId, userId, reason, blacklistedBy });
    return this.getGuild(guildId);
  }

  async removeBlacklistedUser(guildId, userId) {
    this.db.prepare("DELETE FROM blacklisted_users WHERE guild_id = ? AND user_id = ?")
      .run(guildId, userId);
    this.client.emit("userUnblacklisted", { guildId, userId });
    return this.getGuild(guildId);
  }

  async isUserBlacklisted(guildId, userId) {
    const row = this.db.prepare(
      "SELECT 1 FROM blacklisted_users WHERE guild_id = ? AND user_id = ? LIMIT 1"
    ).get(guildId, userId);
    return !!row;
  }

  async getBlacklistedUsers(guildId) {
    return this._getBlacklistedRows(guildId);
  }

  // ── Staff Roles ────────────────────────────────────────────────────────────

  async setStaffRoles(guildId, roles) {
    return this.updateGuild(guildId, { staffRoles: roles });
  }

  async addStaffRole(guildId, roleId) {
    await this.createGuild(guildId);
    const row = this.db.prepare("SELECT staff_roles FROM guilds WHERE guild_id = ?").get(guildId);
    const roles = parse(row?.staff_roles, []);
    if (!roles.includes(roleId)) roles.push(roleId);
    this.db.prepare("UPDATE guilds SET staff_roles = ?, updated_at = ? WHERE guild_id = ?")
      .run(json(roles), now(), guildId);
    return this.getGuild(guildId);
  }

  async removeStaffRole(guildId, roleId) {
    const row = this.db.prepare("SELECT staff_roles FROM guilds WHERE guild_id = ?").get(guildId);
    const roles = parse(row?.staff_roles, []).filter(r => r !== roleId);
    this.db.prepare("UPDATE guilds SET staff_roles = ?, updated_at = ? WHERE guild_id = ?")
      .run(json(roles), now(), guildId);
    return this.getGuild(guildId);
  }

  async getStaffRoles(guildId) {
    const row = this.db.prepare("SELECT staff_roles FROM guilds WHERE guild_id = ?").get(guildId);
    return parse(row?.staff_roles, []);
  }

  // ── Panel ──────────────────────────────────────────────────────────────────

  _getCategoriesForPanel(panelId) {
    return this.db.prepare("SELECT * FROM categories WHERE panel_id = ?")
      .all(panelId)
      .map(mapCategory);
  }

  async createPanel(guildId, panelData) {
    const panelId = `panel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pm = panelData.panelMessage ?? {};
    const sm = panelData.selectMenuConfig ?? {};
    this.db.prepare(
      `INSERT INTO panels
         (panel_id, guild_id, name, channel_id, message_id,
          panel_title, panel_description,
          select_placeholder, select_min, select_max,
          logs, is_active, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?)`
    ).run(
      panelId, guildId, panelData.name ?? "Panel",
      panelData.channelId ?? null, panelData.messageId ?? null,
      pm.title ?? "Ticket Panel",
      pm.description ?? "Select a category below to create a ticket",
      sm.placeholder ?? "Select a ticket category",
      sm.minValues ?? 1, sm.maxValues ?? 1,
      json(panelData.logs ?? {}),
      now(), now()
    );
    logger.debug("Database", `Panel created: ${panelId}`);
    return this.getPanel(panelId);
  }

  async getPanel(panelId) {
    const row = this.db.prepare("SELECT * FROM panels WHERE panel_id = ?").get(panelId);
    if (!row) return null;
    return mapPanel(row, this._getCategoriesForPanel(panelId));
  }

  async getGuildPanels(guildId) {
    const rows = this.db.prepare("SELECT * FROM panels WHERE guild_id = ?").all(guildId);
    return rows.map(r => mapPanel(r, this._getCategoriesForPanel(r.panel_id)));
  }

  async getActivePanels(guildId) {
    const rows = this.db.prepare("SELECT * FROM panels WHERE guild_id = ? AND is_active = 1").all(guildId);
    return rows.map(r => mapPanel(r, this._getCategoriesForPanel(r.panel_id)));
  }

  async updatePanel(panelId, data) {
    const sets = [];
    const vals = [];

    if (data.name !== undefined)        { sets.push("name = ?");              vals.push(data.name); }
    if (data.channelId !== undefined)   { sets.push("channel_id = ?");        vals.push(data.channelId); }
    if (data.messageId !== undefined)   { sets.push("message_id = ?");        vals.push(data.messageId); }
    if (data.isActive !== undefined)    { sets.push("is_active = ?");         vals.push(data.isActive ? 1 : 0); }
    if (data.logs !== undefined)        { sets.push("logs = ?");              vals.push(json(data.logs)); }

    if (data.panelMessage !== undefined) {
      if (data.panelMessage.title !== undefined)       { sets.push("panel_title = ?");       vals.push(data.panelMessage.title); }
      if (data.panelMessage.description !== undefined) { sets.push("panel_description = ?"); vals.push(data.panelMessage.description); }
    }
    if (data.selectMenuConfig !== undefined) {
      const sm = data.selectMenuConfig;
      if (sm.placeholder !== undefined) { sets.push("select_placeholder = ?"); vals.push(sm.placeholder); }
      if (sm.minValues !== undefined)   { sets.push("select_min = ?");          vals.push(sm.minValues); }
      if (sm.maxValues !== undefined)   { sets.push("select_max = ?");          vals.push(sm.maxValues); }
    }

    if (sets.length === 0) return this.getPanel(panelId);
    sets.push("updated_at = ?"); vals.push(now());
    vals.push(panelId);
    this.db.prepare(`UPDATE panels SET ${sets.join(", ")} WHERE panel_id = ?`).run(...vals);
    return this.getPanel(panelId);
  }

  async setPanelName(panelId, name) {
    return this.updatePanel(panelId, { name });
  }

  async setPanelLogs(panelId, logs) {
    return this.updatePanel(panelId, { logs });
  }

  async setPanelSelectMenu(panelId, selectMenuConfig) {
    return this.updatePanel(panelId, { selectMenuConfig });
  }

  async setPanelMessage(panelId, panelMessage) {
    return this.updatePanel(panelId, { panelMessage });
  }

  async setPanelMessageId(panelId, channelId, messageId) {
    return this.updatePanel(panelId, { channelId, messageId });
  }

  async togglePanelActive(panelId) {
    const row = this.db.prepare("SELECT is_active FROM panels WHERE panel_id = ?").get(panelId);
    return this.updatePanel(panelId, { isActive: !row.is_active });
  }

  async deletePanel(panelId) {
    const panel = await this.getPanel(panelId);
    this.db.prepare("DELETE FROM panels WHERE panel_id = ?").run(panelId);
    logger.debug("Database", `Panel deleted: ${panelId}`);
    return panel;
  }

  // ── Category ───────────────────────────────────────────────────────────────

  async addCategory(panelId, categoryData) {
    const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const settings = { ...defaultCategorySettings(), ...(categoryData.settings ?? {}) };
    this.db.prepare(
      `INSERT INTO categories
         (category_id, panel_id, name, description, emoji,
          support_roles, ticket_channel_category, naming_format, settings, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,1)`
    ).run(
      categoryId, panelId,
      categoryData.name, categoryData.description ?? null, categoryData.emoji ?? null,
      json(categoryData.supportRoles ?? []),
      categoryData.ticketChannelCategory ?? null,
      categoryData.namingFormat ?? "ticket-{username}-{number}",
      json(settings)
    );
    return this.getPanel(panelId);
  }

  async updateCategory(panelId, categoryId, data) {
    const sets = [];
    const vals = [];
    if (data.name !== undefined)                  { sets.push("name = ?");                    vals.push(data.name); }
    if (data.description !== undefined)           { sets.push("description = ?");             vals.push(data.description); }
    if (data.emoji !== undefined)                 { sets.push("emoji = ?");                   vals.push(data.emoji); }
    if (data.supportRoles !== undefined)          { sets.push("support_roles = ?");           vals.push(json(data.supportRoles)); }
    if (data.ticketChannelCategory !== undefined) { sets.push("ticket_channel_category = ?"); vals.push(data.ticketChannelCategory); }
    if (data.namingFormat !== undefined)          { sets.push("naming_format = ?");           vals.push(data.namingFormat); }
    if (data.isActive !== undefined)              { sets.push("is_active = ?");               vals.push(data.isActive ? 1 : 0); }
    if (data.settings !== undefined) {
      const existing = this.db.prepare("SELECT settings FROM categories WHERE category_id = ?").get(categoryId);
      const merged = { ...parse(existing?.settings, defaultCategorySettings()), ...data.settings };
      sets.push("settings = ?"); vals.push(json(merged));
    }
    if (sets.length === 0) return this.getPanel(panelId);
    vals.push(categoryId);
    this.db.prepare(`UPDATE categories SET ${sets.join(", ")} WHERE category_id = ?`).run(...vals);
    return this.getPanel(panelId);
  }

  async removeCategory(panelId, categoryId) {
    this.db.prepare("DELETE FROM categories WHERE category_id = ? AND panel_id = ?").run(categoryId, panelId);
    return this.getPanel(panelId);
  }

  async getCategory(panelId, categoryId) {
    const row = this.db.prepare(
      "SELECT * FROM categories WHERE category_id = ? AND panel_id = ?"
    ).get(categoryId, panelId);
    return mapCategory(row);
  }

  async toggleCategoryActive(panelId, categoryId) {
    const row = this.db.prepare("SELECT is_active FROM categories WHERE category_id = ?").get(categoryId);
    this.db.prepare("UPDATE categories SET is_active = ? WHERE category_id = ?")
      .run(row.is_active ? 0 : 1, categoryId);
    return this.getPanel(panelId);
  }

  async updateCategorySettings(panelId, categoryId, settings) {
    const row = this.db.prepare("SELECT settings FROM categories WHERE category_id = ?").get(categoryId);
    const merged = { ...parse(row?.settings, defaultCategorySettings()), ...settings };
    this.db.prepare("UPDATE categories SET settings = ? WHERE category_id = ?")
      .run(json(merged), categoryId);
    return this.getPanel(panelId);
  }

  async addCategorySupportRole(panelId, categoryId, roleId) {
    const row = this.db.prepare("SELECT support_roles FROM categories WHERE category_id = ?").get(categoryId);
    const roles = parse(row?.support_roles, []);
    if (!roles.includes(roleId)) roles.push(roleId);
    this.db.prepare("UPDATE categories SET support_roles = ? WHERE category_id = ?")
      .run(json(roles), categoryId);
    return this.getPanel(panelId);
  }

  async removeCategorySupportRole(panelId, categoryId, roleId) {
    const row = this.db.prepare("SELECT support_roles FROM categories WHERE category_id = ?").get(categoryId);
    const roles = parse(row?.support_roles, []).filter(r => r !== roleId);
    this.db.prepare("UPDATE categories SET support_roles = ? WHERE category_id = ?")
      .run(json(roles), categoryId);
    return this.getPanel(panelId);
  }

  // ── Ticket ─────────────────────────────────────────────────────────────────

  _getTicketAddedUsers(ticketId) {
    return this.db.prepare("SELECT * FROM ticket_added_users WHERE ticket_id = ?")
      .all(ticketId)
      .map(r => ({ userId: r.user_id, addedBy: r.added_by, addedAt: r.added_at }));
  }

  _getTicketRemovedUsers(ticketId) {
    return this.db.prepare("SELECT * FROM ticket_removed_users WHERE ticket_id = ?")
      .all(ticketId)
      .map(r => ({ userId: r.user_id, removedBy: r.removed_by, removedAt: r.removed_at }));
  }

  async createTicket(guildId, panelId, categoryId, userId, data = {}) {
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.db.prepare(
      `INSERT INTO tickets
         (ticket_id, guild_id, panel_id, category_id, channel_id, user_id,
          status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,'open',?,?)`
    ).run(ticketId, guildId, panelId, categoryId, data.channelId ?? null, userId, now(), now());
    const ticket = await this.getTicket(ticketId);
    this.client.emit("ticketCreated", { ticketId, guildId, panelId, categoryId, userId, ticket });
    return ticket;
  }

  async getTicket(ticketId) {
    const row = this.db.prepare("SELECT * FROM tickets WHERE ticket_id = ?").get(ticketId);
    return mapTicket(row, this._getTicketAddedUsers(ticketId), this._getTicketRemovedUsers(ticketId));
  }

  async getTicketByChannel(channelId) {
    const row = this.db.prepare(
      "SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'"
    ).get(channelId);
    if (!row) return null;
    return mapTicket(row, this._getTicketAddedUsers(row.ticket_id), this._getTicketRemovedUsers(row.ticket_id));
  }

  async getTicketByChannelAny(channelId) {
    const row = this.db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channelId);
    if (!row) return null;
    return mapTicket(row, this._getTicketAddedUsers(row.ticket_id), this._getTicketRemovedUsers(row.ticket_id));
  }

  async isTicketChannel(channelId) {
    return !!this.db.prepare("SELECT 1 FROM tickets WHERE channel_id = ? LIMIT 1").get(channelId);
  }

  async getUserOpenTickets(guildId, userId) {
    const rows = this.db.prepare(
      "SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'"
    ).all(guildId, userId);
    return rows.map(r => mapTicket(r));
  }

  async getUserCategoryOpenTickets(guildId, userId, categoryId) {
    const rows = this.db.prepare(
      "SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND category_id = ? AND status = 'open'"
    ).all(guildId, userId, categoryId);
    return rows.map(r => mapTicket(r));
  }

  async getGuildOpenTickets(guildId) {
    return this.db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND status = 'open'")
      .all(guildId).map(r => mapTicket(r));
  }

  async getGuildClosedTickets(guildId) {
    return this.db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND status = 'closed'")
      .all(guildId).map(r => mapTicket(r));
  }

  async getGuildTickets(guildId) {
    return this.db.prepare("SELECT * FROM tickets WHERE guild_id = ?")
      .all(guildId).map(r => mapTicket(r));
  }

  async getPanelTickets(panelId) {
    return this.db.prepare("SELECT * FROM tickets WHERE panel_id = ?")
      .all(panelId).map(r => mapTicket(r));
  }

  async getCategoryTickets(panelId, categoryId) {
    return this.db.prepare("SELECT * FROM tickets WHERE panel_id = ? AND category_id = ?")
      .all(panelId, categoryId).map(r => mapTicket(r));
  }

  async getUserTickets(guildId, userId) {
    return this.db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ?")
      .all(guildId, userId).map(r => mapTicket(r));
  }

  async updateTicket(ticketId, data) {
    const sets = [];
    const vals = [];
    if (data.channelId !== undefined)        { sets.push("channel_id = ?");          vals.push(data.channelId); }
    if (data.status !== undefined)           { sets.push("status = ?");              vals.push(data.status); }
    if (data.controlMessageId !== undefined) { sets.push("control_message_id = ?");  vals.push(data.controlMessageId); }
    if (data.closedBy !== undefined)         { sets.push("closed_by = ?");           vals.push(data.closedBy); }
    if (data.closedAt !== undefined)         { sets.push("closed_at = ?");           vals.push(data.closedAt); }
    if (data.closeReason !== undefined)      { sets.push("close_reason = ?");        vals.push(data.closeReason); }
    sets.push("updated_at = ?"); vals.push(now());
    vals.push(ticketId);
    this.db.prepare(`UPDATE tickets SET ${sets.join(", ")} WHERE ticket_id = ?`).run(...vals);
    return this.getTicket(ticketId);
  }

  async setTicketChannel(ticketId, channelId) {
    return this.updateTicket(ticketId, { channelId });
  }

  async setTicketControlMessage(ticketId, controlMessageId) {
    return this.updateTicket(ticketId, { controlMessageId });
  }

  async addTicketUser(ticketId, userId, addedBy) {
    this.db.prepare(
      "INSERT INTO ticket_added_users (ticket_id, user_id, added_by, added_at) VALUES (?,?,?,?)"
    ).run(ticketId, userId, addedBy, now());
    const ticket = await this.getTicket(ticketId);
    this.client.emit("ticketUserAdded", {
      ticketId,
      guildId: ticket.guildId,
      userId,
      addedBy,
      channelId: ticket.channelId,
    });
    return ticket;
  }

  async removeTicketUser(ticketId, userId, removedBy) {
    this.db.prepare(
      "INSERT INTO ticket_removed_users (ticket_id, user_id, removed_by, removed_at) VALUES (?,?,?,?)"
    ).run(ticketId, userId, removedBy, now());
    // Remove from added_users list
    this.db.prepare(
      "DELETE FROM ticket_added_users WHERE ticket_id = ? AND user_id = ?"
    ).run(ticketId, userId);
    const ticket = await this.getTicket(ticketId);
    this.client.emit("ticketUserRemoved", {
      ticketId,
      guildId: ticket.guildId,
      userId,
      removedBy,
      channelId: ticket.channelId,
    });
    return ticket;
  }

  async isUserAdded(ticketId, userId) {
    return !!this.db.prepare(
      "SELECT 1 FROM ticket_added_users WHERE ticket_id = ? AND user_id = ? LIMIT 1"
    ).get(ticketId, userId);
  }

  async getAddedUsers(ticketId) {
    return this._getTicketAddedUsers(ticketId);
  }

  async closeTicket(ticketId, closedBy, reason = null) {
    const closedAt = now();
    this.db.prepare(
      `UPDATE tickets
       SET status = 'closed', closed_by = ?, closed_at = ?, close_reason = ?, updated_at = ?
       WHERE ticket_id = ?`
    ).run(closedBy, closedAt, reason, closedAt, ticketId);
    const ticket = await this.getTicket(ticketId);
    this.client.emit("ticketClosed", {
      ticketId,
      guildId: ticket.guildId,
      userId: ticket.userId,
      closedBy,
      reason,
      channelId: ticket.channelId,
    });
    return ticket;
  }

  async reopenTicket(ticketId) {
    this.db.prepare(
      `UPDATE tickets
       SET status = 'open', closed_by = NULL, closed_at = NULL, close_reason = NULL, updated_at = ?
       WHERE ticket_id = ?`
    ).run(now(), ticketId);
    const ticket = await this.getTicket(ticketId);
    this.client.emit("ticketReopened", {
      ticketId,
      guildId: ticket.guildId,
      userId: ticket.userId,
      channelId: ticket.channelId,
    });
    return ticket;
  }

  async rateTicket(ticketId, stars, feedback = null) {
    const ratedAt = now();
    this.db.prepare(
      `UPDATE tickets
       SET rating_stars = ?, rating_feedback = ?, rating_rated_at = ?, updated_at = ?
       WHERE ticket_id = ?`
    ).run(stars, feedback, ratedAt, ratedAt, ticketId);
    const ticket = await this.getTicket(ticketId);
    this.client.emit("ticketRated", {
      ticketId,
      guildId: ticket.guildId,
      userId: ticket.userId,
      stars,
      feedback,
      channelId: ticket.channelId,
    });
    return ticket;
  }

  async deleteTicket(ticketId) {
    const ticket = await this.getTicket(ticketId);
    this.db.prepare("DELETE FROM tickets WHERE ticket_id = ?").run(ticketId);
    this.client.emit("ticketDeleted", {
      ticketId,
      guildId: ticket?.guildId,
      userId: ticket?.userId,
      channelId: ticket?.channelId,
    });
    return ticket;
  }

  async deleteGuildTickets(guildId) {
    const info = this.db.prepare("DELETE FROM tickets WHERE guild_id = ?").run(guildId);
    this.client.emit("guildTicketsDeleted", { guildId, count: info.changes });
    return { deletedCount: info.changes };
  }

  async deletePanelTickets(panelId) {
    const info = this.db.prepare("DELETE FROM tickets WHERE panel_id = ?").run(panelId);
    this.client.emit("panelTicketsDeleted", { panelId, count: info.changes });
    return { deletedCount: info.changes };
  }

  async getUserTicketCount(guildId, userId) {
    const row = this.db.prepare(
      "SELECT COUNT(*) AS c FROM tickets WHERE guild_id = ? AND user_id = ?"
    ).get(guildId, userId);
    return row.c;
  }

  async getUserOpenTicketCount(guildId, userId) {
    const row = this.db.prepare(
      "SELECT COUNT(*) AS c FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'"
    ).get(guildId, userId);
    return row.c;
  }

  async bulkDeleteOldClosedTickets(guildId, daysOld) {
    const threshold = new Date(Date.now() - daysOld * 86400000).toISOString();
    const info = this.db.prepare(
      "DELETE FROM tickets WHERE guild_id = ? AND status = 'closed' AND closed_at < ?"
    ).run(guildId, threshold);
    this.client.emit("bulkTicketsDeleted", { guildId, count: info.changes });
    return { deletedCount: info.changes };
  }

  // ── Misc ───────────────────────────────────────────────────────────────────

  async getAllGuilds() {
    return this.db.prepare("SELECT * FROM guilds").all().map(mapGuild);
  }

  async getControlMessage(ticketId) {
    const row = this.db.prepare("SELECT control_message_id FROM tickets WHERE ticket_id = ?").get(ticketId);
    return row?.control_message_id ?? null;
  }

  async getGuildCount() {
    const row = this.db.prepare("SELECT COUNT(*) AS c FROM guilds").get();
    return row.c;
  }

  async getTotalTicketCount() {
    const row = this.db.prepare("SELECT COUNT(*) AS c FROM tickets").get();
    return row.c;
  }

  async getTotalOpenTicketCount() {
    const row = this.db.prepare("SELECT COUNT(*) AS c FROM tickets WHERE status = 'open'").get();
    return row.c;
  }

  // ── Welcome ────────────────────────────────────────────────────────────────

  async getWelcome(guildId) {
    const row = this.db.prepare("SELECT welcome FROM guilds WHERE guild_id = ?").get(guildId);
    return parse(row?.welcome, {});
  }

  async setWelcome(guildId, config) {
    await this.createGuild(guildId);
    const existing = await this.getWelcome(guildId);
    const merged = { ...existing, ...config };
    this.db.prepare("UPDATE guilds SET welcome = ?, updated_at = ? WHERE guild_id = ?")
      .run(json(merged), now(), guildId);
    return merged;
  }

  async clearWelcome(guildId) {
    this.db.prepare("UPDATE guilds SET welcome = '{}', updated_at = ? WHERE guild_id = ?")
      .run(now(), guildId);
  }

  // ── Leveling System ────────────────────────────────────────────────────────

  /** Calculate total XP required to reach next level */
  getXPForLevel(level) {
    return 5 * (level ** 2) + 50 * level + 100;
  }

  /** Get user level & XP info */
  async getUserLevel(guildId, userId) {
    const row = this.db.prepare(
      "SELECT * FROM user_levels WHERE guild_id = ? AND user_id = ?"
    ).get(guildId, userId);

    if (!row) {
      return {
        guildId,
        userId,
        xp: 0,
        level: 0,
        messages: 0,
        lastXpAt: null,
      };
    }

    return {
      guildId: row.guild_id,
      userId: row.user_id,
      xp: row.xp,
      level: row.level,
      messages: row.messages,
      lastXpAt: row.last_xp_at,
    };
  }

  /** Add XP to a user and check for level-up. */
  async addXP(guildId, userId, amount = 15) {
    const current = await this.getUserLevel(guildId, userId);
    const newXP = current.xp + amount;
    const newMessages = current.messages + 1;

    let newLevel = current.level;
    let needed = this.getXPForLevel(newLevel);

    while (newXP >= needed) {
      newLevel++;
      needed += this.getXPForLevel(newLevel);
    }

    const leveledUp = newLevel > current.level;

    this.db.prepare(
      `INSERT INTO user_levels (guild_id, user_id, xp, level, messages, last_xp_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET
         xp = excluded.xp,
         level = excluded.level,
         messages = excluded.messages,
         last_xp_at = excluded.last_xp_at`
    ).run(guildId, userId, newXP, newLevel, newMessages, now());

    return {
      guildId,
      userId,
      xp: newXP,
      level: newLevel,
      oldLevel: current.level,
      leveledUp,
      messages: newMessages,
      nextLevelXP: this.getXPForLevel(newLevel),
    };
  }

  /** Get top leaderboard users for a server */
  async getLeaderboard(guildId, limit = 10) {
    const rows = this.db.prepare(
      "SELECT * FROM user_levels WHERE guild_id = ? ORDER BY xp DESC LIMIT ?"
    ).all(guildId, limit);

    return rows.map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      xp: r.xp,
      level: r.level,
      messages: r.messages,
    }));
  }

  /** Get user's rank position in server */
  async getUserRank(guildId, userId) {
    const user = await this.getUserLevel(guildId, userId);
    const countRow = this.db.prepare(
      "SELECT COUNT(*) AS c FROM user_levels WHERE guild_id = ? AND xp > ?"
    ).get(guildId, user.xp);

    return {
      ...user,
      rank: (countRow?.c ?? 0) + 1,
      neededXP: this.getXPForLevel(user.level),
    };
  }

  /** Level Role Rewards */
  async setLevelRole(guildId, level, roleId) {
    this.db.prepare(
      `INSERT INTO level_roles (guild_id, level, role_id) VALUES (?, ?, ?)`
    ).run(guildId, level, roleId);
  }

  async getLevelRoles(guildId) {
    return this.db.prepare(
      "SELECT level, role_id FROM level_roles WHERE guild_id = ? ORDER BY level ASC"
    ).all(guildId).map(r => ({ level: r.level, roleId: r.role_id }));
  }

  async removeLevelRole(guildId, level) {
    this.db.prepare("DELETE FROM level_roles WHERE guild_id = ? AND level = ?").run(guildId, level);
  }

  async resetGuildLevels(guildId) {
    this.db.prepare("DELETE FROM user_levels WHERE guild_id = ?").run(guildId);
  }

  // ── Suggestions System ───────────────────────────────────────────────────

  async getSuggestionConfig(guildId) {
    const row = this.db.prepare("SELECT * FROM suggestion_config WHERE guild_id = ?").get(guildId);
    if (!row) return { guildId, channelId: null, autoUpvote: true, anonymous: false, logsChannelId: null };
    return {
      guildId: row.guild_id,
      channelId: row.channel_id,
      autoUpvote: !!row.auto_upvote,
      anonymous: !!row.anonymous,
      logsChannelId: row.logs_channel_id,
    };
  }

  async setSuggestionConfig(guildId, data) {
    const current = await this.getSuggestionConfig(guildId);
    const channelId = data.channelId !== undefined ? data.channelId : current.channelId;
    const autoUpvote = data.autoUpvote !== undefined ? (data.autoUpvote ? 1 : 0) : (current.autoUpvote ? 1 : 0);
    const anonymous = data.anonymous !== undefined ? (data.anonymous ? 1 : 0) : (current.anonymous ? 1 : 0);
    const logsChannelId = data.logsChannelId !== undefined ? data.logsChannelId : current.logsChannelId;

    this.db.prepare(
      `INSERT INTO suggestion_config (guild_id, channel_id, auto_upvote, anonymous, logs_channel_id)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET
         channel_id = excluded.channel_id,
         auto_upvote = excluded.auto_upvote,
         anonymous = excluded.anonymous,
         logs_channel_id = excluded.logs_channel_id`
    ).run(guildId, channelId, autoUpvote, anonymous, logsChannelId);

    return this.getSuggestionConfig(guildId);
  }

  async createSuggestion(guildId, userId, channelId, content) {
    const suggestionId = `sug_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.db.prepare(
      `INSERT INTO suggestions (suggestion_id, guild_id, user_id, channel_id, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(suggestionId, guildId, userId, channelId, content, now(), now());

    return this.getSuggestion(suggestionId);
  }

  async setSuggestionMessageId(suggestionId, messageId) {
    this.db.prepare("UPDATE suggestions SET message_id = ?, updated_at = ? WHERE suggestion_id = ?")
      .run(messageId, now(), suggestionId);
    return this.getSuggestion(suggestionId);
  }

  async getSuggestion(suggestionId) {
    const row = this.db.prepare("SELECT * FROM suggestions WHERE suggestion_id = ?").get(suggestionId);
    return mapSuggestion(row);
  }

  async getSuggestionByMessage(messageId) {
    const row = this.db.prepare("SELECT * FROM suggestions WHERE message_id = ?").get(messageId);
    return mapSuggestion(row);
  }

  async updateSuggestionStatus(suggestionId, status, staffId, staffResponse = null) {
    this.db.prepare(
      `UPDATE suggestions
       SET status = ?, staff_id = ?, staff_response = ?, updated_at = ?
       WHERE suggestion_id = ?`
    ).run(status, staffId, staffResponse, now(), suggestionId);
    return this.getSuggestion(suggestionId);
  }

  async voteSuggestion(suggestionId, userId, voteType) {
    const sug = await this.getSuggestion(suggestionId);
    if (!sug) return null;

    let upvotes = new Set(sug.upvotes);
    let downvotes = new Set(sug.downvotes);

    if (voteType === "up") {
      if (upvotes.has(userId)) {
        upvotes.delete(userId);
      } else {
        upvotes.add(userId);
        downvotes.delete(userId);
      }
    } else if (voteType === "down") {
      if (downvotes.has(userId)) {
        downvotes.delete(userId);
      } else {
        downvotes.add(userId);
        upvotes.delete(userId);
      }
    }

    const upArr = Array.from(upvotes);
    const downArr = Array.from(downvotes);

    this.db.prepare(
      `UPDATE suggestions SET upvotes = ?, downvotes = ?, updated_at = ? WHERE suggestion_id = ?`
    ).run(json(upArr), json(downArr), now(), suggestionId);

    return this.getSuggestion(suggestionId);
  }

  // ── Feedback System ────────────────────────────────────────────────────────

  async getFeedbackConfig(guildId) {
    const row = this.db.prepare("SELECT * FROM feedback_config WHERE guild_id = ?").get(guildId);
    return { guildId, channelId: row?.channel_id ?? null };
  }

  async setFeedbackConfig(guildId, channelId) {
    this.db.prepare(
      `INSERT INTO feedback_config (guild_id, channel_id) VALUES (?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET channel_id = excluded.channel_id`
    ).run(guildId, channelId);
    return this.getFeedbackConfig(guildId);
  }

  async createFeedback(guildId, userId, stars, message, channelId) {
    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.db.prepare(
      `INSERT INTO feedbacks (feedback_id, guild_id, user_id, stars, message, channel_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(feedbackId, guildId, userId, stars, message, channelId, now());

    return {
      feedbackId,
      guildId,
      userId,
      stars,
      message,
      channelId,
      createdAt: now(),
    };
  }

  async setFeedbackMessageId(feedbackId, messageId) {
    this.db.prepare("UPDATE feedbacks SET message_id = ? WHERE feedback_id = ?").run(messageId, feedbackId);
  }

  async getFeedbackStats(guildId) {
    const totalRow = this.db.prepare("SELECT COUNT(*) AS total, AVG(stars) AS avg_stars FROM feedbacks WHERE guild_id = ?").get(guildId);
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    const rows = this.db.prepare(
      "SELECT stars, COUNT(*) AS count FROM feedbacks WHERE guild_id = ? GROUP BY stars"
    ).all(guildId);

    for (const r of rows) {
      breakdown[r.stars] = r.count;
    }

    return {
      total: totalRow?.total ?? 0,
      average: totalRow?.avg_stars ? parseFloat(totalRow.avg_stars.toFixed(2)) : 0,
      breakdown,
    };
  }
}

export const createDatabaseManager = (client) => new DatabaseManager(client);
// bread variable
