<div align="center">

![TicketBot Banner](https://raw.githubusercontent.com/KAJUKATLIii/ticket/main/assets/banner.png)

<p>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=for-the-badge&logo=JavaScript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/discord.js-5865F2.svg?style=for-the-badge&logo=discorddotjs&logoColor=white" alt="discord.js"/>
  <img src="https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/SQLite-003B57.svg?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
</p>

<p>
  <img src="https://img.shields.io/github/stars/KAJUKATLIii/ticket?style=for-the-badge&color=gold" alt="Stars"/>
  <img src="https://img.shields.io/github/forks/KAJUKATLIii/ticket?style=for-the-badge&color=blue" alt="Forks"/>
  <img src="https://img.shields.io/github/issues/KAJUKATLIii/ticket?style=for-the-badge&color=red" alt="Issues"/>
  <img src="https://img.shields.io/badge/version-2.0.0-blueviolet?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License"/>
</p>

# 🎫 TicketBot

**A powerful, zero-dependency Discord ticket management system.**  
Built with Discord.js v14, Component V2 UI, and a local SQLite database — no MongoDB, no cloud setup required.

</div>

---

## ✨ Features

### 🎫 Ticket Management
| Feature | Description |
|---|---|
| **Create Tickets** | Members create tickets with customizable categories via select menus |
| **Full Lifecycle** | Open → Close → Reopen → Delete with full history |
| **User Management** | Add or remove users from any ticket |
| **Ticket Ratings** | 1–5 star rating system with optional feedback |
| **Transcripts** | HTML transcript export on ticket close |
| **Control Panel** | Per-ticket embedded control message |

### 📢 Welcome System *(New in v2.0)*
| Feature | Description |
|---|---|
| **Channel Welcome** | Send a rich embed when someone joins |
| **DM Welcome** | Optionally DM the new member |
| **Auto-Role** | Automatically assign a role on join |
| **Custom Message** | Fully customizable message with placeholders |
| **Embed Color** | Set a hex color per server |
| **Interactive Setup** | Configure everything via `/welcome` button panel |

### 🛠️ Admin & Settings
- Multi-panel support with separate categories per panel
- Role-based access control (staff roles + per-category support roles)
- Per-server prefix customization
- User blacklist system
- Detailed ticket logs (create, close, delete, add, remove, rate)
- Settings dashboard via `/settings`

### 🚀 Technical
- **SQLite** — embedded database, zero server setup, single `.db` file
- **Discord.js v14** with Components V2 (containers, text displays, separators)
- **ESM modules** — modern JavaScript throughout
- **Event-driven** architecture with modular command/event loaders
- **No native dependencies** — runs on any Node.js ≥ 18

---

## 🗂️ Project Structure

```
src/
├── commands/
│   ├── Admin/          # Blacklist, Prefix
│   ├── Help/           # Help command
│   ├── Panel/          # Panel management
│   ├── Settings/       # Settings dashboard, Welcome config
│   └── Ticket/         # Add, Close, Delete, Remove, Reopen
├── config/
│   ├── config.js       # Bot config & env vars
│   └── emoji.js        # Emoji map (Unicode + helpers)
├── database/
│   ├── Schema.js       # SQL CREATE TABLE definitions
│   └── Manager.js      # All database operations
├── events/
│   └── discord/
│       ├── clientReady.js
│       ├── guild/      # Slash, PrefixCmd, ChannelDelete, GuildMemberAdd
│       └── ticket/     # Create, Closed, Deleted, Added, Removed, Rated, Reopen
├── structures/
│   ├── classes/        # Bot, Command, Context, TicketUI
│   └── handlers/       # CommandHandler, EventLoader
└── utils/              # Logger, PermissionHandler, Utils
```

---

## 📦 Setup

### Prerequisites
- **Node.js v18+** — [Download](https://nodejs.org/)
- **A Discord Bot Token** — [Create one](https://discord.com/developers/applications)
- **Git** — [Download](https://git-scm.com/)

### Installation

**1. Clone the repo**
```bash
git clone https://github.com/KAJUKATLIii/ticket.git
cd ticket
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment**

Create a `.env` file in the project root:
```env
# ── Discord ──────────────────────────────
token=your_bot_token_here
PREFIX=.

# ── Database (optional, defaults to ./data/tickets.db) ──
DATABASE_PATH=./data/tickets.db

# ── Environment ──────────────────────────
NODE_ENV=production
```

**4. Start the bot**
```bash
npm start
```

The SQLite database file is created automatically at `./data/tickets.db` on first run. No external database setup needed.

---

## ⚙️ Environment Variables

| Variable | Description | Required | Default |
|---|---|---|---|
| `token` | Discord bot token | ✅ | — |
| `PREFIX` | Prefix for text commands | ❌ | `.` |
| `DATABASE_PATH` | Path to SQLite `.db` file | ❌ | `./data/tickets.db` |
| `NODE_ENV` | `production` or `development` | ❌ | `development` |

---

## 🎯 Commands

### 🎫 Ticket
| Command | Description |
|---|---|
| `/add <user>` | Add a user to the current ticket |
| `/close [reason]` | Close the current ticket |
| `/delete` | Delete a closed ticket |
| `/remove <user>` | Remove a user from the ticket |
| `/reopen` | Reopen a closed ticket |

### 🛠️ Admin / Settings
| Command | Description | Permission |
|---|---|---|
| `/panel` | Create & manage ticket panels | Manage Guild |
| `/settings` | Configure bot settings | Manage Guild |
| `/welcome` | Configure the welcome system | Manage Guild |
| `/help` | Show all commands | Everyone |

### 📢 Welcome Placeholders
Use these in your custom welcome message:

| Placeholder | Output |
|---|---|
| `{user}` | @mention of the new member |
| `{username}` | Username (e.g. `KAJUKATLI`) |
| `{displayname}` | Server display name |
| `{server}` | Server name |
| `{membercount}` | Current member count |
| `{id}` | User ID |

**Example:**
```
Welcome {user} to **{server}**! 🎉 You are our #{membercount} member.
```

---

## 🗄️ Database

TicketBot v2.0 uses **SQLite** via `sql.js` — a WebAssembly build with zero native compilation required.

| Table | Purpose |
|---|---|
| `guilds` | Per-server config (prefix, staff roles, welcome config) |
| `blacklisted_users` | Blacklisted user entries |
| `panels` | Ticket panels |
| `categories` | Panel categories |
| `tickets` | All tickets |
| `ticket_added_users` | Users added to tickets |
| `ticket_removed_users` | Users removed from tickets |

---

## 📜 Changelog

### v2.0.0 *(Current)*
- 🆕 **Welcome system** — channel message, DM, auto-role, custom message, embed color
- 🔄 **Database migration** — MongoDB/Mongoose → SQLite (no server required)
- 🎨 **Emoji overhaul** — all Unicode, no custom server emojis needed
- 🛡️ **Copyright updated** — © 2026 KAJUKATlii
- ⚡ **Performance** — WAL mode SQLite, prepared statements throughout

### v1.x
- Initial release with MongoDB backend
- Ticket creation, management, ratings, transcripts
- Panel system with multi-category support

---

## ⚠️ Important Notes

- **Keep your `.env` private** — never commit tokens to GitHub
- **Bot permissions needed:** `Send Messages`, `Manage Channels`, `Manage Roles`, `Read Message History`, `Embed Links`, `Attach Files`
- **Intents required:** `Guilds`, `Guild Members`, `Guild Messages`, `Message Content`

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first.

1. Fork the repo
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "feat: add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

<div align="center">

**Made with ❤️ by [KAJUKATLI](https://github.com/KAJUKATLIii)**

[🐛 Report Bug](https://github.com/KAJUKATLIii/ticket/issues) •
[💡 Request Feature](https://github.com/KAJUKATLIii/ticket/issues) •
[⭐ Star this repo](https://github.com/KAJUKATLIii/ticket)

© 2026 KAJUKATlii — MIT License

</div>
