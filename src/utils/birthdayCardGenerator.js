/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { createCanvas, loadImage } from "@napi-rs/canvas";

/**
 * Generates a festive dark-purple & gold Birthday celebration image card.
 */
export async function generateBirthdayCard({ username, avatarURL, serverName, age }) {
  const canvasWidth = 900;
  const canvasHeight = 420;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // 1. Festive Background - Dark Purple & Violet Gradient
  const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  bgGradient.addColorStop(0, "#160c2b");
  bgGradient.addColorStop(0.5, "#2e1654");
  bgGradient.addColorStop(1, "#140a26");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Festive Radial Glows
  const glow1 = ctx.createRadialGradient(200, 120, 10, 200, 120, 280);
  glow1.addColorStop(0, "rgba(234, 179, 8, 0.35)"); // Gold Glow
  glow1.addColorStop(1, "rgba(234, 179, 8, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const glow2 = ctx.createRadialGradient(720, 300, 10, 720, 300, 280);
  glow2.addColorStop(0, "rgba(192, 132, 252, 0.25)");
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
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Outer Glass Container
  roundRect(20, 20, canvasWidth - 40, canvasHeight - 40, 24, "rgba(42, 24, 76, 0.65)", "rgba(234, 179, 8, 0.45)");

  // 2. Birthday Banner Header
  ctx.textAlign = "center";

  // Gold Birthday Title Text
  const titleGradient = ctx.createLinearGradient(0, 50, 0, 100);
  titleGradient.addColorStop(0, "#fef08a");
  titleGradient.addColorStop(0.5, "#facc15");
  titleGradient.addColorStop(1, "#eab308");

  ctx.fillStyle = titleGradient;
  ctx.font = "bold 38px sans-serif";
  ctx.fillText("🎉 HAPPY BIRTHDAY! 🎂", canvasWidth / 2, 85);

  ctx.fillStyle = "#a78bfa";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText(`CELEBRATING WITH #${serverName.toUpperCase()}`, canvasWidth / 2, 115);

  // 3. User Avatar Drawing (Circular)
  const avatarX = canvasWidth / 2 - 50;
  const avatarY = 145;
  const avatarSize = 100;

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

  // Glowing Gold Ring Around Avatar
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // 4. User Name & Wishes
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px sans-serif";
  const cleanName = username.length > 20 ? username.slice(0, 20) + "…" : username;
  ctx.fillText(cleanName, canvasWidth / 2, 285);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "16px sans-serif";
  const wishText = age
    ? `Turning ${age} years old today! Wishing you an unforgettable day! 🎁`
    : `Wishing you a fantastic day filled with joy, laughter, and success! 🎁`;
  ctx.fillText(wishText, canvasWidth / 2, 318);

  // 5. Footer Badge
  roundRect(canvasWidth / 2 - 140, 345, 280, 32, 12, "rgba(234, 179, 8, 0.2)", "rgba(234, 179, 8, 0.5)");
  ctx.fillStyle = "#fef08a";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("🎈 TODAY IS YOUR SPECIAL DAY! 🎈", canvasWidth / 2, 366);

  return canvas.toBuffer("image/png");
}

// bread birthday
