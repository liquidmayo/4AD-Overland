import React, { useState, useEffect, useRef } from 'react';
import { Settings, Map as MapIcon, Tent, Compass, Sword, ScrollText, Dices, Info, Users, Play } from 'lucide-react';
import HexMap, { HexData } from './HexMap';
import DiceModal, { RollRequest } from './DiceModal';
import { 
  TERRAIN_COLORS, getTerrain, getSpecialFeature, getHexEvent, getSeaHexEvent, 
  getMoveCost, simulateRoll, getNeighbor, getOppositeEdge, getDirectionName,
  Character, CharacterClass, generateStartingCharacter,
  getNPCEncounter, getTroubles, getWeatherCondition, getWildernessEvent,
  getDungeonRoomType, getDungeonRoomContent
} from './engine';

export default function App() {
  const [party, setParty] = useState<Character[]>([]);
  const [isSetup, setIsSetup] = useState(true);
  
  const [hexes, setHexes] = useState<Record<string, HexData>>({});
  const [partyHex, setPartyHex] = useState<{q: number, r: number} | null>(null);
  const [selectedHex, setSelectedHex] = useState<{q: number, r: number} | null>(null);
  
  const [logs, setLogs] = useState<{id: number, text: string}[]>([]);
  const [autoRoll, setAutoRoll] = useState(true);
  const [rollQueue, setRollQueue] = useState<RollRequest[]>([]);
  
  const [rations, setRations] = useState(20);
  const [days, setDays] = useState(0);
  const [gold, setGold] = useState(40);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (text: string) => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), text }]);
  };

  const requestRoll = async (notation: string, reason: string, isMinor = false): Promise<number> => {
    if (autoRoll || isMinor) {
      const result = simulateRoll(notation);
      if (!isMinor) addLog(`Rolled ${notation} for ${reason}: ${result}`);
      return result;
    }
    return new Promise((resolve) => {
      setRollQueue(q => [...q, { id: Math.random().toString(), notation, reason, resolve }]);
    });
  };

  const handleManualRoll = (val: number) => {
    const req = rollQueue[0];
    addLog(`Manually rolled ${req.notation} for ${req.reason}: ${val}`);
    req.resolve(val);
    setRollQueue(q => q.slice(1));
  };

  const handleCreateParty = () => {
    const newParty = [
      generateStartingCharacter("Hero 1", "Warrior"),
      generateStartingCharacter("Hero 2", "Cleric"),
      generateStartingCharacter("Hero 3", "Rogue"),
      generateStartingCharacter("Hero 4", "Wizard")
    ];
    setParty(newParty);
    const totalGold = newParty.reduce((sum, c) => sum + c.gold, 0);
    setGold(totalGold);
    setIsSetup(false);
    addLog("Party created. Ready to explore!");
  };

  const generateHomeTown = async () => {
    addLog("--- Generating Home-Town ---");
    const terrainRoll = await requestRoll("d100", "Home-Town Terrain");
    const terrain = getTerrain(terrainRoll);
    
    const roadEntry = await requestRoll("d6", "Home-Town Road Entry Edge");
    let roadExit = await requestRoll("d6", "Home-Town Road Exit Edge");
    while (roadExit === roadEntry) {
      roadExit = await requestRoll("d6", "Home-Town Road Exit Edge (must be different)", true);
    }

    const riverEntry = await requestRoll("d6", "Home-Town River Entry Edge");
    let riverExit = await requestRoll("d6", "Home-Town River Exit Edge");
    while (riverExit === riverEntry) {
      riverExit = await requestRoll("d6", "Home-Town River Exit Edge (must be different)", true);
    }

    const homeHex: HexData = {
      q: 0, r: 0,
      terrain,
      roads: [roadEntry, roadExit],
      rivers: [riverEntry, riverExit],
      feature: "City (Home Base)",
      events: ["Home-Town generated."]
    };

    setHexes({ "0,0": homeHex });
    setPartyHex({ q: 0, r: 0 });
    setSelectedHex({ q: 0, r: 0 });
    addLog(`Started in Home-Town (City) in ${terrain}.`);
  };

  const getRandomExits = (available: number[], count: number) => {
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const generatePaths = async (incoming: number[], type: "Road" | "River", terrain?: string): Promise<number[]> => {
    let paths = [...incoming];
    const availableExits = [1, 2, 3, 4, 5, 6].filter(e => !incoming.includes(e));

    if (incoming.length === 0) {
      let startProb = 0;
      if (type === "River" && terrain) {
        const probs: Record<string, number> = {
          'Desert': 10, 'Glacier': 80, 'Swamp': 60, 'Forest': 50,
          'Jungle': 50, 'Grasslands': 30, 'Mountains': 40, 'Hills': 25, 'Sea/Lake': 0
        };
        startProb = probs[terrain] || 0;
      } else if (type === "Road") {
        startProb = 16.67; // ~1 in 6
      }

      if (startProb > 0) {
        const roll = await requestRoll("d100", `Does a new ${type} start? (${startProb}%)`, true);
        if (roll <= startProb) {
          const exit = await requestRoll("d6", `New ${type} exit edge`, true);
          paths.push(exit);
        }
      }
    } else if (incoming.length === 1) {
      const roll = await requestRoll("d6", `${type} Continuation`);
      if (roll >= 2 && roll <= 4) {
        paths.push(...getRandomExits(availableExits, 1));
      } else if (roll === 5) {
        paths.push(...getRandomExits(availableExits, 2));
      } else if (roll === 6) {
        paths.push(...getRandomExits(availableExits, 3));
      }
    } else if (incoming.length === 2) {
      const roll = await requestRoll("d6", `${type} Intersection`);
      if (roll === 5) {
        paths.push(...getRandomExits(availableExits, 1));
      } else if (roll === 6) {
        paths.push(...getRandomExits(availableExits, 2));
      }
    } else if (incoming.length === 3) {
      const roll = await requestRoll("d6", `${type} Intersection`);
      if (roll === 6) {
        paths.push(...getRandomExits(availableExits, 1));
      }
    }
    return paths;
  };

  const exploreHex = async (direction: number) => {
    if (!partyHex) return;
    
    const n = getNeighbor(partyHex.q, partyHex.r, direction);
    const key = `${n.q},${n.r}`;
    
    addLog(`--- Moving ${getDirectionName(direction)} ---`);

    if (hexes[key]) {
      // Move to explored hex
      const target = hexes[key];
      const hasRoad = target.roads.includes(getOppositeEdge(direction));
      const crossingRiver = target.rivers.includes(getOppositeEdge(direction));
      const cost = getMoveCost(target.terrain, hasRoad, crossingRiver);
      
      setDays(d => d + cost);
      setRations(r => r - cost);
      setPartyHex(n);
      setSelectedHex(n);
      addLog(`Moved to explored hex. Cost: ${cost} days/rations.`);
      return;
    }

    // Generate new hex
    const terrainRoll = await requestRoll("d100", "Terrain Type");
    const terrain = getTerrain(terrainRoll);
    addLog(`Discovered ${terrain}.`);

    const incomingRoads: number[] = [];
    const incomingRivers: number[] = [];
    
    for (let i = 1; i <= 6; i++) {
      const opp = getOppositeEdge(i);
      const neighborCoords = getNeighbor(n.q, n.r, i);
      const nKey = `${neighborCoords.q},${neighborCoords.r}`;
      const neighbor = hexes[nKey];
      if (neighbor) {
        if (neighbor.roads.includes(opp)) incomingRoads.push(i);
        if (neighbor.rivers.includes(opp)) incomingRivers.push(i);
      }
    }

    const roads = await generatePaths(incomingRoads, "Road", terrain);
    const rivers = await generatePaths(incomingRivers, "River", terrain);

    const hasRoad = roads.length > 0;
    let feature = null;
    let eventDesc = "";

    if (terrain !== 'Sea/Lake') {
      const featureRoll = await requestRoll("2d6", `Special Feature (${hasRoad ? 'Road' : 'Roadless'})`);
      feature = getSpecialFeature(featureRoll, hasRoad);
      if (feature) addLog(`Found a Special Feature: ${feature}`);

      const eventRoll = await requestRoll("2d6", `Hex Event (${hasRoad ? 'Road' : 'Roadless'})`);
      eventDesc = getHexEvent(eventRoll, hasRoad);
    } else {
      const islandRoll = await requestRoll("d100", "Is there an Island? (30% chance)");
      if (islandRoll <= 30) {
        const featureRoll = await requestRoll("2d6", "Special Feature (Island)");
        feature = getSpecialFeature(featureRoll, false) + " (On Island)";
        addLog(`Found an Island with: ${feature}`);
      }

      const eventRoll = await requestRoll("3d6", "Sea Hex Event");
      eventDesc = getSeaHexEvent(eventRoll);
    }
    
    addLog(`Event: ${eventDesc}`);

    const newHex: HexData = {
      q: n.q, r: n.r,
      terrain,
      roads,
      rivers,
      feature,
      events: [eventDesc]
    };

    const crossingRiver = incomingRivers.includes(getOppositeEdge(direction));
    const cost = getMoveCost(terrain, hasRoad, crossingRiver);
    
    setDays(d => d + cost);
    setRations(r => r - cost);

    setHexes(prev => ({ ...prev, [key]: newHex }));
    setPartyHex(n);
    setSelectedHex(n);
    addLog(`Exploration complete. Cost: ${cost} days/rations.`);
  };

  const handleRest = () => {
    setDays(d => d + 3);
    setRations(r => r - 3);
    addLog("Rested in the wild for 3 days. Recovered 1 HP per character.");
  };

  const handleForage = async () => {
    if (!partyHex) return;
    const hex = hexes[`${partyHex.q},${partyHex.r}`];
    if (['Desert', 'Swamp'].includes(hex.terrain)) {
      addLog("Cannot forage in Desert or Swamp!");
      return;
    }
    
    setDays(d => d + 1);
    setRations(r => r - 1);
    
    const roll = await requestRoll("d10", "Forage Roll (add Hunting skill if applicable)");
    let fm = 0;
    if (['Jungle', 'Forest'].includes(hex.terrain)) fm = 2;
    if (['Glacier'].includes(hex.terrain)) fm = -3;
    if (['Mountains'].includes(hex.terrain)) fm = -2;
    if (['Sea/Lake'].includes(hex.terrain)) fm = -4;

    const total = roll + fm;
    if (total <= 1) {
      addLog("Attacked by a PREDATOR! 1 damage to 1d4 heroes. No rations gained.");
    } else if (total <= 3) {
      addLog("Found nothing to hunt.");
    } else if (total <= 5) {
      const gained = 5 + fm;
      setRations(r => Math.min(30, r + gained));
      addLog(`Hunted small preys. Gained ${gained} rations.`);
    } else if (total <= 8) {
      const gained = 8 + fm;
      setRations(r => Math.min(30, r + gained));
      addLog(`Hunted sizable prey. Gained ${gained} rations.`);
    } else if (total === 9) {
      const gained = 10 + fm;
      setRations(r => Math.min(30, r + gained));
      addLog(`Hunted large prey. Gained ${gained} rations.`);
    } else {
      const gained = 15 + fm;
      setRations(r => Math.min(30, r + gained));
      addLog(`Hunted very large prey. Gained ${gained} rations.`);
    }
  };

  const handleResolveEvent = async () => {
    if (!selectedHexData) return;
    const eventDesc = selectedHexData.events[selectedHexData.events.length - 1];
    
    if (eventDesc.includes("NPC Encounter")) {
      const roll = await requestRoll("d20", "NPC Encounter Table");
      addLog(`NPC Encounter: ${getNPCEncounter(roll)}`);
    } else if (eventDesc.includes("Troubles Table")) {
      const roll = await requestRoll("d10", "Troubles Table");
      addLog(`Trouble: ${getTroubles(roll)}`);
    } else if (eventDesc.includes("Weather Condition")) {
      const roll = await requestRoll("2d6", "Weather Condition Table");
      addLog(`Weather: ${getWeatherCondition(roll)}`);
    } else if (eventDesc.includes("Wilderness Table")) {
      const roll = await requestRoll("2d6", "Wilderness Table");
      addLog(`Wilderness Event: ${getWildernessEvent(roll)}`);
    } else if (eventDesc.includes("Wandering Monster")) {
      const roll = await requestRoll("2d6", "Wandering Monster Table");
      addLog(`Wandering Monster: Roll ${roll} (Check Denizen/Boss/Weird tables)`);
    } else {
      addLog(`Cannot auto-resolve: ${eventDesc}. Please refer to the rulebook.`);
    }
  };

  const handleEnterDungeon = async () => {
    addLog(`--- Entering Dungeon ---`);
    const roomRoll = await requestRoll("d66", "Dungeon Room Type");
    const roomType = getDungeonRoomType(roomRoll);
    addLog(`Generated ${roomType} (Roll ${roomRoll})`);
    
    const contentRoll = await requestRoll("2d6", "Room Content");
    const content = getDungeonRoomContent(contentRoll, roomType === "Corridor");
    addLog(`Contents: ${content}`);
  };

  const selectedHexData = selectedHex ? hexes[`${selectedHex.q},${selectedHex.r}`] : null;

  if (isSetup) {
    return (
      <div className="flex h-screen bg-slate-900 text-slate-100 items-center justify-center font-sans">
        <div className="max-w-2xl w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
          <div className="text-center mb-8">
            <Compass className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Tantalizing Trails of Turmoil & Treasure</h1>
            <p className="text-slate-400">Four Against Darkness Overland Generator</p>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-xl mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Create Your Party
            </h2>
            <p className="text-slate-400 mb-6">
              Your party consists of four brave adventurers. For this quick start, we will generate a classic party: Warrior, Cleric, Rogue, and Wizard.
            </p>
            <button 
              onClick={handleCreateParty}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 text-lg"
            >
              <Play className="w-5 h-5" />
              Generate Party & Start Adventure
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Main Map Area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center z-10">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Compass className="w-6 h-6 text-amber-400" />
              Tantalizing Trails of Turmoil & Treasure
            </h1>
            <p className="text-slate-400 text-sm">Four Against Darkness Overland Generator</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm bg-slate-800 px-3 py-1.5 rounded-full cursor-pointer hover:bg-slate-700 transition-colors">
              <input 
                type="checkbox" 
                checked={autoRoll} 
                onChange={e => setAutoRoll(e.target.checked)}
                className="rounded text-blue-500 focus:ring-blue-500 bg-slate-700 border-slate-600"
              />
              Auto-roll Dice
            </label>
          </div>
        </header>
        
        <div className="flex-1 relative">
          {Object.keys(hexes).length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={generateHomeTown}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-3"
              >
                <MapIcon className="w-6 h-6" />
                Generate Home-Town Hex
              </button>
            </div>
          ) : (
            <HexMap 
              hexes={hexes} 
              partyHex={partyHex} 
              selectedHex={selectedHex}
              onSelectHex={(q, r) => setSelectedHex({q, r})}
              onExplore={exploreHex}
            />
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-white shadow-xl flex flex-col z-20 border-l border-slate-200">
        
        {/* Party Stats */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Party Status</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-2 rounded border border-slate-200 text-center shadow-sm">
              <div className="text-xs text-slate-500">Days</div>
              <div className="font-bold text-lg">{days}</div>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200 text-center shadow-sm">
              <div className="text-xs text-slate-500">Rations</div>
              <div className={`font-bold text-lg ${rations <= 0 ? 'text-red-600' : rations <= 5 ? 'text-amber-600' : 'text-green-600'}`}>
                {rations}
              </div>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200 text-center shadow-sm">
              <div className="text-xs text-slate-500">Gold</div>
              <div className="font-bold text-lg text-amber-500">{gold}</div>
            </div>
          </div>
        </div>

        {/* Selected Hex Info */}
        <div className="p-4 border-b border-slate-200 flex-1 overflow-y-auto">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Selected Hex Info
          </h2>
          
          {selectedHexData ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500">Coordinates</div>
                <div className="font-medium">{selectedHexData.q}, {selectedHexData.r}</div>
              </div>
              
              <div>
                <div className="text-xs text-slate-500">Terrain</div>
                <div className="font-medium flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TERRAIN_COLORS[selectedHexData.terrain] }}></div>
                  {selectedHexData.terrain}
                </div>
              </div>

              {selectedHexData.feature && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
                  <div className="text-xs text-red-500 font-bold uppercase mb-1">Feature</div>
                  <div className="font-medium text-red-900">{selectedHexData.feature}</div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                <div className="text-xs text-blue-500 font-bold uppercase mb-1">Events</div>
                <ul className="list-disc list-inside text-sm text-blue-900 ml-2 space-y-1">
                  {selectedHexData.events.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>

              {partyHex?.q === selectedHex?.q && partyHex?.r === selectedHex?.r && (
                <div className="pt-4 space-y-2">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Hex Actions</h3>
                  
                  {selectedHexData.events.length > 0 && selectedHexData.events[selectedHexData.events.length - 1] !== "None" && (
                    <button onClick={handleResolveEvent} className="w-full flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-800 py-2 rounded-lg transition-colors font-medium">
                      <Dices className="w-4 h-4" /> Resolve Event
                    </button>
                  )}

                  {selectedHexData.feature && selectedHexData.feature.toLowerCase().includes("dungeon") && (
                    <button onClick={handleEnterDungeon} className="w-full flex items-center justify-center gap-2 bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-800 py-2 rounded-lg transition-colors font-medium">
                      <Sword className="w-4 h-4" /> Explore Dungeon
                    </button>
                  )}

                  <button onClick={handleRest} className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 py-2 rounded-lg transition-colors">
                    <Tent className="w-4 h-4" /> Rest in Wild (3 Days)
                  </button>
                  <button onClick={handleForage} className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 py-2 rounded-lg transition-colors">
                    <Sword className="w-4 h-4" /> Forage / Hunt (1 Day)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-sm italic text-center py-8">
              Select a hex on the map to view details.
            </div>
          )}
        </div>

        {/* Party Members */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 max-h-48 overflow-y-auto">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Party Members
          </h2>
          <div className="space-y-2">
            {party.map(char => (
              <div key={char.id} className="bg-white p-2 rounded border border-slate-200 shadow-sm text-sm">
                <div className="flex justify-between items-center font-bold">
                  <span>{char.name} ({char.charClass})</span>
                  <span className="text-red-600">HP: {char.currentLife}/{char.maxLife}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Eq: {char.equipment.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log */}
        <div className="h-64 bg-slate-900 text-slate-300 flex flex-col">
          <div className="p-2 bg-slate-950 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <ScrollText className="w-4 h-4" />
            Adventure Log
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm font-mono">
            {logs.map(log => (
              <div key={log.id} className="border-b border-slate-800 pb-2 last:border-0">{log.text}</div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {rollQueue.length > 0 && (
        <DiceModal request={rollQueue[0]} onRoll={handleManualRoll} />
      )}
    </div>
  );
}
