<div align="center">

![TicketBot Banner](https://raw.githubusercontent.com/KAJUKATLIii/ticket/main/assets/banner.png)

<p>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=for-the-badge&logo=JavaScript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/discord.js-5865F2.svg?style=for-the-badge&logo=discorddotjs&logoColor=white" alt="discord.js"/>
  <img src="https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/SQLite-003B57.svg?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
  <img src="https://img.shields.io/badge/Canvas-8B5CF6.svg?style=for-the-badge&logo=canvas&logoColor=white" alt="Canvas"/>
</p>

<p>
  <img src="https://img.shields.io/github/stars/KAJUKATLIii/ticket?style=for-the-badge&color=gold" alt="Stars"/>
  <img src="https://img.shields.io/github/forks/KAJUKATLIii/ticket?style=for-the-badge&color=blue" alt="Forks"/>
  <img src="https://img.shields.io/github/issues/KAJUKATLIii/ticket?style=for-the-badge&color=red" alt="Issues"/>
  <img src="https://img.shields.io/badge/version-2.0.0-blueviolet?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License"/>
</p>

# 🎫 TicketBot

**A multi-functional, zero-dependency Discord ticket, leveling, birthday, suggestions, feedback, polls, and welcome management bot.**  
Built with Discord.js v14, `@napi-rs/canvas` Image Rendering, and high-performance WAL SQLite — no MongoDB, no external cloud required.

*Default Activity Status:* `Watching HELPING AAYUSH IS INSANE AND BANDHILKI SMP`

</div>

---

## ✨ System Features Overview

- 🎫 **Multi-Category Ticket System** — Custom dropdown panels, user add/remove, ratings, HTML transcripts, and auto-delete.
- 🎨 **Dynamic Canvas Image Cards** — Beautiful dark-purple glassmorphic Canvas Rank Cards (`/rank`), Server Leaderboard Cards (`/leaderboard`), and Festive Birthday Cards (`/birthday`).
- 🎂 **Canvas Birthday Celebration System** — Custom Canvas Birthday Cards, channel announcements, temporary 24-hour `@Birthday` role rewards, and automated checker.
- 📊 **Custom Level Progression** — Max level cap (e.g. Level 50), XP requirement multipliers, server XP rates, and dedicated XP channel restrictions.
- 💡 **Suggestions System** — Interactive voting buttons, live embed updates (Accepted/Denied/Considered), and auto-deleting trigger messages.
- ⭐ **Feedback & Star Reviews** — 1 to 5 star rating reviews, statistics breakdown, and dedicated review channel.
- 📊 **Interactive Poll System** — Up to 5 custom options with real-time voting buttons and visual percentage progress bars `[██████░░] 75%`.
- 📢 **Rich Welcome & Goodbye System** — Embed vs Normal Text toggle, dynamic placeholders, auto-role, and interactive live test preview.
- 🎨 **Interactive Embed Designer** — Modal-driven custom embed builder.

---

## 📚 Command Directory (Category-Wise)

All commands support both **Slash (`/`)** and **Prefix (`.`)** invocation.

### 🎫 1. Ticket System Commands
| Command | Usage | Description | Permission |
|---|---|---|---|
| `/panel` | `/panel` | Setup interactive ticket panels & category dropdown select menus | Manage Guild |
| `/add` | `/add <@user>` | Add a member to the current ticket channel | Ticket Staff |
| `/remove` | `/remove <@user>` | Remove a member from the ticket channel | Ticket Staff |
| `/close` | `/close [reason]` | Close ticket with confirmation & HTML transcript export | Ticket Staff / Owner |
| `/reopen` | `/reopen` | Reopen a closed ticket channel | Ticket Staff |
| `/delete` | `/delete` | Delete a closed ticket channel & save transcript | Ticket Staff |

---

### 🎂 2. Birthday Celebration Commands
| Command | Usage | Description | Permission |
|---|---|---|---|
| `/birthday set` | `/birthday set month:<1-12> day:<1-31> [year]` | Register your birth date | Everyone |
| `/birthday view` | `/birthday view [@user]` | View your or another member's birth date | Everyone |
| `/birthday list` | `/birthday list` | View upcoming server birthdays | Everyone |
| `/birthday remove` | `/birthday remove` | Delete your saved birthday date | Everyone |
| `/birthdayadmin setup` | `/birthdayadmin setup channel:<#ch> [role:<@role>]` | Configure birthday announcement channel and role reward | Manage Guild |
| `/birthdayadmin test` | `/birthdayadmin test user:<@user>` | Send a test Canvas Birthday Card & role assignment preview | Manage Guild |
| `/birthdayadmin config` | `/birthdayadmin config` | View current birthday system configuration | Manage Guild |

---

### 📊 3. Leveling & XP Commands
| Command | Usage | Description | Permission |
|---|---|---|---|
| `/rank` | `/rank [@user]` | Display dynamic Canvas Rank Card PNG image, level, and XP bar | Everyone |
| `/leaderboard` | `/leaderboard` (`.top`, `.lb`) | Render top 10 Canvas Leaderboard PNG image with medals | Everyone |
| `/leveladmin addxp` | `/leveladmin addxp <@user> <amount>` | Grant bonus XP to a user | Manage Guild |
| `/leveladmin addrole` | `/leveladmin addrole <level> <@role>` | Set auto-role reward for reaching a specific level | Manage Guild |
| `/leveladmin setchannel` | `/leveladmin setchannel [channel] [toggle]` | Set level-up announcement channel or toggle messages on/off | Manage Guild |
| `/leveladmin setxpchannel` | `/leveladmin setxpchannel [channel] [mode]` | Restrict XP earning to a specific channel (or allow all) | Manage Guild |
| `/leveladmin setprogression` | `/leveladmin setprogression [maxlevel] [xprate]` | Custom level cap (e.g. Level 50), XP requirement, & XP boost rate | Manage Guild |
| `/leveladmin roles` | `/leveladmin roles` | View all configured level role rewards | Manage Guild |
| `/leveladmin reset` | `/leveladmin reset` | Reset all leveling data for the server | Manage Guild |

---

### 💡 4. Suggestions Commands
| Command | Usage | Description | Permission |
|---|---|---|---|
| `/suggest` | `/suggest <suggestion text>` | Submit a new suggestion with interactive voting buttons | Everyone |
| `/suggest-manage setup` | `/suggest-manage setup <#channel>` | Set the dedicated suggestions channel | Manage Guild |
| `/suggest-manage accept` | `/suggest-manage accept <id> [reason]` | Approve suggestion (Green status & updates embed live) | Manage Guild |
| `/suggest-manage deny` | `/suggest-manage deny <id> [reason]` | Deny suggestion (Red status & updates embed live) | Manage Guild |
| `/suggest-manage consider` | `/suggest-manage consider <id> [reason]` | Mark suggestion under consideration (Yellow status) | Manage Guild |

---

### ⭐ 5. Feedback & Reviews Commands
| Command | Usage | Description | Permission |
|---|---|---|---|
| `/feedback` | `/feedback <1-5 stars> <message>` | Submit a server/staff review with star rating (`/review`) | Everyone |
| `/feedback-manage setup` | `/feedback-manage setup <#channel>` | Set dedicated feedback/reviews channel | Manage Guild |
| `/feedback-manage stats` | `/feedback-manage stats` | View overall rating score & 1⭐–5⭐ distribution breakdown | Manage Guild |

---

### 📊 6. Poll Commands
| Command | Usage | Description | Permission |
|---|---|---|---|
| `/poll` | `/poll <question> <option1> <option2> ...` | Create an interactive poll with up to 5 options & real-time progress bars | Manage Messages |

---

### 👋 7. Welcome System Commands
| Command | Usage | Description | Permission |
|---|---|---|---|
| `/welcome channel` | `/welcome channel <#channel>` | Set welcome announcement channel | Manage Guild |
| `/welcome message` | `/welcome message <text>` | Set custom welcome message text with placeholders | Manage Guild |
| `/welcome mode` | `/welcome mode <embed\|normal>` | Toggle between Rich Embed Mode and Normal Text Mode | Manage Guild |
| `/welcome test` | `/welcome test` | Send an interactive test preview to verify your setup | Manage Guild |

---

### 🎨 8. Embed Builder Commands
| Command | Usage | Description | Permission |
|---|---|---|---|
| `/embed` | `/embed [#channel]` | Interactive custom rich embed builder with title, description & color | Manage Messages |

---

### ⚙️ 9. Admin & Server Settings Commands
| Command | Usage | Description | Permission |
|---|---|---|---|
| `/setprefix` | `/setprefix <prefix>` | Set custom server prefix (e.g. `!`, `.`, `?`) | Manage Guild |
| `/blacklist` | `/blacklist <add\|remove\|list> <@user>` | Blacklist a user from creating tickets or using bot | Manage Guild |
| `/staffrole` | `/staffrole <add\|remove\|list> <@role>` | Manage staff roles for ticket management | Manage Guild |
| `/help` | `/help` | Show interactive category-wise command directory | Everyone |

---

## 📢 Welcome Placeholders Matrix

Use these in your custom welcome and goodbye messages:

| Placeholder | Output | Example |
|---|---|---|
| `{user}` | @mention of the member | `@KAJUKATLI` |
| `{username}` | Username | `kajukatli` |
| `{displayname}` | Server display name | `KAJUKATLI ⚡` |
| `{server}` | Server name | `Insane Community` |
| `{membercount}` | Current member count | `1,250` |
| `{id}` | User Discord ID | `931059762173464597` |

**Example Usage:**
```text
Welcome {user} to **{server}**! 🎉 You are our #{membercount} member. Read the rules and enjoy your stay!
```

---

## 🗂️ Project Structure

```
src/
├── commands/
│   ├── Admin/          # Blacklist, Prefix, Embed
│   ├── Birthday/       # Birthday, BirthdayAdmin
│   ├── Feedback/       # Feedback, FeedbackAdmin
│   ├── Help/           # Help command
│   ├── Leveling/       # Rank, Leaderboard, LevelAdmin
│   ├── Panel/          # Panel management
│   ├── Poll/           # Poll
│   ├── Settings/       # Settings dashboard
│   ├── Suggestions/    # Suggest, SuggestAdmin
│   ├── Ticket/         # Add, Close, Delete, Remove, Reopen
│   └── Welcome/        # Welcome config (/welcome)
├── config/
│   ├── config.js       # Bot config & env vars
│   └── emoji.js        # Emoji map (Unicode + helpers)
├── database/
│   ├── Schema.js       # SQL CREATE TABLE definitions & Auto-Migrations
│   └── Manager.js      # All database operations
├── events/
│   └── discord/
│       ├── clientReady.js  # Startup, slash loader & birthday checker
│       ├── ready.js        # Bot presence activity handler
│       ├── guild/          # Slash, PrefixCmd, GuildMemberAdd, GuildMemberRemove, MessageXP, SuggestionVotes, PollVotes
│       └── ticket/         # Create, Closed, Deleted, Added, Removed, Rated, Reopen
├── structures/
│   ├── classes/        # Bot, Command, Context, TicketUI
│   └── handlers/       # CommandHandler, EventLoader
└── utils/              # Logger, PermissionHandler, rankCardGenerator, leaderboardCardGenerator, birthdayCardGenerator, birthdayChecker
```

---

## 📦 Setup & Installation

### Prerequisites
- **Node.js v18+** — [Download](https://nodejs.org/)
- **Git** — [Download](https://git-scm.com/)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KAJUKATLIii/ticket.git
   cd ticket
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (.env):**
   ```env
   token=YOUR_BOT_TOKEN_HERE
   PREFIX=.
   DATABASE_PATH=./data/tickets.db
   NODE_ENV=production
   ```

4. **Start the Bot:**
   ```bash
   npm start
   ```

---

<div align="center">

**Made with ❤️ by [KAJUKATLI](https://github.com/KAJUKATLIii)**

© 2026 KAJUKATlii — MIT License

</div>
