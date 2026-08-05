/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import dotenv from "dotenv";
dotenv.config();


export const config = {
  token:
    process.env.token ||
    "yourtokenhere",

  clientId: "botclientidhere",
  prefix: process.env.PREFIX || ".",


  environment: process.env.NODE_ENV || "development",
  database: {
    path: process.env.DATABASE_PATH || "./data/tickets.db",
  },
  debug: true,
  
  links: {
    supportServer: "https://discord.gg/ayushisinsane",
    github: "https://github.com/KAJUKATLiii",
    invite:
      "https://discord.com/api/oauth2/authorize?client_id624000&permissions=8&scope=bot",
  },

  watermark: "coded by bre4d",
  version: "2.0.0",
};

// bread signature
