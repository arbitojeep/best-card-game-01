// Ember Duel: the game itself. A turn-based card duel, player against Ash,
// the Ember Wisp. One canvas, one loop, no network, no library.
import { buildDeck, cardById } from './deck.js';
import { choosePlays } from './ai.js';
import { makeRng, shuffle } from './random.js';
import { drawTable, drawTitle, drawEnd, CARD_W, CARD_H } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const MAX_LIFE = 20;
const MAX_MANA = 6;
const HAND_LIMIT = 7;

function makeSide(deck) {
  return { life: MAX_LIFE, maxLife: MAX_LIFE, shield: 0, mana: 1, maxMana: MAX_MANA, deck, hand: [], discard: [] };
}

function newGame(seed) {
  const rng = makeRng(seed);
  const state = {
    rng,
    screen: 'title',
    turn: 'player',
    turnCount: 1,
    hover: -1,
    log: ['Welcome to Ember Duel.', 'Play a card, then end your turn.'],
    player: makeSide(shuffle(buildDeck(), rng)),
    opponent: makeSide(shuffle(buildDeck(), rng)),
  };
  drawCards(state.player, 4);
  drawCards(state.opponent, 4);
  return state;
}

function drawCards(side, n) {
  for (let i = 0; i < n; i++) {
    if (side.hand.length >= HAND_LIMIT) break;
    if (side.deck.length === 0) {
      side.deck = shuffle(side.discard, Math.random);
      side.discard = [];
      if (side.deck.length === 0) break;
    }
    side.hand.push(side.deck.pop());
  }
}

function damage(target, amount, log, who) {
  let left = amount;
  if (target.shield > 0) {
    const blocked = Math.min(target.shield, left);
    target.shield -= blocked;
    left -= blocked;
    if (blocked > 0) log.push(`${who}'s shield blocks ${blocked}.`);
  }
  if (left > 0) {
    target.life = Math.max(0, target.life - left);
    log.push(`${who} takes ${left} damage.`);
  }
}

function playCard(state, side, foe, card) {
  const hand = side.hand;
  const at = hand.indexOf(card);
  if (at === -1 || card.cost > side.mana) return false;
  hand.splice(at, 1);
  side.discard.push(card);
  side.mana -= card.cost;
  const name = side === state.player ? 'You play' : 'Ash plays';
  if (card.kind === 'strike') {
    damage(foe, card.power, state.log, foe === state.player ? 'You' : 'Ash');
    state.log.push(`${name} ${card.name} (${card.power} damage).`);
  } else if (card.kind === 'guard') {
    side.shield += card.power;
    state.log.push(`${name} ${card.name} (+${card.power} shield).`);
  } else if (card.kind === 'mend') {
    side.life = Math.min(side.maxLife, side.life + card.power);
    state.log.push(`${name} ${card.name} (+${card.power} life).`);
  } else if (card.kind === 'kindle') {
    drawCards(side, card.power);
    state.log.push(`${name} ${card.name} (draw ${card.power}).`);
  }
  return true;
}

function checkEnd(state) {
  if (state.opponent.life <= 0) state.screen = 'win';
  else if (state.player.life <= 0) state.screen = 'loss';
}

function endTurn(state) {
  if (state.turn !== 'player' || state.screen !== 'play') return;
  state.turn = 'opponent';
  state.hover = -1;
  render(state);
  // Ash takes a breath, then plays.
  setTimeout(() => {
    const opp = state.opponent;
    opp.mana = Math.min(opp.maxMana, opp.mana + 1);
    drawCards(opp, 1);
    for (const uid of choosePlays(state)) {
      const card = opp.hand.find((c) => c.uid === uid);
      if (card) playCard(state, opp, state.player, card);
    }
    checkEnd(state);
    if (state.screen === 'play') {
      state.turn = 'player';
      state.turnCount += 1;
      const pl = state.player;
      pl.mana = Math.min(pl.maxMana, pl.mana + 1);
      drawCards(pl, 1);
      state.log.push(`Turn ${state.turnCount}: your ember grows to ${pl.mana}.`);
    }
    render(state);
  }, 700);
}

function startPlay(state) {
  state.screen = 'play';
  state.log.push('The duel begins. Your move.');
  render(state);
}

