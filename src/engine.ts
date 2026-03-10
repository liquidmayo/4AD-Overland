export type CharacterClass = 'Warrior' | 'Cleric' | 'Rogue' | 'Wizard' | 'Barbarian' | 'Elf' | 'Dwarf' | 'Halfling';

export interface Character {
  id: string;
  name: string;
  charClass: CharacterClass;
  level: number;
  maxLife: number;
  currentLife: number;
  gold: number;
  equipment: string[];
  spells: string[];
  clues: number;
  luck?: number;
}

export function generateStartingCharacter(name: string, charClass: CharacterClass): Character {
  const char: Character = {
    id: Math.random().toString(36).substring(2, 9),
    name,
    charClass,
    level: 1,
    maxLife: 0,
    currentLife: 0,
    gold: 0,
    equipment: [],
    spells: [],
    clues: 0,
  };

  switch (charClass) {
    case 'Warrior':
      char.maxLife = 7;
      char.gold = simulateRoll("2d6");
      char.equipment = ["Light armor", "Shield", "Hand weapon"];
      break;
    case 'Cleric':
      char.maxLife = 5;
      char.gold = simulateRoll("1d6");
      char.equipment = ["Light armor", "Shield", "Hand weapon"];
      char.spells = ["Blessing", "Blessing", "Blessing", "Healing", "Healing", "Healing"];
      break;
    case 'Rogue':
      char.maxLife = 4;
      char.gold = simulateRoll("3d6");
      char.equipment = ["Rope", "Lock picks", "Light armor", "Light hand weapon"];
      break;
    case 'Wizard':
      char.maxLife = 3;
      char.gold = simulateRoll("4d6");
      char.equipment = ["Light hand weapon", "Spell-book", "Writing implements"];
      char.spells = ["Choose 3 spells"]; // Placeholder, player chooses
      break;
    case 'Barbarian':
      char.maxLife = 8;
      char.gold = simulateRoll("1d6");
      char.equipment = ["Light armor", "Shield", "Hand weapon"];
      break;
    case 'Elf':
      char.maxLife = 5;
      char.gold = simulateRoll("2d6");
      char.equipment = ["Light armor", "Hand weapon", "Bow"];
      char.spells = ["Choose 1 spell"];
      break;
    case 'Dwarf':
      char.maxLife = 6;
      char.gold = simulateRoll("3d6");
      char.equipment = ["Light armor", "Shield", "Hand weapon"]; // Or Heavy armor + 2H weapon
      break;
    case 'Halfling':
      char.maxLife = 4;
      char.gold = simulateRoll("2d6");
      char.equipment = ["Lots of snacks", "Sling", "Light hand weapon"];
      char.luck = 2;
      break;
  }
  char.currentLife = char.maxLife;
  return char;
}

export const TERRAIN_COLORS: Record<string, string> = {
  'Sea/Lake': '#60a5fa',
  'Glacier': '#e0f2fe',
  'Grasslands': '#86efac',
  'Jungle': '#166534',
  'Forest': '#22c55e',
  'Hills': '#d97706',
  'Mountains': '#9ca3af',
  'Swamp': '#4d7c0f',
  'Desert': '#fde047',
};

export function getTerrain(roll: number) {
  if (roll <= 9) return 'Sea/Lake';
  if (roll <= 18) return 'Glacier';
  if (roll <= 34) return 'Grasslands';
  if (roll <= 44) return 'Jungle';
  if (roll <= 57) return 'Forest';
  if (roll <= 70) return 'Hills';
  if (roll <= 82) return 'Mountains';
  if (roll <= 90) return 'Swamp';
  return 'Desert';
}

export function getSpecialFeature(roll: number, hasRoad: boolean) {
  if (hasRoad) {
    switch (roll) {
      case 2: return "Catacombs (1d3 Level Dungeon)";
      case 3: return "Town/City";
      case 4: return "Monastery";
      case 5: return "Keep";
      case 6: return "Tavern";
      case 7: return "Town/City";
      case 8: return "Trading Post";
      case 9: return "Town/City";
      case 10: return "Shrine";
      case 11: return "Dungeon";
      case 12: return "Dragon Lair";
    }
  } else {
    switch (roll) {
      case 2: return "Trading Post";
      case 3: return "Keep";
      case 4: return "Village";
      case 5: return "Portal";
      case 6: return "Ancient Crypt";
      case 7: return "Catacombs (1d3 Level Dungeon)";
      case 8: return "Ruins";
      case 9: return "Village";
      case 10: return "Cavern";
      case 11: return "Shrine";
      case 12: return "Dragon Lair";
    }
  }
  return null;
}

