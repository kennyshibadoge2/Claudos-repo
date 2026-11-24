'use strict';
/* =========================================================
   Shiba Days — data: breeds, coats, items, tricks, NPCs
   ========================================================= */
G.BREEDS = {
  shiba: { species: 'dog', name: 'Shiba Inu', legL: 0.12, legW: 0.047, body: [0.17, 0.165, 0.27], headR: 0.165, earH: 0.125, earR: 0.062, ear: 'prick', snout: 1, tail: 'curl', voice: 1.25, cheek: 1.12 },
  mame: { species: 'dog', name: 'Mame Shiba', legL: 0.11, legW: 0.044, body: [0.155, 0.15, 0.24], headR: 0.165, earH: 0.12, earR: 0.06, ear: 'prick', snout: 0.9, tail: 'curl', voice: 1.45, scale: 0.86, cheek: 1.15 },
  corgi: { species: 'dog', name: 'Corgi', legL: 0.065, legW: 0.05, body: [0.17, 0.155, 0.31], headR: 0.16, earH: 0.17, earR: 0.075, ear: 'prick', snout: 1.1, tail: 'stub', voice: 1.2, cheek: 1.05 },
  husky: { species: 'dog', name: 'Husky', legL: 0.15, legW: 0.05, body: [0.18, 0.175, 0.3], headR: 0.165, earH: 0.12, earR: 0.06, ear: 'prick', snout: 1.15, tail: 'plume', voice: 0.95, scale: 1.25, cheek: 1.05 },
  dachshund: { species: 'dog', name: 'Dachshund', legL: 0.055, legW: 0.042, body: [0.13, 0.13, 0.35], headR: 0.14, earH: 0.12, earR: 0.06, ear: 'flop', snout: 1.5, tail: 'straight', voice: 1.3, cheek: 0.95 },
  pug: { species: 'dog', name: 'Pug', legL: 0.09, legW: 0.05, body: [0.17, 0.16, 0.24], headR: 0.17, earH: 0.07, earR: 0.05, ear: 'fold', snout: 0.45, tail: 'curl', voice: 1.15, cheek: 1.1 },
  golden: { species: 'dog', name: 'Golden Retriever', legL: 0.16, legW: 0.052, body: [0.18, 0.18, 0.32], headR: 0.165, earH: 0.13, earR: 0.07, ear: 'flop', snout: 1.25, tail: 'plume', voice: 0.85, scale: 1.3, cheek: 1 },
  beagle: { species: 'dog', name: 'Beagle', legL: 0.12, legW: 0.048, body: [0.165, 0.16, 0.29], headR: 0.158, earH: 0.17, earR: 0.08, ear: 'flop', snout: 1.2, tail: 'plume', voice: 1.0, scale: 1.05, cheek: 1.0 },
  akita: { species: 'dog', name: 'Akita', legL: 0.15, legW: 0.058, body: [0.2, 0.19, 0.32], headR: 0.18, earH: 0.12, earR: 0.072, ear: 'prick', snout: 1.05, tail: 'curl', voice: 0.82, scale: 1.35, cheek: 1.18 },
  pomeranian: { species: 'dog', name: 'Pomeranian', legL: 0.075, legW: 0.04, body: [0.15, 0.15, 0.2], headR: 0.15, earH: 0.075, earR: 0.045, ear: 'prick', snout: 0.6, tail: 'plume', voice: 1.7, scale: 0.72, cheek: 1.15, fluff: true },
  yorkie: { species: 'dog', name: 'Yorkshire Terrier', legL: 0.085, legW: 0.036, body: [0.13, 0.13, 0.22], headR: 0.14, earH: 0.09, earR: 0.045, ear: 'prick', snout: 0.85, tail: 'straight', voice: 1.75, scale: 0.7, cheek: 1.02, hair: 'long' },
  cat: { species: 'cat', name: 'Cat', legL: 0.115, legW: 0.034, body: [0.13, 0.135, 0.25], headR: 0.15, earH: 0.11, earR: 0.058, ear: 'cat', snout: 0.5, tail: 'cat', voice: 1, cheek: 1.08 },
};

