// All drawing for Ember Duel: one canvas, flat colours, big readable cards.
// Nothing here knows the rules; it only paints the state main.js hands it.
import { KINDS } from './deck.js';

const W = 1280;
const H = 720;

export const CARD_W = 150;
export const CARD_H = 210;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// A small vector icon per kind, so kinds differ by shape as well as colour.
function drawIcon(ctx, kind, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = s * 0.14;
  ctx.lineJoin = 'round';
  if (kind === 'strike') {
    // A sword: blade up, guard across, hilt below.
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.lineTo(s * 0.16, s * 0.1);
    ctx.lineTo(0, s * 0.28);
    ctx.lineTo(-s * 0.16, s * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.34, s * 0.32);
    ctx.lineTo(s * 0.34, s * 0.32);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, s * 0.36);
    ctx.lineTo(0, s * 0.55);
    ctx.stroke();
  } else if (kind === 'guard') {
    // A shield.
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.lineTo(s * 0.42, -s * 0.3);
    ctx.lineTo(s * 0.42, s * 0.05);
    ctx.quadraticCurveTo(s * 0.42, s * 0.42, 0, s * 0.55);
    ctx.quadraticCurveTo(-s * 0.42, s * 0.42, -s * 0.42, s * 0.05);
    ctx.lineTo(-s * 0.42, -s * 0.3);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'mend') {
    // A plus: healing.
    ctx.fillRect(-s * 0.14, -s * 0.5, s * 0.28, s * 1.0);
    ctx.fillRect(-s * 0.5, -s * 0.14, s * 1.0, s * 0.28);
  } else {
    // Kindle: three stacked cards fanning out.
    ctx.save();
    ctx.rotate(-0.35);
    ctx.strokeRect(-s * 0.42, -s * 0.3, s * 0.6, s * 0.8);
    ctx.restore();
    ctx.save();
    ctx.rotate(0.35);
    ctx.strokeRect(-s * 0.18, -s * 0.3, s * 0.6, s * 0.8);
    ctx.restore();
    ctx.fillRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.8);
  }
  ctx.restore();
}

export function drawCard(ctx, card, x, y, opts = {}) {
  const kind = KINDS[card.kind];
  const raised = opts.raised ? -18 : 0;
  const dim = opts.dim || false;
  ctx.save();
  ctx.globalAlpha = dim ? 0.45 : 1;
  ctx.translate(x, y + raised);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, 4, 6, CARD_W, CARD_H, 12);
  ctx.fill();
  // Face.
  ctx.fillStyle = '#f7f2e7';
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 12);
  ctx.fill();
  ctx.strokeStyle = kind.dark;
  ctx.lineWidth = 4;
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 12);
  ctx.stroke();
  // Cost pip, top left.
  ctx.fillStyle = kind.color;
  ctx.beginPath();
  ctx.arc(26, 26, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(card.cost), 26, 27);
  // Kind label, top right.
  ctx.fillStyle = kind.dark;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(kind.label, CARD_W - 12, 24);
  // Icon medallion.
  ctx.fillStyle = kind.color;
  ctx.beginPath();
  ctx.arc(CARD_W / 2, 92, 40, 0, Math.PI * 2);
  ctx.fill();
  drawIcon(ctx, card.kind, CARD_W / 2, 92, 34);
  // Power, big and centred.
  ctx.fillStyle = '#201a15';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(card.power), CARD_W / 2, 168);
  // Name and rules text.
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(card.name, CARD_W / 2, 132);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#4a4238';
  ctx.fillText(card.text, CARD_W / 2, 192);
  ctx.restore();
}

export function drawCardBack(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, 4, 6, CARD_W, CARD_H, 12);
  ctx.fill();
  ctx.fillStyle = '#5b3a8c';
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 12);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 3;
  roundRect(ctx, 8, 8, CARD_W - 16, CARD_H - 16, 8);
  ctx.stroke();
  ctx.fillStyle = '#c9a86a';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', CARD_W / 2, CARD_H / 2);
  ctx.restore();
}