export function getNPCEncounter(roll: number) {
  switch (roll) {
    case 1: return "A wagon destroyed by Minions. Roll on the Minion Table. After encounter, roll one additional time on the Treasure table with their modifier – Minions are 'Max' & 'Twisted'";
    case 2: return "Two goblins in a dispute over a map. Persuasion Save vs TIER+3 (Warriors/Paladins/Elves add +TIER). Success: Learn location of 1 Magic Treasure. Failure: Goblins continue to argue.";
    case 3: return "Bandits scouting for a camping spot. Persuasion Save vs TIER+3. Success: Pass without issues. Failure: Lose all gold or fight the bandits (Greenskin Minions + Leader).";
    case 4: return "A horse trader, willing to sell a Horse for 100 GP.";
    case 5: return "Local Hunters around a campfire. Spend 1 ration less for Party's next action + map an adjacent unexplored Hex.";
    case 6: return "A patrol of Orc Archers led by the Orc Champion. Convince Save vs TIER+4 to bribe with 4 Rations, or fight (Elves cause immediate attack).";
    case 7: return "Elderly women, a victim of thieves. Roll for a Quest, Location is a random size & layout standard dungeon on a random hex.";
    case 8: return "Demonic Ritual Site. Fight a random Demonic Major Monster. Break Demonic Spell Save vs TIER+5 to escape.";
    case 9: return "Roll on Traveler Table (d6): 1-Healer, 2-Alchemist, 3-Merchant, 4-Gypsy Wagon, 5-Hired Help, 6-Mysterious Call for help.";
    case 10: return "Hunter's Camp. Help deal with a dangerous Prey. FORAGE ACTION @ +1 and receive half rations, then roll D6 for reward.";
    case 11: return "Farmers in a field protecting crops from Minions. Help them for 10 rations and healing, or refuse and face doubled prices in region.";
    case 12: return "A Feast in the Wilderness. Heal 1 Madness and gain 10 rations. 1% chance a random party member falls in love and leaves the party.";
    case 13: return "Dragon seen flying in the far distance. Will attack nearest settlement. Help immediately or settlement is ruined.";
    case 14: return "Lost Stranger. Roll D6: 1-Lost Traveler, 2/3-Elderly Woman (Quest), 4/5-Princess on the Run, 6-Injured Knight.";
    case 15: return "Wandering Minstrel. Writes a song. Roll D6: 1/2-Comical (-10 GP in towns), 3/5-Satirical (Free rest for 1), 6-Heroic (Free rest for all).";
    case 16: return "Wagon Train. Roll D6: 1/4-Friendly (Rations/Heal), 5-Cultists (Fight Chaos Minion), 6-Mimic (Fight Weird Monster).";
    case 17: return "Witch. Offers potion. Drink (D6: 1/3-See in dark, 4/6-Bad luck) or Refuse (D6: 1/4-Fight Dark Hag, 5/6-Disappears).";
    case 18: return "Traveler in Peril. Fight Minion (1-3) or Major Foe (4-6). Reward D6: 1/2-Peasant (1d6 GP), 3/4-Trader (2d6x5 GP), 5/6-Noble (Gem).";
    case 19: return "Glowing Signs. Sucked into a 5-room demonic dungeon. Fight Elemental Creature (Final Boss).";
    case 20: return "Hostage. Bandit has an 8-year-old girl. Roll D6 for demand (Mad, Gold, Magic Item). Save her or she dies (+TIER Madness).";
  }
  return "Unknown NPC Encounter";
}

export function getTroubles(roll: number) {
  switch (roll) {
    case 1: return "Smoky Clouds. Roll D6: 1-3 Add 1 day travel, 2-6 Fire blocks adjacent hexes.";
    case 2: return "Bad Weather. Roll D6: 1-2 Inclement (Lose 1 Life), 3-4 Strong Winds (Lose equipment), 5-6 Thick Fog (+3 days travel, 50% chance to get lost).";
    case 3: return "Food Spoils. Half of your food (round up) has been spoiled.";
    case 4: return "You Become Lost. Add +4 days travel (spend 3 rations). Roll D6: 1-2 Return to previous Region, 3-6 End up in random adjacent hex.";
    case 5: return "Camp Disease. Two random heroes affected. Lose 1 max health and -1 on all rolls until recovered (Rest 10 days or pay 20 GP in Settlement).";
    case 6: return "Mosquito Swarm. Save vs L2 Poison. Success: Lose 1 life, Failure: Lose 2 Lives.";
    case 7: return "Injured Party Member. Must rest 1 day. Cannot fight if attacked. Roll D6 next day to see if healed.";
    case 8: return "Unholy site. Save vs Level TIER+3 Curse or get -TIER to attack/defense. Needs blessing to lift.";
    case 9: return "Magic Drain. All spellcasters lose d3 spells.";
    case 10: return "Dead-end. Terrain impassable. Lose 2 days walking back. Roll for another HEX EVENT.";
  }
  return "Unknown Trouble";
}