// coat: top (back), mid (sides/transition), under (urajiro/belly), nose, eye, pattern
G.COATS = {
  red: { name: 'Red', top: '#c9631f', mid: '#e48a3e', under: '#fbebd2', dots: '#fbebd2' },
  sesame: { name: 'Sesame', top: '#4e3020', mid: '#c27a3e', under: '#f6e2c3', dots: '#f6e2c3', sesame: true },
  blacktan: { name: 'Black & Tan', top: '#262020', mid: '#3a2f2b', under: '#f7ead6', tan: '#c98a4b', dots: '#d79a58' },
  cream: { name: 'Cream', top: '#e2c08f', mid: '#efd6ae', under: '#fff7ea', dots: '#fff7ea' },
  // npc dogs
  corgi: { name: 'Corgi', top: '#d07a30', mid: '#e39a52', under: '#fff7ec', dots: '#d07a30' },
  husky: { name: 'Husky', top: '#4f5862', mid: '#77818c', under: '#f5f7f9', dots: '#f5f7f9', eye: '#4aa6e0' },
  dachs: { name: 'Dachshund', top: '#6b3a1e', mid: '#7e4626', under: '#9a5a34', dots: '#c27a3e' },
  pug: { name: 'Pug', top: '#d8b98a', mid: '#e2c597', under: '#ecd4ad', mask: '#2a2321', dots: '#d8b98a' },
  golden: { name: 'Golden', top: '#d99a45', mid: '#e8b35e', under: '#f3cf8a', dots: '#e8b35e' },
  corgi_tri: { name: 'Tricolor', top: '#2a2220', mid: '#3a2f2b', under: '#fff7ec', tan: '#c98a4b', dots: '#c98a4b' },
  corgi_sable: { name: 'Sable', top: '#7a4a24', mid: '#c98a4b', under: '#fff7ec', dots: '#c98a4b', sesame: true },
  husky_black: { name: 'Black & White', top: '#1f2226', mid: '#3a3f46', under: '#f5f7f9', dots: '#f5f7f9', eye: '#4aa6e0' },
  husky_red: { name: 'Copper', top: '#9a5428', mid: '#c27a46', under: '#fbf3ea', dots: '#fbf3ea', eye: '#c98a4b' },
  dachs_bt: { name: 'Black & Tan', top: '#231c1a', mid: '#2e2522', under: '#c98a4b', tan: '#b8783e', dots: '#c98a4b', sock: 0.6 },
  dachs_choc: { name: 'Chocolate', top: '#4a2a1a', mid: '#5a3422', under: '#7a4a2e', dots: '#9a6a44', sock: 0 },
  pug_black: { name: 'Black', top: '#1d1a1b', mid: '#242022', under: '#2e292b', mask: '#151213', dots: '#242022', sock: 0 },
  golden_cream: { name: 'Light Golden', top: '#e8c88e', mid: '#f0d6a6', under: '#f8e6c4', dots: '#f0d6a6', sock: 0 },
  golden_red: { name: 'Dark Golden', top: '#b8682a', mid: '#cc8240', under: '#dea05e', dots: '#cc8240', sock: 0 },
  beagle_tri: { name: 'Tricolor', top: '#211b19', mid: '#3a2f2b', under: '#fffaf2', tan: '#c47a3a', dots: '#c47a3a' },
  beagle_lemon: { name: 'Lemon', top: '#e3b46a', mid: '#ecc78a', under: '#fffaf2', dots: '#ecc78a' },
  akita_red: { name: 'Red', top: '#b8561e', mid: '#d9793a', under: '#fdf1e0', dots: '#fdf1e0' },
  akita_brindle: { name: 'Brindle', top: '#3a2a22', mid: '#8a6040', under: '#f1e3cf', dots: '#f1e3cf', sesame: true },
  akita_white: { name: 'White', top: '#f4ece0', mid: '#f8f2e8', under: '#fffdf8', dots: '#fffdf8' },
  pom_orange: { name: 'Orange', top: '#d97a2a', mid: '#eb9a48', under: '#f6c27e', dots: '#f6c27e', sock: 0.3 },
  pom_cream: { name: 'Cream', top: '#ecd3a8', mid: '#f3e0bf', under: '#fbf0dc', dots: '#fbf0dc', sock: 0.3 },
  pom_black: { name: 'Black', top: '#1f1b1c', mid: '#2a2526', under: '#3a3335', dots: '#3a3335', sock: 0 },
  yorkie: { name: 'Blue & Tan', top: '#55657a', mid: '#6c7c90', under: '#d9a56a', tan: '#c98f55', tanHead: true, dots: '#c98f55', sock: 0.9 },
  yorkie_gold: { name: 'Blue & Gold', top: '#3e4c5e', mid: '#56667a', under: '#e6b878', tan: '#d9a660', tanHead: true, dots: '#d9a660', sock: 0.9 },
  // cats
  tabby: { name: 'Orange Tabby', top: '#d9782e', mid: '#ef9b4e', under: '#fff1dc', stripes: '#b65a1c', eye: '#9ccc4a', nose: '#e88a8a' },
  grey: { name: 'Blue Grey', top: '#7d8590', mid: '#9aa2ac', under: '#d9dde2', eye: '#f2c24b', nose: '#b58a8a' },
  calico: { name: 'Calico', top: '#f6efe4', mid: '#f6efe4', under: '#fffaf2', calico: true, eye: '#e0b040', nose: '#f0a0a8' },
  tuxedo: { name: 'Tuxedo', top: '#1f1c1d', mid: '#262224', under: '#fbfaf7', eye: '#9ccc4a', nose: '#d68a90' },
  black: { name: 'Black', top: '#1d1a1b', mid: '#242022', under: '#2e292b', eye: '#f2c24b', nose: '#3a3233' },
  siamese: { name: 'Siamese', top: '#efe2cc', mid: '#f3e8d6', under: '#fbf5ea', points: '#4a3326', eye: '#4aa6e0', nose: '#5a3f33' },
};
G.PET_COATS = { dog: ['red', 'sesame', 'blacktan', 'cream'], cat: ['tabby', 'grey', 'calico', 'tuxedo', 'siamese', 'black'] };
G.BREED_COATS = {
  shiba: ['red', 'sesame', 'blacktan', 'cream'], mame: ['red', 'cream', 'sesame', 'blacktan'], corgi: ['corgi', 'corgi_tri', 'corgi_sable'], husky: ['husky', 'husky_black', 'husky_red'],
  dachshund: ['dachs', 'dachs_bt', 'dachs_choc'], pug: ['pug', 'pug_black'], golden: ['golden', 'golden_cream', 'golden_red'], beagle: ['beagle_tri', 'beagle_lemon'],
  akita: ['akita_red', 'akita_brindle', 'akita_white'], pomeranian: ['pom_orange', 'pom_cream', 'pom_black'], yorkie: ['yorkie', 'yorkie_gold'], cat: ['tabby', 'grey', 'calico', 'tuxedo', 'siamese', 'black'],
};
// adoption: Shibas from day one, everyone else unlocks (checked for old saves too)
G.BREED_INFO = {
  shiba: { trait: 'Proud, loyal and a little stubborn. The star of Maple Hill.', hint: '' },
  mame: { trait: 'A pocket-sized Shiba with a big personality.', hint: '' },
  cat: { trait: 'Independent and cuddly on their own terms. Can\u2019t enter contests.', hint: 'Adopt your first Shiba', from: 'Maple Kennel' },
  pug: { trait: 'Low energy, maximum cuddles. Gets tired slowly.', hint: 'Come back on a different day', from: 'Maple Kennel' },
  corgi: { trait: 'Short legs, big brain: learns tricks faster.', hint: 'Win the Maple Cup', from: 'MC Pepper' },
  dachshund: { trait: 'Champion sniffer: finds presents more often on walks.', hint: 'Find 5 presents on walks', from: 'Mrs. Kato' },
  beagle: { trait: 'Nose to the ground: spots golden bones from afar.', hint: 'Go on 7 walks', from: 'Hana' },
  husky: { trait: 'Born to run: the fastest dog on the disc field.', hint: 'Win the Open Cup', from: 'MC Pepper' },
  golden: { trait: 'Gentle and devoted: bonds with you faster.', hint: 'Reach max bond with any pet', from: 'Maple Kennel' },
  akita: { trait: 'The Shiba\u2019s big cousin: strong, calm and fearless.', hint: 'Win the Expert Cup with a Shiba', from: 'Maple Kennel' },
  pomeranian: { trait: 'A walking puffball: brushing makes them extra happy.', hint: 'Finish all daily quests on 2 different days', from: 'Maple Pets' },
  yorkie: { trait: 'Tiny fashionista: loves outfits and brushing.', hint: 'Own 8 accessories and brush a pet until super fluffy', from: 'Daisuke (Maple Pets)' },
};
G.BREED_ORDER = ['shiba', 'mame', 'cat', 'pug', 'corgi', 'dachshund', 'beagle', 'husky', 'golden', 'akita', 'pomeranian', 'yorkie'];
G.breedUnlocked = function (b) {
  const s = G.state; if (!s) return false; s.breeds = s.breeds || {};
  if (b === 'shiba' || b === 'mame') return true;
  return !!s.breeds[b];
};
G.breedCheck = function (b) { // is the requirement met right now?
  const s = G.state, st = s.stats || {}, won = (id, f) => (s.trophies || []).some((t) => t.cls === id && t.place === 1 && (!f || f(t)));
  const isShiba = (t) => { const d = s.pets.find((p) => p.id === t.pet); return d && (d.breed === 'shiba' || d.breed === 'mame'); };
  switch (b) {
    case 'cat': return s.pets.some((d) => d.breed === 'shiba' || d.breed === 'mame');
    case 'pug': return !!s.pets.length && new Date(s.firstPlay || s.created || Date.now()).toDateString() !== new Date().toDateString();
    case 'corgi': return won('novice');
    case 'dachshund': return (st.presents || 0) >= 5;
    case 'beagle': return (st.walks || 0) >= 7;
    case 'husky': return won('open');
    case 'golden': return s.pets.some((d) => (d.bond || 0) >= 100);
    case 'akita': return won('expert', isShiba);
    case 'pomeranian': return (s.questDays || 0) >= 2;
    case 'yorkie': return Object.keys(s.acc || {}).filter((k) => G.ITEMS[k] && G.ITEMS[k].cat === 'acc').length >= 8 && (st.fluffy || 0) >= 1;
    default: return true;
  }
};
// call often: unlocks newly earned breeds and mails a letter about each
G.checkBreeds = function (quiet) {
  const s = G.state; if (!s || !s.pets) return []; s.breeds = s.breeds || {}; const got = [];
  for (const b of G.BREED_ORDER) {
    if (G.breedUnlocked(b) || !G.breedCheck(b)) continue;
    s.breeds[b] = Date.now(); got.push(b);
    const nm = b === 'cat' ? 'Kittens' : G.BREEDS[b].name + ' puppies'; const info = G.BREED_INFO[b];
    s.mail = s.mail || []; s.mail.unshift({ id: 'breed_' + b, from: info.from || 'Maple Kennel', subject: nm + ' at the kennel!', body: (b === 'yorkie' ? 'A customer\u2019s Yorkie just had a litter, and with all those outfits and that brushing, I told them you\u2019d be the perfect owner. ' : b === 'akita' ? 'Word travelled fast about your Shiba\u2019s Expert Cup win. A breeder of Akitas, the Shiba\u2019s big cousins, would love one of their pups to go to you. ' : '') + nm + ' are now waiting at Maple Kennel. ' + info.trait + ' Visit the kennel on your walk to meet them!', day: G.today(), read: false });
    if (!quiet) setTimeout(() => { G.audio.play('fanfare'); G.ui.banner('New at the kennel!', nm + ' can now be adopted', 2800); }, 400 + got.length * 3000);
  }
  if (got.length) { G.ui.refresh && G.ui.refresh(); G.save(); }
  return got;
};
G.PERSONALITIES = {
  playful: { name: 'Playful', desc: 'Loves toys and zoomies.' },
  gentle: { name: 'Gentle', desc: 'Calm, cuddly and sweet.' },
  bold: { name: 'Bold', desc: 'Curious and fearless on walks.' },
  sleepy: { name: 'Sleepy', desc: 'Nap champion of Maple Hill.' },
  proud: { name: 'Proud', desc: 'Classic shiba: independent, dignified, secretly soft.' },
};

