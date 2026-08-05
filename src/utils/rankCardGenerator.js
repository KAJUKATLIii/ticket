/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { createCanvas, loadImage } from "@napi-rs/canvas";

/**
 * Generates a sleek dark-purple glassmorphic rank card image.
 */
export async function generateRankCard({
  username,
  avatarURL,
  level,
  xp,
  requiredXP,
  rank,
  serverName,
}) {
  const canvasWidth = 900;
  const canvasHeight = 360;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // 1. Background - Dark Purple Gradient
  const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  bgGradient.addColorStop(0, "#140e24");
  bgGradient.addColorStop(0.5, "#22173d");
  bgGradient.addColorStop(1, "#120a20");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Ambient Glows
  const glow1 = ctx.createRadialGradient(150, 80, 10, 150, 80, 260);
  glow1.addColorStop(0, "rgba(139, 92, 246, 0.28)");
  glow1.addColorStop(1, "rgba(139, 92, 246, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const glow2 = ctx.createRadialGradient(780, 280, 10, 780, 280, 260);
  glow2.addColorStop(0, "rgba(192, 132, 252, 0.22)");
  glow2.addColorStop(1, "rgba(192, 132, 252, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Helper for rounded rectangles
  function roundRect(x, y, w, h, radius, fillStyle, strokeStyle) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Outer Glass Container
  roundRect(20, 20, canvasWidth - 40, canvasHeight - 40, 24, "rgba(35, 25, 62, 0.65)", "rgba(139, 92, 246, 0.35)");

  // 2. Avatar Drawing (Circular)
  const avatarX = 50;
  const avatarY = 45;
  const avatarSize = 82;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  try {
    const avatarImg = await loadImage(avatarURL);
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  } catch {
    ctx.fillStyle = "#8b5cf6";
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
  }
  ctx.restore();

  // Avatar Ring
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 3;
  ctx.stroke();

  // 3. User Info Header
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px sans-serif";
  const cleanUsername = username.length > 18 ? username.slice(0, 18) + "…" : username;
  ctx.fillText(cleanUsername, 150, 80);

  ctx.fillStyle = "#a78bfa";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText(`#${serverName.toUpperCase()}`, 150, 108);

  // Level Badge top right
  ctx.textAlign = "right";
  ctx.fillStyle = "#c084fc";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(`LEVEL ${level}`, canvasWidth - 50, 80);

  // 4. Stats Box (Inner Rounded Glass Card)
  const boxX = 45;
  const boxY = 145;
  const boxW = canvasWidth - 90;
  const boxH = 105;

  roundRect(boxX, boxY, boxW, boxH, 18, "rgba(19, 14, 36, 0.75)", "rgba(139, 92, 246, 0.25)");

  const colWidth = boxW / 3;

  // Column 1: Server Rank
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText(`#${rank}`, boxX + colWidth * 0.5, boxY + 48);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px sans-serif";
  ctx.fillText("Server Rank", boxX + colWidth * 0.5, boxY + 80);

  // Column 2: Level
  ctx.fillStyle = "#c084fc";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText(`${level}`, boxX + colWidth * 1.5, boxY + 48);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px sans-serif";
  ctx.fillText("Current Level", boxX + colWidth * 1.5, boxY + 80);

  // Column 3: Total XP
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px sans-serif";
  ctx.fillText(`${xp.toLocaleString()}`, boxX + colWidth * 2.5, boxY + 48);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px sans-serif";
  ctx.fillText("Total XP", boxX + colWidth * 2.5, boxY + 80);

  // 5. XP Progress Bar
  const barX = 45;
  const barY = 278;
  const barW = canvasWidth - 90;
  const barH = 16;
  const progressRatio = requiredXP > 0 ? Math.min(Math.max(xp / requiredXP, 0), 1) : 1;
  const progressW = Math.max(progressRatio * barW, 14);

  // Track Background
  roundRect(barX, barY, barW, barH, 8, "rgba(28, 20, 48, 0.9)", null);

  // Progress Bar Gradient
  const barGradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  barGradient.addColorStop(0, "#6d28d9");
  barGradient.addColorStop(0.5, "#9333ea");
  barGradient.addColorStop(1, "#c084fc");

  roundRect(barX, barY, progressW, barH, 8, barGradient, null);

  // Progress Bar Label Right
  ctx.textAlign = "right";
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "13px sans-serif";
  ctx.fillText(`${xp.toLocaleString()} / ${requiredXP.toLocaleString()} XP`, canvasWidth - 45, 314);

  return canvas.toBuffer("image/png");
}

// bread card