export function getWeatherCondition(roll: number) {
  switch (roll) {
    case 2: return "Cursed Aura: -1 on all rolls until blessed. Clerics/Paladins save vs d6+LCL.";
    case 3: return "Fire Storm: Save vs Fire (d6+LCL) or lose 1 life. Bows destroyed. No hunting/resting.";
    case 4: return "Hail: Defense roll vs d6+LCL. Fail: Lose 1 life, lantern broken, d3 potions broken.";
    case 5: return "Thunderstorm: Save vs lightning (d6+LCL) or lose 1 life. Heavy armor loses TIER life. Muddy terrain applies.";
    case 6: return "Rain: Reroll Wandering Monsters. No hunting/resting. Muddy terrain applies.";
    case 7: return "Clear Skies: Ambush minor foes (+2 attack round 1). Hunting +1.";
    case 8: return "Strong Winds: Move cost +1. Ranged weapons -1. Flying enemies -1 Level. Hunting -1. No resting.";
    case 9: return "Unnatural Fog: No ranged weapons. 50% chance monsters surprise or party ambushes. Fleeing automatic. No hunting.";
    case 10: return "Scorching Heat: Save vs Heat (d6+LCL) or lose 1 life (2 in Desert). Heavy armor -2. Hunting costs 2 rations.";
    case 11: return "Blizzard: Save vs Blizzard (d6+LCL) or lose 1 life. Orientation Save or get lost (+3 days). Melee -1, Ranged -2.";
    case 12: return "Blessing Breeze: Party is blessed, +1 on all rolls until end of Journey.";
  }
  return "Unknown Weather";
}

export function getWildernessEvent(roll: number) {
  switch (roll) {
    case 2: return "Cursed Ritual Site: Spawn Weird Monster. Roll d6 for immunity: 1-2 Fire, 3-4 Sleep, 5-6 Lightning.";
    case 3: return "Trouble: Roll on the troubles table.";
    case 4: return "Hard to Navigate: Move costs increased by 50%. Roll another Hex Event.";
    case 5: return "Mosquito Swarm: -1 on all rolls while in Forest/Jungle/Swamp.";
    case 6: return "Landslide: Path blocked. Spend 2 additional days. Roll another Hex Event.";
    case 7: return "Muddy Terrain: Move costs +2. Hunting costs 2 rations. Monsters may fail to flee.";
    case 8: return "Hunter's Trap: Level HCL+3. Spot to disarm. If triggered, lose 1 Mount or hero injured (slowed, -2 rolls).";
    case 9: return "Quicksand: Level d3+TIER+3. Save or lose 1 life per turn until escape.";
    case 10: return "Shortcut: Move Cost reduced by 50%. Roll another Hex Event.";
    case 11: return "Flood: Save vs LCL Flood or lose 1 HP. Lose d6 random items. Must Camp and Rest 1 day.";
    case 12: return "Toll taker: Boss Monster asks for Bribe. Pay or Fight (2d6x10 treasure).";
  }
  return "Unknown Wilderness Event";
}

export function getDungeonRoomType(roll: number) {
  // Simplified mapping for d66 room types
  const isCorridor = [11, 12, 13, 14, 15, 16, 25, 32, 33, 34, 42, 45, 53, 55, 63, 64, 65].includes(roll);
  return isCorridor ? "Corridor" : "Room";
}

