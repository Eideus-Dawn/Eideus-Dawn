// Eideus_Dawn/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import { initialEngineState } from './utils/initialState';
import { EngineState, ChatMessage, Transform, FaceType } from './types';
import TransformColumn from './components/TransformColumn';
import Chat from './components/Chat';
import RelationshipGraph from './components/RelationshipGraph';
import EntityHistoryLog from './components/EntityHistoryLog';
import LatticeVisualizer from './components/LatticeVisualizer';
import HelpPanel from './components/HelpPanel'; // Import HelpPanel
import { streamGameResponse } from './services/geminiService';
import { processTurn, getEmbedding, queryLattice, RetrievedMemory } from './services/memoryService';

const App: React.FC = () => {
  const [engineState, setEngineState] = useState<EngineState>(initialEngineState);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Rolling Context State
  const [contextStartIndex, setContextStartIndex] = useState(0);
  
  // UI State
  const [activePanel, setActivePanel] = useState<'identity' | 'world' | 'story' | 'memory' | 'menu' | 'help' | null>(null);
  const [leftPanelView, setLeftPanelView] = useState<'graph' | 'log'>('graph');
  const [selectedEntity, setSelectedEntity] = useState<{name: string, type: 'npc' | 'location'} | null>(null);
  const [showMobileGraph, setShowMobileGraph] = useState(false);

  // Lattice Control State
  const [latticeAxis, setLatticeAxis] = useState<'x' | 'y' | 'z'>('z');
  const [latticeSliceIndex, setLatticeSliceIndex] = useState(0);
  const [activeFace, setActiveFace] = useState<FaceType>(FaceType.TOP);

  // File Input Ref for Loading
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('eid_gemini_key') || process.env.API_KEY || '';
  });

  // Initial prompt trigger
  useEffect(() => {
    // Only auto-start if we have a key and haven't started (and no messages exist, meaning clean slate)
    if (!hasStarted && !isLoading && apiKey && messages.length === 0) {
       // Small timeout to allow UI to mount
       const timer = setTimeout(() => {
          // Pass true to hide this prompt from the user's chat log
          handleSendMessage("Start the game. I am in the tavern. I don't remember my name. Please introduce the key characters.", true);
          setHasStarted(true);
       }, 500);
       return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Transform Logic ---
  const updateTransform = (
    currentTransform: Transform,
    updateData: any
  ): Transform => {
    if (!updateData || !updateData.modifiers) return currentTransform;

    const newModifiers = [...currentTransform.modifiers];

    updateData.modifiers.forEach((modUpdate: any) => {
      const idx = modUpdate.index;
      if (idx !== undefined && idx >= 0 && idx < newModifiers.length) {
        if (modUpdate.name) newModifiers[idx].name = modUpdate.name;
        if (modUpdate.description) newModifiers[idx].description = modUpdate.description;
        if (modUpdate.score !== undefined) newModifiers[idx].score = modUpdate.score;

        if (modUpdate.slots) {
          const newSlots = [...newModifiers[idx].slots];
          modUpdate.slots.forEach((slotUpdate: any) => {
             const sIdx = slotUpdate.index;
             if (sIdx !== undefined && sIdx >= 0 && sIdx < newSlots.length) {
                if (slotUpdate.name) newSlots[sIdx].name = slotUpdate.name;
                if (slotUpdate.description) newSlots[sIdx].description = slotUpdate.description;
                if (slotUpdate.active !== undefined) newSlots[sIdx].active = slotUpdate.active;
                if (slotUpdate.associatedWith !== undefined) newSlots[sIdx].associatedWith = slotUpdate.associatedWith;
             }
          });
          newModifiers[idx].slots = newSlots;
        }
      }
    });

    return { ...currentTransform, modifiers: newModifiers };
  };

  // --- Game Loop ---
  const handleSendMessage = async (text: string, isHidden: boolean = false) => {
    if (!apiKey) {
      const errorMsg: ChatMessage = { role: 'system', content: "Please configure your Gemini API Key in the System Menu (Gear Icon) to proceed.", timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
      setActivePanel('menu');
      return;
    }

    setIsLoading(true);
    
    // Add User Message (Only if not hidden)
    if (!isHidden) {
      const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
      setMessages(prev => [...prev, userMsg]);
    }

    try {
      // 1. GENERATE EMBEDDING (Pre-Turn)
      // We do this first so we can Query the Lattice
      let currentInputEmbedding: number[] = [];
      let relevantMemories: RetrievedMemory[] = [];
      
      try {
         currentInputEmbedding = await getEmbedding(text, apiKey);
         
         // 2. QUERY LATTICE (Quantum RAG)
         if (engineState.memoryLattices.length > 0 && engineState.memoryLattices[0].length > 0) {
            relevantMemories = queryLattice(
               text, 
               currentInputEmbedding, 
               engineState.memoryLattices, 
               engineState.memoryRegistry
            );
            if (relevantMemories.length > 0) {
               console.log("Memory Resonance Detected:", relevantMemories);
            }
         }
      } catch (memErr) {
         console.warn("RAG Process Failed (Continuing without memory):", memErr);
      }

      // 3. GENERATE NARRATIVE (With Memories Injected)
      const activeHistory = messages.slice(contextStartIndex).map(m => ({ role: m.role, content: m.content }));
      
      const aiMsgTimestamp = Date.now() + 1;
      setMessages(prev => [...prev, { role: 'model', content: '', timestamp: aiMsgTimestamp }]);

      let fullNarrative = '';
      let jsonBuffer = '';
      let isCollectingJSON = false;
      
      // NEW: A buffer to catch the separator if it gets split across chunks
      let streamBuffer = ''; 
      const SEPARATOR = '|||JSON|||';

      const stream = streamGameResponse(activeHistory, text, engineState, apiKey, relevantMemories);

      for await (const chunk of stream) {
        if (!chunk) continue;

        if (isCollectingJSON) {
          // Optimization: Once we found the separator, everything else is definitely JSON data
          jsonBuffer += chunk;
          continue;
        }

        // Append new data to our rolling buffer
        streamBuffer += chunk;

        // Check if the separator exists anywhere in the buffer
        const splitIndex = streamBuffer.indexOf(SEPARATOR);

        if (splitIndex !== -1) {
          // SEPARATOR FOUND!
          // 1. Extract the final piece of narrative
          const narrativePart = streamBuffer.slice(0, splitIndex);
          fullNarrative += narrativePart;
          
          // 2. Start the JSON buffer with the remainder
          const remainder = streamBuffer.slice(splitIndex + SEPARATOR.length);
          jsonBuffer += remainder;
          
          isCollectingJSON = true;
          streamBuffer = ''; // Clear buffer to save memory

          // Final Narrative Update
          setMessages(prev => prev.map(msg => 
              msg.timestamp === aiMsgTimestamp ? { ...msg, content: fullNarrative } : msg
          ));

        } else {
          // SEPARATOR NOT FOUND YET
          // We can't display the whole buffer, because the end of it might be "|||"
          // waiting for "JSON|||" in the next chunk.
          
          // Safe Length = Total Length - (Separator Length - 1)
          // We keep the last few chars in reserve just in case.
          const safeLength = streamBuffer.length - SEPARATOR.length + 1;

          if (safeLength > 0) {
            const flushableText = streamBuffer.slice(0, safeLength);
            fullNarrative += flushableText;
            
            // Remove the flushed text from the buffer, keep the tail
            streamBuffer = streamBuffer.slice(safeLength);

            setMessages(prev => prev.map(msg => 
              msg.timestamp === aiMsgTimestamp ? { ...msg, content: fullNarrative } : msg
            ));
          }
        }
      }

      // Flush any remaining narrative text if JSON was never found
      if (!isCollectingJSON && streamBuffer.length > 0) {
        fullNarrative += streamBuffer;
        setMessages(prev => prev.map(msg => 
           msg.timestamp === aiMsgTimestamp ? { ...msg, content: fullNarrative } : msg
        ));
      }

      // 4. Update Game State (Improved Parsing)
      if (jsonBuffer.trim()) {
        try {
          // ROBUST PARSING FIX:
          // Instead of regex replacement, find the outer braces. 
          // This ignores leading "```json" or trailing "I hope this helps!" text.
          const firstBrace = jsonBuffer.indexOf('{');
          const lastBrace = jsonBuffer.lastIndexOf('}');

          if (firstBrace !== -1 && lastBrace !== -1) {
             const cleanJson = jsonBuffer.substring(firstBrace, lastBrace + 1);
             const data = JSON.parse(cleanJson);

             if (data.meta && data.meta.sceneChange === true) {
                setMessages(prev => {
                   const newLength = prev.length;
                   setContextStartIndex(newLength);
                   return [...prev, { role: 'system', content: "--- SCENE TRANSITION: CONTEXT WINDOW REFRESHED ---", timestamp: Date.now() + 2 }];
                });
             }

             setEngineState(prevState => {
               let newState = { ...prevState };

               if (data.playerUpdate) {
                 if (data.playerUpdate.name) newState.player.name = data.playerUpdate.name;
                 if (data.playerUpdate.status) newState.player.status = data.playerUpdate.status;
               }

               if (data.tavernUpdate) {
                  newState.tavernNPCs = data.tavernUpdate;
               }

               if (data.identityUpdate) {
                 if (data.identityUpdate.modifiers) {
                   const currentMods = prevState.identity.modifiers;
                   const updates = data.identityUpdate.modifiers;
                   let newArchive = { ...prevState.npcArchive };
                   let hasChanges = false;

                   updates.forEach((modUpdate: any) => {
                     const idx = modUpdate.index;
                     if (idx !== undefined && currentMods[idx]) {
                       const oldName = currentMods[idx].name;
                       const newName = modUpdate.name;

                       if (newName && oldName && newName !== oldName && !oldName.includes("Pending")) {
                          newArchive[oldName] = currentMods[idx].slots;
                          hasChanges = true;
                       }
                     }
                   });
                   
                   if (hasChanges) newState.npcArchive = newArchive;
                 }
                 newState.identity = updateTransform(prevState.identity, data.identityUpdate);
               }

               if (data.worldUpdate) newState.world = updateTransform(prevState.world, data.worldUpdate);
               if (data.storyUpdate) newState.story = updateTransform(prevState.story, data.storyUpdate);

               return newState;
             });
          }
        } catch (jsonError) {
          console.warn("Visual Sync Error (JSON Parse):", jsonError);
        }
      }

      // 5. Store NEW Memory
      if (fullNarrative.trim().length > 10) {
        try {
          setEngineState(current => {
            const lattices = current.memoryLattices.length ? current.memoryLattices : [[]];
            const activePageIndex = lattices.length - 1;
            const currentLatticeLen = lattices[activePageIndex].length;

            processTurn(
              { input: text, output: fullNarrative },
              apiKey,
              currentLatticeLen,
              activePageIndex
            ).then(({ newNode, newRegistryData }) => {
               setEngineState(prev => {
                  const newLattices = [...prev.memoryLattices];
                  if (newLattices.length === 0) newLattices.push([]);
                  
                  let targetPageIdx = activePageIndex;
                  
                  // Optimization: Handle Page Overflow
                  if (newLattices[targetPageIdx].length >= 343) {
                     newLattices.push([]);
                     targetPageIdx++;
                     newNode.latticeIndex = targetPageIdx;
                     newNode.x = 0; newNode.y = 0; newNode.z = 0;
                  }

                  newLattices[targetPageIdx] = [...newLattices[targetPageIdx], newNode];

                  return {
                     ...prev,
                     memoryLattices: newLattices,
                     memoryRegistry: { ...prev.memoryRegistry, ...newRegistryData }
                  };
               });
            });

            return current;
          });
        } catch (memError) {
           console.warn("Memory System Error:", memError);
        }
      }

    } catch (error) {
      console.error("Game Engine Error:", error);
      const errorMsg: ChatMessage = { role: 'system', content: `Connection Error: ${(error as Error).message}`, timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Save / Load Handlers ---
  const handleSave = () => {
    const saveData = {
      engineState,
      messages,
      hasStarted,
      contextStartIndex,
      timestamp: Date.now()
    };
    
    // Create a blob and trigger download
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eideus_save_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setActivePanel(null);
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Basic Validation
        if (parsed.engineState && Array.isArray(parsed.messages)) {
           setEngineState(parsed.engineState);
           setMessages(parsed.messages);
           setHasStarted(parsed.hasStarted);
           setContextStartIndex(parsed.contextStartIndex || 0);
           alert("Game Loaded Successfully from File.");
           setActivePanel(null);
        } else {
           throw new Error("Invalid Save File Format");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load save file: Invalid format.");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again
    event.target.value = '';
  };

  const handleNewGame = () => {
    if(window.confirm("Start a New Game? Unsaved progress will be lost.")) {
      // 1. Reset State
      setEngineState(initialEngineState);
      setMessages([]);
      setContextStartIndex(0);
      setHasStarted(false);
      setActivePanel(null);
      
      // 2. Trigger Initial Prompt (if API key exists)
      if (apiKey) {
        setTimeout(() => {
          handleSendMessage("Start the game. I am in the tavern. I don't remember my name. Please introduce the key characters.", true);
          setHasStarted(true);
        }, 500);
      }
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem('eid_gemini_key', newKey);
  };

  // --- UI Handlers ---
  const togglePanel = (panel: 'identity' | 'world' | 'story' | 'memory' | 'menu' | 'help') => {
    setActivePanel(prev => prev === panel ? null : panel);
    if (showMobileGraph) setShowMobileGraph(false);
  };

  const handleEntitySelect = (name: string, type: 'npc' | 'location') => {
    setSelectedEntity({ name, type });
    setLeftPanelView('log');
  };

  const handleBackToGraph = () => {
    setLeftPanelView('graph');
    setSelectedEntity(null);
  };

  // --- Right Dock Render Logic ---
  const renderRightDock = () => {
    if (activePanel === 'memory') {
      // MEMORY MODE DOCK
      return (
        <div className="w-16 bg-[#080810] border-l border-white/10 flex flex-col items-center py-6 gap-3 z-[60] shrink-0">
           {/* Axis Toggles */}
           <div className="flex flex-col gap-2 p-1 bg-white/5 rounded-lg mb-2">
              {(['x', 'y', 'z'] as const).map(axis => (
                <button
                  key={axis}
                  onClick={() => setLatticeAxis(axis)}
                  className={`w-10 h-8 rounded flex items-center justify-center font-bold font-mono text-sm transition-all ${
                    latticeAxis === axis 
                      ? 'bg-purple-500 text-white shadow-lg' 
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {axis.toUpperCase()}
                </button>
              ))}
           </div>
           
           <div className="w-8 h-px bg-white/10 my-1"></div>

           {/* Face Toggles */}
           <div className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveFace(FaceType.FRONT)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeFace === FaceType.FRONT ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'text-gray-600 hover:text-green-400'}`}
                title="Input (Front)"
              >
                <i className="fa-solid fa-right-to-bracket"></i>
              </button>
              <button 
                onClick={() => setActiveFace(FaceType.BACK)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeFace === FaceType.BACK ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'text-gray-600 hover:text-blue-400'}`}
                title="Output (Back)"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
              <button 
                onClick={() => setActiveFace(FaceType.TOP)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeFace === FaceType.TOP ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'text-gray-600 hover:text-yellow-400'}`}
                title="Scene (Top)"
              >
                <i className="fa-solid fa-film"></i>
              </button>
               <button 
                onClick={() => setActiveFace(FaceType.LEFT)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeFace === FaceType.LEFT ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-gray-600 hover:text-red-400'}`}
                title="Tags (Left)"
              >
                <i className="fa-solid fa-tags"></i>
              </button>
               <button 
                onClick={() => setActiveFace(FaceType.RIGHT)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeFace === FaceType.RIGHT ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-600 hover:text-cyan-400'}`}
                title="Names (Right)"
              >
                <i className="fa-solid fa-users"></i>
              </button>
               <button 
                onClick={() => setActiveFace(FaceType.BOTTOM)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${activeFace === FaceType.BOTTOM ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'text-gray-600 hover:text-purple-400'}`}
                title="Vector (Bottom)"
              >
                <i className="fa-solid fa-wave-square"></i>
              </button>
           </div>

           <div className="flex-1"></div>

           {/* Return Button */}
           <button onClick={() => setActivePanel(null)} className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-500/20" title="Close Memory">
              <i className="fa-solid fa-xmark"></i>
           </button>
        </div>
      );
    }

    // STANDARD MODE DOCK
    return (
      <div className="w-16 bg-[#080810] border-l border-white/10 flex flex-col items-center py-6 gap-6 z-[60] shrink-0">
          <button onClick={() => togglePanel('identity')} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${activePanel === 'identity' ? 'bg-green-500/20 text-green-400 glow-box-green' : 'text-gray-500 hover:text-green-400 hover:bg-white/5'}`} title="Identity Phase">
            <i className="fa-solid fa-fingerprint text-xl"></i>
          </button>
          <button onClick={() => togglePanel('world')} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${activePanel === 'world' ? 'bg-yellow-500/20 text-yellow-400 glow-box-yellow' : 'text-gray-500 hover:text-gray-400 hover:bg-white/5'}`} title="World Phase">
            <i className="fa-solid fa-earth-americas text-xl"></i>
          </button>
          <button onClick={() => togglePanel('story')} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${activePanel === 'story' ? 'bg-red-500/20 text-red-400 glow-box-red' : 'text-gray-500 hover:text-red-400 hover:bg-white/5'}`} title="Inception Phase">
            <i className="fa-solid fa-book-open text-xl"></i>
          </button>
          
          {/* MEMORY TAB */}
          <button onClick={() => togglePanel('memory')} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${activePanel === 'memory' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-purple-400 hover:bg-white/5'}`} title="Lattice Memory">
            <i className="fa-solid fa-microchip text-xl"></i>
          </button>

          <div className="flex-1"></div>

          {/* HELP TAB */}
          <button onClick={() => togglePanel('help')} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${activePanel === 'help' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-cyan-400 hover:bg-white/5'}`} title="Instructions">
            <i className="fa-solid fa-circle-question text-xl"></i>
          </button>

          <button onClick={() => togglePanel('menu')} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${activePanel === 'menu' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} title="System Menu">
            <i className="fa-solid fa-gear text-xl"></i>
          </button>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-eid-dark text-gray-200 overflow-hidden font-sans">
      {/* Hidden File Input for Loading */}
      <input 
        type="file" 
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleFileLoad}
      />

      {/* Top Bar */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 md:px-6 bg-black/50 backdrop-blur-md z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowMobileGraph(!showMobileGraph)}
            className={`md:hidden w-8 h-8 flex items-center justify-center rounded transition-colors ${showMobileGraph ? 'bg-eid-accent text-white' : 'text-gray-400'}`}
          >
            <i className={`fa-solid ${showMobileGraph ? 'fa-xmark' : 'fa-network-wired'}`}></i>
          </button>
          <i className="fa-solid fa-cube text-id-glow text-xl hidden md:block"></i>
          <h1 className="font-bold tracking-wider text-base md:text-lg">EIDEUS DAWN <span className="text-[10px] font-mono text-gray-500 ml-2">VER. 1.0.0</span></h1>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
           <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase text-gray-500 hidden md:block">Subject</span>
              <span className="text-xs md:text-sm font-bold text-white max-w-[100px] truncate">{engineState.player.name || "UNIDENTIFIED"}</span>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase text-gray-500 hidden md:block">Status</span>
              <span className="text-xs md:text-sm font-mono text-id-glow">{engineState.player.status}</span>
           </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Panel: Relational Web OR Log */}
        <div className={`
          border-r border-white/10 bg-black/95 backdrop-blur-sm md:bg-black/20 
          transition-all duration-300
          md:relative md:w-[400px] md:block md:z-10
          ${showMobileGraph ? 'absolute inset-0 right-16 z-30 flex flex-col' : 'hidden'}
        `}>
           {leftPanelView === 'graph' ? (
             <RelationshipGraph 
               npcs={engineState.tavernNPCs} 
               identityTransform={engineState.identity}
               worldTransform={engineState.world}
               onSelectLeaf={handleEntitySelect}
             />
           ) : (
             <EntityHistoryLog 
                entityName={selectedEntity?.name || ''}
                entityType={selectedEntity?.type || 'npc'}
                messages={messages}
                onBack={handleBackToGraph}
             />
           )}
        </div>

        {/* Center: Chat */}
        <div className="flex-1 flex flex-col min-w-0 bg-eid-dark relative z-0">
             <Chat 
               messages={messages} 
               onSendMessage={(text) => handleSendMessage(text, false)} 
               isLoading={isLoading} 
             />
        </div>

        {/* Backdrop */}
        {(activePanel || (showMobileGraph && window.innerWidth < 768)) && (
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity duration-300 cursor-pointer"
              onClick={() => {
                setActivePanel(null);
                setShowMobileGraph(false);
              }}
            />
        )}

        {/* Slide-out Panel (Right) */}
        <div 
          className={`
            absolute top-0 right-16 bottom-0 
            bg-eid-panel border-l border-white/10 z-50 
            shadow-2xl transform transition-transform duration-300 ease-in-out
            w-[calc(100vw-4rem)] md:w-[600px]
            ${activePanel ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {activePanel === 'identity' && <TransformColumn transform={engineState.identity} colorTheme="green" />}
          {activePanel === 'world' && <TransformColumn transform={engineState.world} colorTheme="yellow" />}
          {activePanel === 'story' && <TransformColumn transform={engineState.story} colorTheme="red" />}
          
          {/* MEMORY PANEL */}
          {activePanel === 'memory' && (
             <LatticeVisualizer 
                lattice={engineState.memoryLattices[engineState.memoryLattices.length - 1] || []}
                registry={engineState.memoryRegistry}
                pageIndex={engineState.memoryLattices.length - 1}
                axis={latticeAxis}
                sliceIndex={latticeSliceIndex}
                onSliceChange={setLatticeSliceIndex}
                activeFace={activeFace}
             />
          )}

          {/* HELP PANEL */}
          {activePanel === 'help' && <HelpPanel />}
          
          {/* MENU PANEL */}
          {activePanel === 'menu' && (
            <div className="flex flex-col h-full p-6 md:p-8 space-y-4 overflow-y-auto">
               <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest border-b border-white/10 pb-4">Game Menu</h2>
               
               <div className="bg-black/30 border border-white/10 p-4 rounded mb-2">
                 <label className="block text-[10px] uppercase text-gray-500 mb-2 font-mono tracking-wider">Gemini API Key</label>
                 <input 
                   type="password"
                   value={apiKey}
                   onChange={handleApiKeyChange}
                   placeholder="Enter AIza..."
                   className="w-full bg-black border border-gray-700 p-2 text-white text-xs font-mono rounded focus:border-id-glow focus:outline-none transition-colors"
                 />
                 <p className="text-[10px] text-gray-600 mt-2 italic">
                   Key is stored locally. Required for engine access.
                 </p>
               </div>

               <button onClick={handleNewGame} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-left px-6 rounded text-sm uppercase tracking-wider text-white hover:text-green-400 transition-colors flex items-center gap-4 group">
                 <i className="fa-solid fa-play text-gray-500 group-hover:text-green-400"></i> New Game
               </button>
               <button onClick={handleSave} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-left px-6 rounded text-sm uppercase tracking-wider text-white hover:text-yellow-400 transition-colors flex items-center gap-4 group">
                 <i className="fa-solid fa-file-export text-gray-500 group-hover:text-yellow-400"></i> Save to File
               </button>
               <button onClick={handleLoadClick} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-left px-6 rounded text-sm uppercase tracking-wider text-white hover:text-blue-400 transition-colors flex items-center gap-4 group">
                 <i className="fa-solid fa-file-import text-gray-500 group-hover:text-blue-400"></i> Load from File
               </button>

               <div className="mt-auto pt-8 border-t border-white/10">
                 <button onClick={() => window.location.reload()} className="w-full py-3 text-center text-xs text-gray-500 hover:text-red-400 uppercase tracking-widest">
                    Exit to Desktop (Refresh)
                 </button>
               </div>
            </div>
          )}
        </div>

        {/* Dynamic Right Dock */}
        {renderRightDock()}

      </div>
    </div>
  );
};

export default App;