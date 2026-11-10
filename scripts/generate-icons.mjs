import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

const BG_COLOR = '#1a1a2e';
const ACCENT_COLOR = '#e94560';
const GOLD_COLOR = '#ffd700';

function drawDungeonIcon(ctx, size) {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, size, size);

  const centerX = size / 2;
  const centerY = size / 2;
  const scale = size / 100;

  ctx.fillStyle = ACCENT_COLOR;
  ctx.strokeStyle = GOLD_COLOR;
  ctx.lineWidth = 2 * scale;

  const wallThickness = 8 * scale;
  const roomSize = 30 * scale;
  const corridorWidth = 12 * scale;

  ctx.beginPath();
  ctx.rect(centerX - roomSize, centerY - roomSize, roomSize * 2, roomSize * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = BG_COLOR;
  ctx.beginPath();
  ctx.rect(centerX - roomSize + wallThickness, centerY - roomSize + wallThickness, (roomSize - wallThickness) * 2, (roomSize - wallThickness) * 2);
  ctx.fill();

  ctx.fillStyle = ACCENT_COLOR;
  ctx.beginPath();
  ctx.rect(centerX - corridorWidth / 2, centerY - roomSize, corridorWidth, roomSize * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.rect(centerX - roomSize, centerY - corridorWidth / 2, roomSize * 2, corridorWidth);
  ctx.fill();

  const torchX = centerX - roomSize + 10 * scale;
  const torchY = centerY - roomSize + 10 * scale;
  ctx.fillStyle = GOLD_COLOR;
  ctx.beginPath();
  ctx.arc(torchX, torchY, 4 * scale, 0, Math.PI * 2);
  ctx.fill();

  const flameY = torchY - 8 * scale;
  const gradient = ctx.createRadialGradient(torchX, flameY, 0, torchX, flameY, 6 * scale);
  gradient.addColorStop(0, '#fff8dc');
  gradient.addColorStop(0.3, '#ffd700');
  gradient.addColorStop(0.6, '#ff8c00');
  gradient.addColorStop(1, '#ff4500');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(torchX, flameY, 4 * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

const sizes = {
  favicon: [16, 32, 48, 64],
  appleTouchIcon: 180,
  ogImage: 1200,
};

for (const size of sizes.favicon) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawDungeonIcon(ctx, size);
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(`public/favicon-${size}.png`, buffer);
}

const canvas16 = createCanvas(16, 16);
const ctx16 = canvas16.getContext('2d');
drawDungeonIcon(ctx16, 16);
const canvas32 = createCanvas(32, 32);
const ctx32 = canvas32.getContext('2d');
drawDungeonIcon(ctx32, 32);
const canvas48 = createCanvas(48, 48);
const ctx48 = canvas48.getContext('2d');
drawDungeonIcon(ctx48, 48);

const icoBuffer = Buffer.concat([
  Buffer.from([0, 0, 1, 0, 3, 0, 16, 16, 0, 0, 1, 0, 32, 0, 0, 0, 22, 0, 0, 0]),
  canvas16.toBuffer('image/png'),
  Buffer.from([0, 0, 1, 0, 3, 0, 16, 16, 0, 0, 1, 0, 32, 0, 0, 0, 22, 0, 0, 0]),
  canvas32.toBuffer('image/png'),
  Buffer.from([0, 0, 1, 0, 3, 0, 16, 16, 0, 0, 1, 0, 32, 0, 0, 0, 22, 0, 0, 0]),
  canvas48.toBuffer('image/png'),
]);
writeFileSync('public/favicon.ico', icoBuffer);

const appleCanvas = createCanvas(sizes.appleTouchIcon, sizes.appleTouchIcon);
const appleCtx = appleCanvas.getContext('2d');
drawDungeonIcon(appleCtx, sizes.appleTouchIcon);
writeFileSync('public/apple-touch-icon.png', appleCanvas.toBuffer('image/png'));

const ogCanvas = createCanvas(1200, 630);
const ogCtx = ogCanvas.getContext('2d');
ogCtx.fillStyle = BG_COLOR;
ogCtx.fillRect(0, 0, 1200, 630);

const titleX = 600;
const titleY = 280;
ogCtx.fillStyle = GOLD_COLOR;
ogCtx.font = 'bold 80px Arial';
ogCtx.textAlign = 'center';
ogCtx.textBaseline = 'middle';
ogCtx.fillText('DUNGEON DUDE', titleX, titleY);

ogCtx.fillStyle = ACCENT_COLOR;
ogCtx.font = '36px Arial';
ogCtx.fillText('An Isometric Dungeon Crawler', titleX, titleY + 70);

ogCtx.fillStyle = '#ffffff';
ogCtx.font = '24px Arial';
ogCtx.fillText('Built with React + Three.js + Rapier Physics', titleX, titleY + 130);

const iconSize = 120;
const iconX = 600 - iconSize / 2;
const iconY = 450;
drawDungeonIcon(ogCtx, iconSize);
ogCtx.drawImage(ogCanvas, iconX, iconY, iconSize, iconSize);

writeFileSync('public/og-image.png', ogCanvas.toBuffer('image/png'));

console.log('Generated: favicon.ico, apple-touch-icon.png, og-image.png, favicon-*.png');