export function getDungeonRoomContent(roll: number, isCorridor: boolean) {
  switch (roll) {
    case 2: return "Treasure found: roll on the Treasure table.";
    case 3: return "Treasure protected by a trap. Roll on Traps table and Treasure table.";
    case 4: return isCorridor ? "Empty." : "Roll on the Special Events table.";
    case 5: return "Empty, but roll on the Special Feature table.";
    case 6: return "Roll on the Vermin table.";
    case 7: return "Roll on the Minions table.";
    case 8: return isCorridor ? "Empty." : "Roll on the Minions table.";
    case 9: return "Empty.";
    case 10: return isCorridor ? "Empty." : "Roll on the Weird Monsters table.";
    case 11: return "Roll on the Boss table. Then roll d6. Add +1 for every boss/weird monster encountered so far. If 6+, this is the final boss.";
    case 12: return isCorridor ? "Empty." : "Small dragon's lair. The small dragon counts as a boss and may be the final boss.";
  }
  return "Unknown Content";
}

export function getHexEvent(roll: number, hasRoad: boolean) {
  if (hasRoad) {
    switch (roll) {
      case 2: return "Weird or Boss Monster";
      case 3: return "Wilderness Table";
      case 4: return "Ambush! Wandering Monster";
      case 5: return "Imperial Riders";
      case 6: return "Vermin";
      case 7: return "NPC Encounter";
      case 8: return "Denizen monsters";
      case 9: return "Minions";
      case 10: return "Weather Condition + 1 Event";
      case 11: return "Troubles Table";
      case 12: return "Dragon Attack";
    }
  } else {
    switch (roll) {
      case 2: return "Quiet / Body / Hidden Chest";
      case 3: return "Weird Monster";
      case 4: return "Weather Condition + 1 Event";
      case 5: return "Troubles Table";
      case 6: return "Ambush! Wandering Monster";
      case 7: return "Denizen monsters (Surprise)";
      case 8: return "Wilderness Table";
      case 9: return "Ambush! Wandering Monster";
      case 10: return "NPC Encounter";
      case 11: return "Dragon Attack";
      case 12: return "Troubles Table + 1 Event";
    }
  }
  return "None";
}

export function getSeaHexEvent(roll: number) {
  switch (roll) {
    case 3: return "Peaceful Journey";
    case 4: case 5: return "Water Elemental Attack!";
    case 6: return "Merchant Ship";
    case 7: return "Pirates on the horizon!";
    case 8: case 9: return "Denizen (Sea) Monsters";
    case 10: return "Island Discovery";
    case 11: return "Ambush! Merfolk Attack!";
    case 12: return "Clear skies";
    case 13: return "Pirates on the horizon!";
    case 14: case 15: return "Weak winds";
    case 16: return "Devastating Storm!";
    case 17: case 18: return "Giant Kraken Attack!";
  }
  return "None";
}

export function getMoveCost(terrain: string, hasRoad: boolean, crossingRiver: boolean) {
  let cost = 4;
  if (['Desert', 'Mountains'].includes(terrain)) cost = 8;
  else if (['Swamp', 'Jungle', 'Glacier'].includes(terrain)) cost = 6;
  else if (['Forest', 'Hills'].includes(terrain)) cost = 5;
  
  if (hasRoad) cost -= 2;
  if (crossingRiver && !hasRoad) cost += 1;
  
  return Math.max(1, cost);
}

export function simulateRoll(notation: string): number {
  const match = notation.match(/^(\d*)d(\d+)$/i);
  if (!match) return 1;
  const count = parseInt(match[1]) || 1;
  const sides = parseInt(match[2]);
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

export function getNeighbor(q: number, r: number, direction: number) {
  const isOdd = (q % 2 !== 0);
  switch (direction) {
    case 6: return { q, r: r - 1 }; // Top
    case 3: return { q, r: r + 1 }; // Bottom
    case 1: return { q: q + 1, r: isOdd ? r : r - 1 }; // Top-Right
    case 2: return { q: q + 1, r: isOdd ? r + 1 : r }; // Bottom-Right
    case 4: return { q: q - 1, r: isOdd ? r + 1 : r }; // Bottom-Left
    case 5: return { q: q - 1, r: isOdd ? r : r - 1 }; // Top-Left
  }
  return { q, r };
}

export function getOppositeEdge(edge: number) {
  switch (edge) {
    case 1: return 4;
    case 2: return 5;
    case 3: return 6;
    case 4: return 1;
    case 5: return 2;
    case 6: return 3;
  }
  return 1;
}

export function getDirectionName(dir: number) {
  switch (dir) {
    case 6: return "Top";
    case 1: return "Top-Right";
    case 2: return "Bottom-Right";
    case 3: return "Bottom";
    case 4: return "Bottom-Left";
    case 5: return "Top-Left";
  }
  return "Unknown";
}