/* ---------------- Tricks ---------------- */
G.TRICKS = [
  { id: 'sit', name: 'Sit', hint: 'Stroke down along their back while they are standing.', need: 'stand' },
  { id: 'down', name: 'Lie down', hint: 'Stroke down along their back while they are sitting.', need: 'sit' },
  { id: 'paw', name: 'Paw', hint: 'Tap one of their front paws while they are sitting.', need: 'sit' },
  { id: 'beg', name: 'Sit pretty', hint: 'Stroke upward from the chin while they are sitting.', need: 'sit' },
  { id: 'spin', name: 'Spin', hint: 'Draw a big circle around your pup.', need: 'stand' },
  { id: 'jump', name: 'Jump', hint: 'Flick upward fast over your pup while they are standing.', need: 'stand' },
  { id: 'rollover', name: 'Roll over', hint: 'Stroke sideways across them while they are lying down.', need: 'lie' },
  { id: 'dead', name: 'Play dead', hint: 'Hold your finger on their head while they are lying down.', need: 'lie' },
  { id: 'speak', name: 'Speak', hint: 'Tap their nose twice quickly.', need: 'any' },
];

/* ---------------- Items ---------------- */
// cat: food (bowl) | treat (hand) | toy | acc | care
G.ITEMS = {
  kibble: { name: 'Kibble', cat: 'food', price: 20, hunger: 40, mood: 2, desc: 'Crunchy everyday kibble. Fills the bowl.' },
  premium: { name: 'Deluxe Kibble', cat: 'food', price: 45, hunger: 55, mood: 10, desc: 'Chicken and rice. Tails will wag.' },
  catfood: { name: 'Tuna Pâté', cat: 'food', price: 25, hunger: 45, mood: 6, desc: 'Cats go wild. Dogs try to steal it.' },
  biscuit: { name: 'Bone Biscuit', cat: 'treat', price: 10, hunger: 8, mood: 8, desc: 'A crunchy reward for good pups.' },
  jerky: { name: 'Chicken Jerky', cat: 'treat', price: 18, hunger: 12, mood: 14, desc: 'Chewy and irresistible.' },
  salmon: { name: 'Salmon Bites', cat: 'treat', price: 30, hunger: 16, mood: 18, desc: 'Shiny coat food. Cats approve.' },
  potato: { name: 'Sweet Potato', cat: 'treat', price: 14, hunger: 14, mood: 10, desc: 'Roasted, soft and very autumn.' },
  cake: { name: 'Pup Cake', cat: 'treat', price: 120, hunger: 30, mood: 40, desc: 'For birthdays. Or Tuesdays.' },
  shampoo: { name: 'Shampoo', cat: 'care', price: 25, desc: 'Peach-scented. Needed for a bath.', consumable: true },
  brush: { name: 'Slicker Brush', cat: 'care', price: 0, desc: 'Brush out the fluff. Shibas shed a lot!', owned: true },
  ball: { name: 'Tennis Ball', cat: 'toy', price: 30, toy: 'throw', bounce: 0.62, r: 0.06, desc: 'Bouncy classic. Flick to throw.' },
  disc: { name: 'Flying Disc', cat: 'toy', price: 60, toy: 'disc', bounce: 0.2, r: 0.12, desc: 'For fetch and disc contests.' },
  prodisc: { name: 'Pro Disc', cat: 'toy', price: 320, toy: 'disc', bounce: 0.2, r: 0.12, desc: 'Floats 20% farther. Contest grade.', pro: true },
  squeaky: { name: 'Squeaky Bone', cat: 'toy', price: 40, toy: 'squeak', bounce: 0.35, r: 0.07, desc: 'Tap it to squeak!' },
  duck: { name: 'Plush Duck', cat: 'toy', price: 70, toy: 'squeak', bounce: 0.3, r: 0.08, desc: 'Soft. Destined to be shaken.' },
  rope: { name: 'Tug Rope', cat: 'toy', price: 80, toy: 'tug', bounce: 0.2, r: 0.07, desc: 'Drag back and forth to play tug.' },
  ring: { name: 'Rubber Ring', cat: 'toy', price: 90, toy: 'throw', bounce: 0.5, r: 0.09, desc: 'Rolls in silly directions.' },
  carrot: { name: 'Squeaky Carrot', cat: 'toy', price: 60, toy: 'squeak', bounce: 0.3, r: 0.07, desc: 'Crinkly, squeaky, orange.' },
  yarn: { name: 'Yarn Ball', cat: 'toy', price: 35, toy: 'throw', bounce: 0.3, r: 0.06, desc: 'Cats lose their minds.' },
  chicken: { name: 'Rubber Chicken', cat: 'toy', price: 75, toy: 'squeak', bounce: 0.35, r: 0.08, desc: 'Honks. Loudly. Every time.' },
  glowball: { name: 'Glow Ball', cat: 'toy', price: 110, toy: 'throw', bounce: 0.62, r: 0.06, desc: 'Glows in the dark. Perfect for night play.' },
  mouse: { name: 'Toy Mouse', cat: 'toy', price: 45, toy: 'squeak', bounce: 0.3, r: 0.05, desc: 'Catnip inside. For cats.' },
  collar_red: { name: 'Red Collar', cat: 'acc', slot: 'collar', price: 40, color: '#e2574c', desc: 'A classic.' },
  collar_blue: { name: 'Sky Collar', cat: 'acc', slot: 'collar', price: 60, color: '#4aa6e0', desc: 'Like a clear day.' },
  collar_pink: { name: 'Sakura Collar', cat: 'acc', slot: 'collar', price: 60, color: '#f39bb0', desc: 'Pink with a tiny bell.', bell: true },
  collar_gold: { name: 'Gold Collar', cat: 'acc', slot: 'collar', price: 260, color: '#f2c24b', desc: 'Shiny! With a bell.', bell: true, metal: true },
  bandana_red: { name: 'Red Bandana', cat: 'acc', slot: 'neck', price: 50, color: '#e2574c', desc: 'Very good boy energy.' },
  bandana_plaid: { name: 'Plaid Bandana', cat: 'acc', slot: 'neck', price: 90, color: '#4a7a5a', plaid: true, desc: 'Autumn picnic chic.' },
  scarf: { name: 'Knit Scarf', cat: 'acc', slot: 'neck', price: 130, color: '#f2c24b', desc: 'Cosy for chilly walks.' },
  bowtie: { name: 'Bow Tie', cat: 'acc', slot: 'neck', price: 100, color: '#3b5ba8', desc: 'Dressed for the café.' },
  party: { name: 'Party Hat', cat: 'acc', slot: 'head', price: 80, color: '#7a5cff', desc: 'Every day is a party.' },
  beanie: { name: 'Pom Beanie', cat: 'acc', slot: 'head', price: 120, color: '#e2574c', desc: 'With a bouncy pom-pom.' },
  flower: { name: 'Flower Crown', cat: 'acc', slot: 'head', price: 150, color: '#f39bb0', desc: 'Spring picnic royalty.' },
  straw: { name: 'Straw Hat', cat: 'acc', slot: 'head', price: 140, color: '#e8c87a', desc: 'Summer festival vibes.' },
  bow: { name: 'Big Bow', cat: 'acc', slot: 'head', price: 70, color: '#ff6f91', desc: 'Adorable. Non-negotiable.' },
  cape: { name: 'Champion Cape', cat: 'acc', slot: 'neck', price: 0, prize: 'Win the Champions Cup', color: '#c8323c', desc: 'Red velvet, gold trim. Only true disc legends wear this.' },
  medal_ag: { name: 'Agility Gold Medal', cat: 'acc', slot: 'neck', price: 0, prize: 'Win Agility: Masters', color: '#3b7dd8', desc: 'Fastest paws in Maple Hill.' },
  medal_ob: { name: 'Obedience Gold Medal', cat: 'acc', slot: 'neck', price: 0, prize: 'Win Obedience: Utility', color: '#e2574c', desc: 'A perfectly good dog. Officially.' },
  bunny: { name: 'Bunny Ears', cat: 'acc', slot: 'head', price: 160, color: '#ffffff', desc: 'Hop hop. Floppy on one side.' },
  sailor: { name: 'Sailor Cap', cat: 'acc', slot: 'head', price: 170, color: '#ffffff', desc: 'Ahoy! Ready for the pond pier.' },
  tiara: { name: 'Sparkle Tiara', cat: 'acc', slot: 'head', price: 280, color: '#d9dde6', desc: 'For the royalty of the dog park.' },
  patch: { name: 'Pirate Patch', cat: 'acc', slot: 'face', price: 120, color: '#1a1a1a', desc: 'Arr. Strictly for treasure hunts.' },
  frog: { name: 'Frog Hat', cat: 'acc', slot: 'head', price: 220, color: '#79b25a', desc: 'Ribbit.' },
  crown: { name: 'Champion Crown', cat: 'acc', slot: 'head', price: 0, prize: 'Win the Champions Cup', color: '#f2c24b', desc: 'For legends of the disc.', metal: true },
  glasses: { name: 'Round Glasses', cat: 'acc', slot: 'face', price: 110, color: '#3b2a1f', desc: 'Very scholarly.' },
  shades: { name: 'Sunglasses', cat: 'acc', slot: 'face', price: 160, color: '#1a1a1a', desc: 'Too cool for the dog park.', dark: true },
};
G.SHOP_TABS = [
  { id: 'food', name: 'Food', cats: ['food', 'treat'] },
  { id: 'toy', name: 'Toys', cats: ['toy'] },
  { id: 'acc', name: 'Dress-up', cats: ['acc'] },
  { id: 'care', name: 'Care', cats: ['care'] },
];