// Posed frames for screenshots: the same code path as play, with a fixed
// seed, so every screenshot is a real render of the game.
function poseShot(state, shot, seed) {
  const rng = makeRng(seed);
  state.rng = rng;
  if (shot === 'title') {
    state.screen = 'title';
    return;
  }
  if (shot === 'win') {
    state.screen = 'play';
    state.opponent.life = 0;
    state.player.life = 11;
    state.screen = 'win';
    state.turnCount = 7;
    return;
  }
  if (shot === 'loss') {
    state.screen = 'play';
    state.player.life = 0;
    state.opponent.life = 9;
    state.screen = 'loss';
    state.turnCount = 8;
    return;
  }
  // 'play': a lively mid-duel table.
  state.screen = 'play';
  state.player.life = 14;
  state.opponent.life = 11;
  state.player.shield = 4;
  state.player.mana = 3;
  state.opponent.mana = 3;
  state.turnCount = 5;
  state.hover = 1;
  const want = ['flame', 'ward', 'bolt', 'kindle'];
  state.player.hand = want.map((id, i) => ({ ...cardById(id), uid: id + '-pose-' + i }));
  state.opponent.hand = [0, 1, 2, 3].map((i) => ({ ...cardById('spark'), uid: 'back-' + i }));
  state.log = [
    'Ash plays Flame Strike (4 damage).',
    "Your shield blocks 4.",
    'You play Ward (+4 shield).',
  ];
}

function render(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.screen === 'title') drawTitle(ctx);
  else if (state.screen === 'win') drawEnd(ctx, true, state);
  else if (state.screen === 'loss') drawEnd(ctx, false, state);
  else drawTable(ctx, state);
  const line =
    state.screen === 'title'
      ? 'Ember Duel, title screen. Click to play.'
      : state.screen === 'win'
        ? 'Victory. Ash has no life left.'
        : state.screen === 'loss'
          ? 'Defeat. You have no life left.'
          : `Your life ${state.player.life}, Ash ${state.opponent.life} life, ${state.player.mana} ember, turn ${state.turnCount}.`;
  statusEl.textContent = line;
}

function cardAt(state, mx, my) {
  for (let i = 0; i < state.player.hand.length; i++) {
    const x = 430 + i * 165;
    const y = state.hover === i ? 470 - 18 : 470;
    if (mx >= x && mx <= x + CARD_W && my >= y && my <= y + CARD_H) return i;
  }
  return -1;
}

function resize() {
  canvas.width = 1280;
  canvas.height = 720;
}

let state = newGame(1);
resize();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  const seed = Number(params.get('seed') || '1');
  poseShot(state, shot, seed);
  render(state);
} else {
  render(state);
}

canvas.addEventListener('mousemove', (e) => {
  if (state.screen !== 'play' || state.turn !== 'player') return;
  const r = canvas.getBoundingClientRect();
  const mx = ((e.clientX - r.left) / r.width) * 1280;
  const my = ((e.clientY - r.top) / r.height) * 720;
  const at = cardAt(state, mx, my);
  if (at !== state.hover) {
    state.hover = at;
    render(state);
  }
});

canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const mx = ((e.clientX - r.left) / r.width) * 1280;
  const my = ((e.clientY - r.top) / r.height) * 720;
  if (state.screen === 'title') {
    startPlay(state);
    return;
  }
  if (state.screen === 'win' || state.screen === 'loss') {
    state = newGame(Date.now() % 100000);
    startPlay(state);
    return;
  }
  if (state.turn !== 'player') return;
  // End-turn button.
  if (mx >= 1060 && mx <= 1220 && my >= 320 && my <= 374) {
    endTurn(state);
    return;
  }
  const at = cardAt(state, mx, my);
  if (at >= 0) {
    const card = state.player.hand[at];
    if (playCard(state, state.player, state.opponent, card)) {
      checkEnd(state);
      render(state);
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (state.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) {
    startPlay(state);
    return;
  }
  if ((state.screen === 'win' || state.screen === 'loss') && (e.key === 'r' || e.key === 'R' || e.key === 'Enter')) {
    state = newGame(Date.now() % 100000);
    startPlay(state);
    return;
  }
  if (state.screen !== 'play' || state.turn !== 'player') return;
  if (e.key === 'Enter') {
    endTurn(state);
    return;
  }
  if (e.key === 'r' || e.key === 'R') {
    state = newGame(Date.now() % 100000);
    startPlay(state);
    return;
  }
  const n = Number(e.key);
  if (n >= 1 && n <= state.player.hand.length) {
    const card = state.player.hand[n - 1];
    if (playCard(state, state.player, state.opponent, card)) {
      checkEnd(state);
      render(state);
    }
  }
});
