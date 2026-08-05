/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { createCanvas, loadImage } from "@napi-rs/canvas";

/**
 * Generates a sleek dark-purple Leaderboard image card displaying top server members.
 */
export async function generateLeaderboardCard({ serverName, serverIconURL, topUsers }) {
  const canvasWidth = 950;
  const rowHeight = 65;
  const headerHeight = 120;
  const footerHeight = 40;
  const userCount = Math.max(topUsers.length, 1);
  const canvasHeight = headerHeight + userCount * rowHeight + footerHeight;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // 1. Background Gradient (Dark Purple Theme)
  const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  bgGradient.addColorStop(0, "#130d22");
  bgGradient.addColorStop(0.5, "#20153a");
  bgGradient.addColorStop(1, "#110a1f");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Ambient Glow Effects
  const glow1 = ctx.createRadialGradient(200, 100, 10, 200, 100, 300);
  glow1.addColorStop(0, "rgba(139, 92, 246, 0.3)");
  glow1.addColorStop(1, "rgba(139, 92, 246, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const glow2 = ctx.createRadialGradient(800, canvasHeight - 100, 10, 800, canvasHeight - 100, 300);
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

  // 2. Header Section
  ctx.textAlign = "left";

  // Server Icon (if available)
  if (serverIconURL) {
    try {
      const sIcon = await loadImage(serverIconURL);
      ctx.save();
      ctx.beginPath();
      ctx.arc(80, 70, 32, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(sIcon, 48, 38, 64, 64);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(80, 70, 33, 0, Math.PI * 2);
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } catch {
      // Fallback
    }
  }

  const textLeft = serverIconURL ? 130 : 50;

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px sans-serif";
  const titleText = `${serverName.toUpperCase()} LEADERBOARD`;
  const cleanTitle = titleText.length > 28 ? titleText.slice(0, 28) + "…" : titleText;
  ctx.fillText(`🏆 ${cleanTitle}`, textLeft, 65);

  ctx.fillStyle = "#a78bfa";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("TOP SERVER LEVEL & XP CHAMPIONS", textLeft, 92);

  // 3. User Rows
  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];
    const rankNum = i + 1;
    const rowY = headerHeight + i * rowHeight;
    const rowX = 40;
    const rowW = canvasWidth - 80;
    const rowH = 54;

    // Row Background Color
    let rowBg = "rgba(22, 16, 42, 0.7)";
    let rowStroke = "rgba(139, 92, 246, 0.18)";
    let rankColor = "#94a3b8";

    if (rankNum === 1) {
      rowBg = "rgba(79, 50, 16, 0.55)";
      rowStroke = "rgba(234, 179, 8, 0.55)";
      rankColor = "#facc15"; // Gold
    } else if (rankNum === 2) {
      rowBg = "rgba(45, 55, 72, 0.55)";
      rowStroke = "rgba(203, 213, 225, 0.5)";
      rankColor = "#e2e8f0"; // Silver
    } else if (rankNum === 3) {
      rowBg = "rgba(67, 36, 24, 0.55)";
      rowStroke = "rgba(217, 119, 6, 0.5)";
      rankColor = "#f97316"; // Bronze
    }

    roundRect(rowX, rowY, rowW, rowH, 14, rowBg, rowStroke);

    // Rank Badge
    ctx.textAlign = "center";
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = rankColor;
    const rankSymbol = rankNum === 1 ? "🥇" : rankNum === 2 ? "🥈" : rankNum === 3 ? "🥉" : `#${rankNum}`;
    ctx.fillText(rankSymbol, rowX + 35, rowY + 35);

    // User Avatar
    const avatarX = rowX + 70;
    const avatarY = rowY + 9;
    const avatarSize = 36;

    if (user.avatarURL) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      try {
        const uImg = await loadImage(user.avatarURL);
        ctx.drawImage(uImg, avatarX, avatarY, avatarSize, avatarSize);
      } catch {
        ctx.fillStyle = "#8b5cf6";
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
      }
      ctx.restore();

      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 1, 0, Math.PI * 2);
      ctx.strokeStyle = rankColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Username Text
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    const nameX = rowX + 120;
    const cleanName = user.username.length > 18 ? user.username.slice(0, 18) + "…" : user.username;
    ctx.fillText(cleanName, nameX, rowY + 34);

    // Stats Section (Right Aligned)
    // Level Badge
    const lvlX = rowX + rowW - 280;
    roundRect(lvlX, rowY + 13, 85, 28, 8, "rgba(168, 85, 247, 0.25)", "rgba(168, 85, 247, 0.4)");
    ctx.textAlign = "center";
    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`LVL ${user.level}`, lvlX + 42, rowY + 31);

    // XP Amount
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`${user.xp.toLocaleString()} XP`, rowX + rowW - 40, rowY + 34);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.fillText(`(${user.messages.toLocaleString()} msgs)`, rowX + rowW - 40, rowY + 48);
  }

  // Footer Tagline
  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  ctx.font = "12px sans-serif";
  ctx.fillText("Code by KAJUKATLI • Talk in chat to earn XP and rank up!", canvasWidth / 2, canvasHeight - 20);

  return canvas.toBuffer("image/png");
}

// bread leaderboard