/* ---------------- Café menu ---------------- */
G.CAFE = [
  { id: 'latte', name: 'Honey Latte', price: 30, who: 'you', desc: 'Warm, sweet, foamy.' },
  { id: 'matcha', name: 'Matcha Latte', price: 35, who: 'you', desc: 'Bright green and calming.' },
  { id: 'soda', name: 'Melon Soda', price: 30, who: 'you', desc: 'With a scoop of vanilla on top.' },
  { id: 'shortcake', name: 'Strawberry Shortcake', price: 45, who: 'you', desc: 'Fluffy as a puppy.' },
  { id: 'pupcup', name: 'Pup-cup', price: 15, who: 'pet', hunger: 8, mood: 20, desc: 'A little cup of whipped cream.' },
  { id: 'cookie', name: 'Peanut Pup Cookie', price: 20, who: 'pet', hunger: 14, mood: 15, desc: 'Baked fresh for four-legged guests.' },
  { id: 'salmonbowl', name: 'Salmon Rice Bowl', price: 40, who: 'pet', hunger: 40, mood: 22, desc: 'The chef’s special for pets.' },
];

/* ---------------- Contests ---------------- */
G.CONTESTS = [
  { id: 'beginner', name: 'Puppy Cup', fee: 0, prize: [200, 120, 60], rival: [10, 28], need: null, color: '#cd7f32' },
  { id: 'novice', name: 'Maple Cup', fee: 30, prize: [400, 220, 100], rival: [22, 48], need: 'beginner', color: '#c0c0c0' },
  { id: 'open', name: 'Open Cup', fee: 60, prize: [800, 420, 200], rival: [38, 72], need: 'novice', color: '#f2c24b' },
  { id: 'expert', name: 'Expert Cup', fee: 100, prize: [1500, 800, 350], rival: [58, 100], need: 'open', color: '#4aa6e0' },
  { id: 'champ', name: 'Champions Cup', fee: 200, prize: [3000, 1500, 700], rival: [82, 132], need: 'expert', color: '#f39bb0' },
];
G.RIVALS = [
  ['Mika', 'Pocky', 'corgi'], ['Joji', 'Taro', 'shiba'], ['Emi', 'Snowpea', 'husky'], ['Haru', 'Natto', 'shiba'], ['Lena', 'Waffle', 'golden'],
  ['Kaito', 'Udon Jr.', 'dachshund'], ['Saki', 'Momo', 'mame'], ['Ken', 'Tofu', 'pug'], ['Nao', 'Rocket', 'husky'], ['Aya', 'Kinako', 'shiba'],
  ['Rin', 'Biscuit', 'beagle'], ['Sho', 'Hachi', 'akita'], ['Yui', 'Puff', 'pomeranian'], ['Lulu', 'Pixie', 'yorkie'],
];