function lifeBar(ctx, x, y, w, life, maxLife, shield, label, alignRight) {
  ctx.save();
  ctx.font = 'bold 20px sans-serif';
  ctx.textBaseline = 'middle';
  const labelX = alignRight ? x + w : x;
  ctx.textAlign = alignRight ? 'right' : 'left';
  ctx.fillStyle = '#f7f2e7';
  ctx.fillText(label, labelX, y - 16);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, x, y, w, 22, 11);
  ctx.fill();
  const frac = Math.max(0, life / maxLife);
  ctx.fillStyle = life <= 6 ? '#e5484d' : '#46a758';
  if (frac > 0) {
    roundRect(ctx, x, y, Math.max(22, w * frac), 22, 11);
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${life} / ${maxLife}`, x + w / 2, y + 11);
  if (shield > 0) {
    ctx.fillStyle = '#3e8ef7';
    ctx.beginPath();
    ctx.arc(x + w + 26, y + 11, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(String(shield), x + w + 26, y + 12);
    ctx.fillStyle = '#cfe4ff';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('shield', x + w + 48, y + 11);
  }
  ctx.restore();
}

function manaPips(ctx, x, y, mana, maxMana) {
  ctx.save();
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#f7f2e7';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('EMBER', x, y);
  for (let i = 0; i < maxMana; i++) {
    ctx.beginPath();
    ctx.arc(x + 78 + i * 26, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < mana ? '#ffb224' : 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.strokeStyle = '#8a5a00';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTable(ctx, state) {
  // Felt table.
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#1d4d33');
  grad.addColorStop(1, '#123524');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(201,168,106,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, 600, 300, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Opponent (top): face-down hand, life bar, name.
  const opp = state.opponent;
  for (let i = 0; i < opp.hand.length; i++) {
    drawCardBack(ctx, 470 + i * 80, 24);
  }
  lifeBar(ctx, 60, 60, 300, opp.life, opp.maxLife, opp.shield, 'ASH, THE EMBER WISP', false);
  ctx.fillStyle = '#c9a86a';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Deck ${opp.deck.length}  •  Hand ${opp.hand.length}`, 60, 104);

  // Centre: the log and the end-turn button.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, 380, 300, 520, 92, 10);
  ctx.fill();
  ctx.fillStyle = '#f7f2e7';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const log = state.log.slice(-3);
  log.forEach((line, i) => ctx.fillText(line, 640, 322 + i * 26));

  ctx.fillStyle = state.turn === 'player' ? '#c9a86a' : '#6b6455';
  roundRect(ctx, 1060, 320, 160, 54, 10);
  ctx.fill();
  ctx.fillStyle = state.turn === 'player' ? '#201a15' : '#d8d2c2';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('END TURN', 1140, 348);
  ctx.fillStyle = '#c9a86a';
  ctx.font = '13px sans-serif';
  ctx.fillText('or press Enter', 1140, 392);

  // Player (bottom): life, mana, hand.
  const pl = state.player;
  lifeBar(ctx, 60, 668, 300, pl.life, pl.maxLife, pl.shield, 'YOU', false);
  manaPips(ctx, 60, 632, pl.mana, pl.maxMana);
  ctx.fillStyle = '#c9a86a';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Deck ${pl.deck.length}  •  Hand ${pl.hand.length}   —   Click a card to play it  •  1-4 select  •  R restart`, 640, 424);

  pl.hand.forEach((card, i) => {
    const x = 430 + i * 165;
    const y = 470;
    drawCard(ctx, card, x, y, {
      raised: state.hover === i,
      dim: card.cost > pl.mana || state.turn !== 'player',
    });
  });

  if (state.turn !== 'player') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f7f2e7';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ash is thinking…', W / 2, 300);
  }
}

export function drawTitle(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#241a33');
  grad.addColorStop(1, '#0f0a1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // Ember glow.
  ctx.fillStyle = 'rgba(255,178,36,0.16)';
  ctx.beginPath();
  ctx.arc(640, 300, 260, 0, Math.PI * 2);
  ctx.fill();
  drawIcon(ctx, 'strike', 640, 200, 90);
  ctx.fillStyle = '#f7f2e7';
  ctx.font = 'bold 84px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EMBER DUEL', 640, 330);
  ctx.fillStyle = '#c9a86a';
  ctx.font = '26px sans-serif';
  ctx.fillText('A duel of cunning cards against Ash, the Ember Wisp', 640, 390);
  ctx.fillStyle = '#f7f2e7';
  ctx.font = '20px sans-serif';
  ctx.fillText('Outwit the wisp: spend ember, play your hand, bring its life to zero.', 640, 428);
  ctx.fillStyle = '#c9a86a';
  roundRect(ctx, 520, 480, 240, 64, 12);
  ctx.fill();
  ctx.fillStyle = '#201a15';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('CLICK TO PLAY', 640, 513);
  ctx.fillStyle = '#8f8a7d';
  ctx.font = '16px sans-serif';
  ctx.fillText('Keyboard: 1-4 play a card  •  Enter ends your turn  •  R restarts', 640, 580);
  ctx.fillText('First to zero life loses. Shield absorbs damage. Kindle draws cards.', 640, 608);
}

export function drawEnd(ctx, won, state) {
  ctx.fillStyle = won ? 'rgba(20,40,20,0.88)' : 'rgba(40,14,14,0.88)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = won ? '#ffd166' : '#e5484d';
  ctx.font = 'bold 76px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', 640, 300);
  ctx.fillStyle = '#f7f2e7';
  ctx.font = '24px sans-serif';
  ctx.fillText(
    won
      ? 'The wisp’s last ember gutters out. You win the duel!'
      : 'Ash’s embers burn bright. The wisp wins this duel.',
    640, 372,
  );
  ctx.font = '20px sans-serif';
  ctx.fillText(`You ${state.player.life} life  •  Ash ${state.opponent.life} life  •  ${state.turnCount} turns`, 640, 414);
  ctx.fillStyle = '#c9a86a';
  roundRect(ctx, 520, 470, 240, 64, 12);
  ctx.fill();
  ctx.fillStyle = '#201a15';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('PLAY AGAIN', 640, 503);
  ctx.fillStyle = '#8f8a7d';
  ctx.font = '16px sans-serif';
  ctx.fillText('Click or press R to deal a new hand', 640, 570);
}
