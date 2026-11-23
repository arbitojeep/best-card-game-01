// The cards of Ember Duel. Every card has one job, a cost in ember, and a
// kind that decides its colour and its icon, so kinds are told apart by
// colour AND shape, never by text alone.
//
//   strike  red     deal damage
//   guard   blue    gain shield (absorbs damage until spent)
//   mend    green   heal life
//   kindle  purple  draw cards
export const KINDS = {
  strike: { color: '#e5484d', dark: '#8f1d20', label: 'STRIKE' },
  guard: { color: '#3e8ef7', dark: '#174a8f', label: 'GUARD' },
  mend: { color: '#46a758', dark: '#1f5c2e', label: 'MEND' },
  kindle: { color: '#8e4ec6', dark: '#4c2a6e', label: 'KINDLE' },
};

export const CARDS = [
  { id: 'spark', name: 'Spark', kind: 'strike', cost: 1, power: 2, text: 'Deal 2 damage.' },
  { id: 'flame', name: 'Flame Strike', kind: 'strike', cost: 2, power: 4, text: 'Deal 4 damage.' },
  { id: 'bolt', name: 'Ember Bolt', kind: 'strike', cost: 3, power: 6, text: 'Deal 6 damage.' },
  { id: 'ward', name: 'Ward', kind: 'guard', cost: 1, power: 4, text: 'Gain 4 shield.' },
  { id: 'bulwark', name: 'Bulwark', kind: 'guard', cost: 2, power: 7, text: 'Gain 7 shield.' },
  { id: 'mend', name: 'Mend', kind: 'mend', cost: 2, power: 4, text: 'Heal 4 life.' },
  { id: 'kindle', name: 'Kindle', kind: 'kindle', cost: 1, power: 2, text: 'Draw 2 cards.' },
];

const DECK_RECIPE = [
  ['spark', 5],
  ['flame', 4],
  ['bolt', 2],
  ['ward', 4],
  ['bulwark', 2],
  ['mend', 2],
  ['kindle', 3],
];

export function cardById(id) {
  return CARDS.find((c) => c.id === id);
}

// A fresh 22-card deck: new card objects, so playing one never mutates
// another copy of the same card.
export function buildDeck() {
  const deck = [];
  for (const [id, count] of DECK_RECIPE) {
    for (let i = 0; i < count; i++) deck.push({ ...cardById(id), uid: id + '-' + i });
  }
  return deck;
}