/* ---------------- People looks ---------------- */
G.LOOKS = {
  hana: { skin: '#f6d2b8', hair: '#3b2420', style: 'pony', top: '#f39bb0', bottom: '#4a6fa5', h: 1 },
  ogawa: { skin: '#eac3a2', hair: '#d9d6d0', style: 'bald', top: '#6b7f5a', bottom: '#5a4a3a', h: 0.95, extra: ['mustache', 'cap'] },
  tomo: { skin: '#f0c7a6', hair: '#2a1d18', style: 'short', top: '#4aa6e0', bottom: '#3b4a6a', h: 0.72 },
  aki: { skin: '#f0c7a6', hair: '#2a1d18', style: 'bun', top: '#f2c24b', bottom: '#e2574c', h: 0.68 },
  rina: { skin: '#c99a76', hair: '#1f1a1a', style: 'pony', top: '#79b25a', bottom: '#2c2c3a', h: 1.02, extra: ['band'] },
  kenji: { skin: '#e6b894', hair: '#5a3a26', style: 'messy', top: '#3b5ba8', bottom: '#3a3a3a', h: 1.04, extra: ['guitar'] },
  pip: { skin: '#f3d0b5', hair: '#c4622a', style: 'short', top: '#d9534f', bottom: '#33415c', h: 0.98, extra: ['cap', 'bag'] },
  sora: { skin: '#f6d6c0', hair: '#8a5a9a', style: 'bob', top: '#fff7ea', bottom: '#6b5a8a', h: 0.98, extra: ['beret'] },
  kato: { skin: '#f0cfb3', hair: '#9a8a86', style: 'bun', top: '#b35a7a', bottom: '#4a3a4a', h: 0.93, extra: ['glasses'] },
  yuki: { skin: '#f6d2b8', hair: '#2a1d18', style: 'bob', top: '#fff7ea', bottom: '#3b2a1f', h: 0.98, extra: ['apron'] },
  ito: { skin: '#e2b896', hair: '#4a4a4a', style: 'short', top: '#7a5c46', bottom: '#3a3a3a', h: 1.0, extra: ['glasses'] },
  daisuke: { skin: '#e8bf9c', hair: '#1f1a1a', style: 'short', top: '#79b25a', bottom: '#3a3a3a', h: 1.03, extra: ['apron'] },
  pepper: { skin: '#d9a07a', hair: '#e2574c', style: 'messy', top: '#f2c24b', bottom: '#2c2c3a', h: 1.0, extra: ['band'] },
  fuji: { skin: '#f3d0b5', hair: '#6b3a1e', style: 'bun', top: '#79b25a', bottom: '#5a4a3a', h: 0.97, extra: ['apron'] },
  luna: { skin: '#f3d0b5', hair: '#2a3a6a', style: 'pony', top: '#33415c', bottom: '#2c2c3a', h: 0.97, extra: ['glasses'] },
  you: { skin: '#f0c7a6', hair: '#3b2420', style: 'short', top: '#ee8a3c', bottom: '#3b4a6a', h: 1 },
};

