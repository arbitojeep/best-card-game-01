// Ash, the Ember Wisp: the opponent's brain. It reads the table and plays
// what a player would: hurt you when it can, patch itself up when it is
// bleeding, and hide behind a shield when you are about to hit hard.
//
// It returns the list of card uids it plays, in order, and never plays a
// card it cannot afford.
export function choosePlays(state) {
  const me = state.opponent;
  const you = state.player;
  const plays = [];
  let mana = me.mana;
  const hand = [...me.hand];

  // 1. Heal first when badly hurt and a mend is in hand.
  if (me.life <= 8) {
    const mend = hand.find((c) => c.kind === 'mend' && c.cost <= mana);
    if (mend) {
      plays.push(mend.uid);
      mana -= mend.cost;
      hand.splice(hand.indexOf(mend), 1);
    }
  }

  // 2. Shield up when your hand looks dangerous (you hold big strikes).
  const yourBiggest = Math.max(0, ...you.hand.filter((c) => c.kind === 'strike').map((c) => c.power));
  if (yourBiggest >= 6 && me.shield < 4) {
    const guard = hand.find((c) => c.kind === 'guard' && c.cost <= mana);
    if (guard) {
      plays.push(guard.uid);
      mana -= guard.cost;
      hand.splice(hand.indexOf(guard), 1);
    }
  }

  // 3. Spend the rest on damage, biggest hit first.
  const strikes = hand.filter((c) => c.kind === 'strike').sort((a, b) => b.power - a.power);
  for (const card of strikes) {
    if (card.cost <= mana) {
      plays.push(card.uid);
      mana -= card.cost;
    }
  }

  // 4. Kindle if mana is left and the hand is thin.
  const kindle = hand.find((c) => c.kind === 'kindle' && c.cost <= mana);
  if (kindle && hand.length <= 3) plays.push(kindle.uid);

  return plays;
}