/* ---------------- Shiba facts ---------------- */
G.FACTS = [
  'Shibas are one of the oldest dog breeds in Japan. They were bred to hunt in thick mountain brush.',
  'Those cream markings on the cheeks, chest and belly? They’re called urajiro. It means "underside white".',
  'Shibas groom themselves almost like cats. Very tidy creatures.',
  'When a shiba is truly upset it may let out the famous "shiba scream". Kuri did it once. At the vet.',
  'A shiba’s tail can curl to the left, to the right, or sit in a tight double curl on the back.',
  'Twice a year shibas "blow their coat". You could knit a second dog from the fluff!',
  'Shibas are independent. Trust comes slowly: patience, gentle hands, and the occasional treat.',
  'The little cream dots above a shiba’s eyes are sometimes called "eyebrows". They make every look very expressive.',
];

/* ---------------- NPC dialogue ---------------- */
// D API: say, ask, give, coins, friend, f, once, flag, setFlag, name (pet name), pet, play, petBy, race, paint, timeWord
G.NPCS = {
  hana: {
    name: 'Hana', dog: { name: 'Biscuit', breed: 'corgi', coat: 'corgi' },
    async talk(D) {
      if (!D.flag('met')) {
        D.setFlag('met');
        await D.say('Oh hi! Is this your pup? So fluffy!');
        const c = await D.ask('What’s their name?', ['This is ' + D.name + '!', 'It’s a secret.']);
        if (c === 0) { await D.say(D.name + '! What a perfect name. This little loaf is Biscuit.'); D.friend(1); } else await D.say('Ooh, mysterious. This is Biscuit, by the way. Corgi. Professional sock thief.');
        await D.say('We train for the Disc Cups at the field up north. You should enter! The Puppy Cup is free.');
        return;
      }
      if (D.f >= 4 && !D.flag('gift')) {
        D.setFlag('gift');
        await D.say('Hey, I’ve got something for you. Biscuit and I won a spare at the Open Cup.');
        D.give('prodisc', 1);
        await D.say('It’s a Pro Disc! It glides way farther. Go make some waves, ' + D.name + '!');
        return;
      }
      const topics = [
        async () => { await D.say('Disc tip: flick fast and straight up the screen. Faster flick, longer flight.'); await D.say('Throws that stay at jumping height turn into flying catches. Those score x1.5!'); },
        async () => {
          const c = await D.ask('Biscuit’s doing zoomies again. Want our dogs to play?', ['Let’s play!', 'Maybe later.']);
          if (c === 0) { await D.say('Yay! Go on, Biscuit!'); D.play(7); D.friend(1); } else await D.say('No worries! Biscuit will sulk. Briefly.');
        },
        async () => { const n = G.state.trophies.length; await D.say(n ? 'You’ve got ' + n + ' troph' + (n > 1 ? 'ies' : 'y') + ' already? You and ' + D.name + ' are a real team.' : 'Haven’t entered a Disc Cup yet? The Puppy Cup is friendly. Nobody bites. Except Biscuit, at toes.'); },
        async () => { await D.say('Practising helps! Every catch makes your pup a little faster and bouncier.'); },
        async () => { await D.say('I swear Biscuit understands the word "cheese" from three rooms away.'); D.friend(1); },
        async () => { await D.say('Have you seen the Gazette comic? "Biscuit & the Socks"? Pip draws it. It’s... basically a documentary.'); },
        async () => { await D.say('Agility tip: aim your pup at each obstacle head-on. Smooth lines win trials!'); },
        async () => { await D.say('Biscuit has a nemesis. It’s the duck on the pond. The duck has no idea.'); },
      ];
      await U.pick(topics)();
      D.once('chat', () => D.friend(1));
    },
  },
  ogawa: {
    name: 'Mr. Ogawa', dog: { name: 'Kuri', breed: 'shiba', coat: 'sesame', old: true },
    async talk(D) {
      if (!D.flag('met')) {
        D.setFlag('met');
        await D.say('Ah. A young shiba. Come sit a while, young one.');
        await D.say('This old fellow is Kuri. Sesame coat, fourteen years. Still the boss of this bench.');
        await D.say('I come here every day to feed the sparrows. If you ever want shiba stories, I’ve got plenty.');
        D.friend(1); return;
      }
      const st = G.state.npc.ogawa; st.talks = (st.talks || 0) + 1;
      if (st.talks >= 7 && !D.flag('chestnut')) {
        D.setFlag('chestnut');
        await D.say('You keep coming back to this old bench. Alright. I’ll tell you a secret.');
        await D.say('Thirty years ago, Kuri’s grandmother won the very first Maple Hill Disc Cup.');
        await D.say('They called her "The Flying Chestnut". She caught a disc so high a pigeon filed a complaint.');
        await D.say('Kuri has her eyebrows. Maybe ' + D.name + ' has her spirit. Here. This was hers.');
        D.give('collar_gold', 1); G.stamp('chestnut'); return;
      }
      const c = await D.ask('Hm? What brings you by?', ['Tell me a shiba story', 'How is Kuri?', 'Just saying hi!']);
      if (c === 0) { await D.say(U.pick(G.FACTS)); D.once('fact', () => D.friend(1)); }
      else if (c === 1) {
        await D.say(U.pick(['Kuri? Slower these days, but he still pretends he can’t hear the word "bath".', 'He ate a whole sweet potato this morning. Then he looked at me like I’d done it.', 'He likes your ' + D.name + '. I can tell. His tail went up a notch.']));
        if (!D.flag('jerky' + D.today)) { D.setFlag('jerky' + D.today); await D.say('Here. Kuri won’t miss a few. Don’t tell him.'); D.give('jerky', 2); }
      } else { await D.say(D.timeWord === 'morning' ? 'Good morning to you too. The sparrows are early today.' : D.timeWord === 'night' ? 'Out late, eh? The stars are nice from this bench.' : 'Hello, hello. A fine day for a walk.'); D.once('hi', () => D.friend(1)); }
    },
  },
  kids: {
    name: 'Tomo & Aki', look: 'tomo',
    async talk(D) {
      await D.say(U.pick(['A SHIBA! Can we pet it? Pleeease?', 'It’s the fluffy dog again!! Can we pet ' + D.name + '?', 'Doggy! Doggy! Can we say hi?']));
      const c = await D.ask('Tomo and Aki are bouncing with excitement.', ['Sure, gently!', 'Not right now.']);
      if (c === 1) { await D.say('Awww... okay! Bye bye, ' + D.name + '!'); return; }
      D.petBy(14);
      await D.say(U.pick(['So soft! It feels like a cloud!', 'It’s smiling! Aki, look, it’s SMILING!', 'Its tail is a cinnamon roll!']));
      const q = await D.ask('What’s ' + D.name + '’s favorite snack?', ['Sweet potato', 'Chicken jerky', 'Your sandwich']);
      await D.say(['Sweet potato? Our grandma makes those!', 'Jerky! We’ll save our allowance for some!', 'HEY! No way! ...Okay maybe a bite.'][q]);
      if (!D.flag('coin' + D.today)) { D.setFlag('coin' + D.today); D.friend(1); D.coins(15, 'Tomo & Aki gave you a shiny coin they found!'); }
    },
  },
  rina: {
    name: 'Rina', dog: { name: 'Blizzard', breed: 'husky', coat: 'husky' },
    async talk(D) {
      if (!D.flag('met')) { D.setFlag('met'); await D.say('Hey! I’m Rina. This is Blizzard. We run this loop every day. Rain or shine.'); D.friend(1); }
      if (D.pet && D.pet.d.energy < 25) { await D.say(D.name + ' looks wiped out. Head home, rest up, and come race us another day!'); return; }
      const c = await D.ask('Feel like a race? First one to the big oak tree wins!', ['You’re on!', 'Too tired today.']);
      if (c === 0 && D.flag('race' + D.today)) { await D.say(U.pick(['We already raced today! Blizzard needs his beauty sleep. Rematch tomorrow?', 'Ha, again? Blizzard is lying on the grass refusing to move. Tomorrow!'])); return; }
      if (c === 0) { D.setFlag('race' + D.today); await D.say('On your marks... get set... GO!'); D.race(); } else await D.say('Ha! Next time then. Blizzard’s always ready.');
    },
  },
  kenji: {
    name: 'Kenji', look: 'kenji',
    async talk(D) {
      if (!D.flag('met')) { D.setFlag('met'); await D.say('Hey there! Name’s Kenji. I play songs for anyone with ears. Floppy ears or pointy ears.'); D.friend(1); }
      const now = G.audio.buskSong && G.audio.buskSong(); if (now && G.BUSK_NAMES[now]) await D.say('That was "' + G.BUSK_NAMES[now] + '". A classic!');
      const c = await D.ask('Any requests?', ['Something upbeat!', 'A cozy lullaby', 'Let ' + D.name + ' sing!', 'Something old and pretty']);
      if (c === 0) { await D.say('"Ode to Joy"! Beethoven wrote it, I just play it faster.'); D.music('ode', 10); }
      else if (c === 1) { await D.say('Shh... "Twinkle Twinkle Little Star". Works on puppies every time.'); D.music('twinkle', 8); if (D.pet) D.pet.d.mood = Math.min(100, D.pet.d.mood + 5); }
      else if (c === 3) { await D.say('"Sakura Sakura". An old folk song about cherry blossoms. My grandma hummed it.'); D.music('sakura', 10); }
      else {
        D.music('twinkle', 8); await D.say('A duet? Alright! Take it away, ' + D.name + '!'); D.howl();
        await D.say('AWOOOO! Incredible! The crowd loves it!');
        if (!D.flag('tip' + D.today)) { D.setFlag('tip' + D.today); D.coins(25, 'You and ' + D.name + ' earned 25 coins in tips!'); D.friend(1); }
      }
    },
  },
  pip: {
    name: 'Pip', look: 'pip',
    async talk(D) {
      if (!D.flag('met')) { D.setFlag('met'); await D.say('Mail call! Oh, you’re not a mailbox. Hi! I’m Pip, I deliver all the letters in Maple Hill.'); D.friend(1); }
      if (!D.flag('parcel' + D.today) && D.f >= 2 && U.chance(0.6)) {
        D.setFlag('parcel' + D.today);
        await D.say('Oh! Wait! This parcel’s addressed to... "' + D.name + '"! Fancy.');
        const item = U.pick(['biscuit', 'potato', 'salmon', 'bow', 'carrot', 'party']);
        D.give(item, 1); return;
      }
      await D.say(U.pick([
        'News of the day: the Pet Shop just got new hats in. The frog one is a hit.',
        'Psst. If your pup gets muddy, a bath with shampoo fixes it. Scrub, rinse, then watch the shake!',
        'Rumor says Rina’s husky has never lost a race. I bet a shiba could do it.',
        'Mr. Ogawa by the pond knows everything about shibas. Ask him for a story!',
        'The Champions Cup is wild. Dogs flying like birds! I almost dropped my letters.',
        'Teach tricks by touch! Stroke your pup the right way and they’ll try a pose. Then praise them!',
        'If you see something sparkly on your walk, let your pup sniff it out. Could be a present!',
        'Rumor says there are golden bones hidden around town. Behind things. Under things. Beside things.',
        'I deliver the Gazette every morning. And I draw the comic! Biscuit is a natural model.',
        'Strange lights over the hills at night? Probably a kite. Probably.',
        'The vending machine by the café sometimes gives you two. Do not kick it. I learned that the hard way.',
      ]));
      D.once('chat', () => D.friend(1));
    },
  },
  sora: {
    name: 'Sora', look: 'sora',
    async talk(D) {
      if (!D.flag('met')) { D.setFlag('met'); await D.say('Oh! Hello. I’m Sora. I paint the pond at every hour of the day. The light keeps changing, you know?'); D.friend(1); }
      const c = await D.ask('Would you like a portrait of ' + D.name + '? I’d paint it for 150 coins.', ['Yes please! (150)', 'Maybe another time.']);
      if (c === 1) { await D.say('Of course. ' + D.name + '’s colors are lovely though. Like toasted mochi.'); return; }
      if (G.state.coins < 150) { await D.say('Ah... it seems you’re a little short. Come back anytime!'); return; }
      await D.say('Wonderful! Hold still, ' + D.name + '... chin up... perfect.');
      D.paint();
      await D.say('Done! I’ll have it delivered to your living room wall. I think it’s my best one yet.');
      D.friend(2);
    },
  },
  kato: {
    name: 'Mrs. Kato', dog: { name: 'Dango', breed: 'pug', coat: 'pug' }, dog2: { name: 'Udon', breed: 'dachshund', coat: 'dachs' },
    async talk(D) {
      if (!D.flag('met')) { D.setFlag('met'); await D.say('Oh my, what a handsome little shiba! I’m Mrs. Kato. This is Dango, and the long one is Udon.'); D.friend(1); return; }
      if (D.f >= 3 && !D.flag('cake')) { D.setFlag('cake'); await D.say('I baked too much again. Here, a little pup cake. Don’t let Udon see.'); D.give('cake', 1); return; }
      await D.say(U.pick([
        'Have you tried the café? Paw & Bean. Dango orders the pup-cup every single time.',
        'Udon tried to fit under the fridge again. He is a noodle, but not THAT much of a noodle.',
        'They say Yuki at the café can draw a shiba face in latte foam. Ask her!',
        'At my age, a slow walk with good company is the best part of the day.',
        'Dango snores louder than my husband. And my husband snores like a ship’s horn.',
        'Have you tried the capsule machine by the pet shop? I’m one Golden Shiba away from a full set. It’s been three years.',
        'The shrine fortunes are suspiciously accurate. Mine said "beware of noodles". Udon ate my sandwich that day.',
        'If you see Pip, tell him the comic about my slipper was NOT funny. (It was a little funny.)',
      ]));
      D.once('chat', () => D.friend(1));
    },
  },
  nori: {
    name: 'Nori', look: null, cat: true,
    async talk(D) {
      const fed = (G.state.npc.nori && G.state.npc.nori.fed) || 0;
      if (fed >= 3) { await D.say('Nori purrs and headbutts your hand. She seems to want to come home with you... (you can adopt Nori free at the kennel!)'); return; }
      await D.say(U.pick(['The black cat on the wall watches you with golden eyes.', 'The cat flicks her tail. Mrrp?', 'The cat stretches, then pretends not to see you.']));
      const treats = G.ITEMS ? Object.keys(G.state.inv).filter((k) => G.ITEMS[k] && G.ITEMS[k].cat === 'treat' && G.state.inv[k] > 0) : [];
      if (!treats.length) { await D.say('(If you had a treat, maybe she’d come closer...)'); return; }
      const c = await D.ask('Offer a treat?', ['Offer ' + G.ITEMS[treats[0]].name, 'Leave her be']);
      if (c === 1) return;
      G.state.inv[treats[0]]--;
      const n = G.state.npc.nori = G.state.npc.nori || {}; n.fed = (n.fed || 0) + 1;
      G.audio.play('meow', 1.1);
      if (n.fed >= 3) { await D.say('Nori munches the treat and purrs loudly. She follows you a few steps... She trusts you now! Visit the kennel to adopt her.'); G.ui.toast('Nori can now be adopted at the kennel!', 'gold'); }
      else await D.say('Nori nibbles the treat. She’s warming up to you. (' + n.fed + '/3)');
    },
  },
  luna: {
    name: 'Luna', look: 'luna',
    async talk(D) {
      const ph = G.moonPhase(); const phase = ph < 0.03 || ph > 0.97 ? 'a new moon' : ph < 0.22 ? 'a waxing crescent' : ph < 0.28 ? 'a first quarter moon' : ph < 0.47 ? 'a waxing gibbous' : ph < 0.53 ? 'a FULL moon' : ph < 0.72 ? 'a waning gibbous' : ph < 0.78 ? 'a last quarter moon' : 'a waning crescent';
      if (!D.flag('met')) { D.setFlag('met'); await D.say('Oh! Hi. Sorry, I\u2019m Luna. I come out here every clear night with my telescope. The park is the darkest spot in town.'); D.friend(1); }
      const c = await D.ask('Want to take a look?', ['Look at the moon', 'Tell me about the stars', 'Seen anything... strange?']);
      if (c === 0) { await D.say('Tonight it\u2019s ' + phase + '. Here, look through the eyepiece.'); await D.say(ph > 0.45 && ph < 0.55 ? 'You can see every crater! ' + D.name + ' is howling a little. Fair.' : ph < 0.05 || ph > 0.95 ? 'Hmm, the moon\u2019s hiding tonight. But that means the stars are extra bright!' : 'See the line between light and shadow? That\u2019s where the craters look sharpest.'); D.once('moon', () => D.friend(1)); }
      else if (c === 1) { await D.say(U.pick(['See that bright one low in the sky? Sirius, the "Dog Star". It\u2019s in the constellation Canis Major, the Great Dog.', 'There\u2019s a little constellation called Canis Minor too. The Lesser Dog. Like a mame shiba of the sky.', 'Every July, on Tanabata, two star lovers meet across the Milky Way. People write wishes on paper strips.', 'The "Dog Days" of summer are named after Sirius rising with the sun. Hot days, sleepy dogs.'])); D.once('star', () => D.friend(1)); }
      else { await D.say(U.pick(['Strange? Well... sometimes there\u2019s a light over the hills that moves wrong. Not a plane. Not a star. If you see it, tap it. For science.', 'Pip says it\u2019s a kite. Kites don\u2019t hum.', 'I logged an unidentified object last Tuesday. Mr. Ogawa says it was a disc thrown by a very strong golden retriever.'])); }
      if (D.f >= 3 && !D.flag('gift')) { D.setFlag('gift'); await D.say('Here, take this. I found it under the oak one night. It glints like a star.'); D.coins(50, 'Luna gave you 50 coins she found!'); }
    },
  },
  yuki: { name: 'Yuki', look: 'yuki' },
  ito: { name: 'Prof. Ito', look: 'ito' },
  daisuke: { name: 'Daisuke', look: 'daisuke' },
  pepper: { name: 'MC Pepper', look: 'pepper' },
  fuji: { name: 'Ms. Fuji', look: 'fuji' },
};

G.PET_NAMES = ['Mochi', 'Kinako', 'Hachi', 'Sakura', 'Kuma', 'Azuki', 'Taiyaki', 'Momo', 'Sora', 'Yuzu', 'Dango', 'Riku', 'Hana', 'Koji', 'Nori', 'Ume', 'Miso', 'Sushi', 'Tofu', 'Kiki'];
