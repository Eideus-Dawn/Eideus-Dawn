
import React, { useState } from 'react';

type HelpPage = 'principles' | 'features' | 'controls' | 'causality' | 'engine' | 'about';

// Data structure for Control Details
const CONTROL_DETAILS: Record<string, { title: string; description: string; technical: string; icon: string; color: string }> = {
  'identity': {
    title: 'Identity Phase',
    description: 'Displays the Protagonist\'s status and their 3 key relationships (Modifiers).',
    technical: 'Visualizes the "Identity Transform". Tracks relationship scores (0-100) and displays the 7 "Slots" (Child NPCs) for each active bond. This prevents the AI from forgetting who is important.',
    icon: 'fa-fingerprint',
    color: 'text-green-400'
  },
  'world': {
    title: 'World Phase',
    description: 'Displays the setting, current location, and major factions.',
    technical: 'Visualizes the "World Transform". Tracks Novelty (Physics/Magic), Geopolitics (Factions), and Local Geography. Ensures the AI keeps the setting consistent across turns.',
    icon: 'fa-earth-americas',
    color: 'text-yellow-400'
  },
  'story': {
    title: 'Story Phase',
    description: 'Displays the current plot drivers, villains, and random events.',
    technical: 'Visualizes the "Story Transform". Tracks Protagonists (Allies), Antagonists (Villains), and Mutation (Random Events). This drives the narrative conflict loop.',
    icon: 'fa-book-open',
    color: 'text-red-400'
  },
  'memory': {
    title: 'Lattice Memory',
    description: 'Opens the 3D Vector Memory Visualization panel.',
    technical: 'Accesses the 7x7x7 Coordinate System where embeddings are stored. Allows you to "slice" through the AI\'s memory to see how concepts cluster together spatially.',
    icon: 'fa-microchip',
    color: 'text-purple-400'
  },
  'menu': {
    title: 'System Menu',
    description: 'Access global settings like API Key, Save/Load, and New Game.',
    technical: 'Manages LocalStorage persistence and file I/O. The "Game State" saved here is a complete JSON snapshot of the engine.',
    icon: 'fa-gear',
    color: 'text-white'
  },
  'axis': {
    title: 'Axis Toggles (X/Y/Z)',
    description: 'Changes the direction you are "slicing" the memory cube.',
    technical: 'Z-Axis = Top-Down (Axial). Y-Axis = Front-Back (Coronal). X-Axis = Left-Right (Sagittal). Essential for finding patterns in the 3D embedding space.',
    icon: 'fa-arrows-to-dot',
    color: 'text-purple-300'
  },
  'faces': {
    title: 'Face Filters',
    description: 'Isolates specific types of data (Input, Output, Tags, Names).',
    technical: 'Each memory node is a cube with 6 faces. Toggling these changes the visualization to prioritize that specific data layer. (e.g., Selecting "Tags" highlights thematic connections).',
    icon: 'fa-layer-group',
    color: 'text-purple-300'
  }
};

const HelpPanel: React.FC = () => {
  const [activePage, setActivePage] = useState<HelpPage>('principles');
  const [selectedControl, setSelectedControl] = useState<string | null>(null);

  const navButton = (page: HelpPage, label: string, icon: string) => (
    <button
      onClick={() => { setActivePage(page); setSelectedControl(null); }}
      className={`
        flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg transition-all duration-200
        ${activePage === page 
          ? 'bg-white/10 text-white border border-white/20' 
          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'}
      `}
    >
      <i className={`fa-solid ${icon} w-5 text-center`}></i>
      <span className="text-xs uppercase tracking-wider font-bold">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-eid-panel w-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-black/20">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-1">
          Manual
        </h2>
        <p className="text-[10px] text-gray-500 font-mono">EIDEUS DAWN ENGINE PROTOCOLS</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-16 md:w-48 border-r border-white/10 flex flex-col p-2 gap-2 bg-black/10 shrink-0">
           {/* Mobile-friendly icons */}
           <div className="md:hidden flex flex-col gap-4 items-center pt-4">
              <button onClick={() => setActivePage('principles')} className={activePage === 'principles' ? 'text-white' : 'text-gray-600'}><i className="fa-solid fa-shapes"></i></button>
              <button onClick={() => setActivePage('features')} className={activePage === 'features' ? 'text-white' : 'text-gray-600'}><i className="fa-solid fa-eye"></i></button>
              <button onClick={() => setActivePage('controls')} className={activePage === 'controls' ? 'text-white' : 'text-gray-600'}><i className="fa-solid fa-gamepad"></i></button>
              <button onClick={() => setActivePage('causality')} className={activePage === 'causality' ? 'text-white' : 'text-gray-600'}><i className="fa-solid fa-diagram-project"></i></button>
              <button onClick={() => setActivePage('engine')} className={activePage === 'engine' ? 'text-white' : 'text-gray-600'}><i className="fa-solid fa-gears"></i></button>
              <button onClick={() => setActivePage('about')} className={activePage === 'about' ? 'text-white' : 'text-gray-600'}><i className="fa-solid fa-circle-info"></i></button>
           </div>
           
           {/* Desktop Sidebar */}
           <div className="hidden md:flex flex-col gap-1">
              {navButton('principles', 'Core Principles', 'fa-shapes')}
              {navButton('features', 'Visual Systems', 'fa-eye')}
              {navButton('controls', 'Interface & Controls', 'fa-gamepad')}
              {navButton('causality', 'Causality', 'fa-diagram-project')}
              {navButton('engine', 'The Loop', 'fa-gears')}
              {navButton('about', 'The Why', 'fa-circle-info')}
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          
          {activePage === 'principles' && (
            <div className="space-y-8 animate-fadeIn">
              <section>
                <h3 className="text-lg font-bold text-id-glow mb-3 uppercase tracking-wider">The 1x3x7 Architecture</h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  Eideus Dawn is not just a chatbot; it is a <strong>Neuro-Symbolic Engine</strong>. It imposes a rigid "skeleton" (Symbolic Logic) onto the "flesh" of the LLM (Neural Network).
                </p>
                <ul className="space-y-3">
                  <li className="bg-black/20 p-3 rounded border border-white/5">
                    <strong className="text-white block mb-1">1 Identity (The Anchor)</strong>
                    <span className="text-xs text-gray-400">The singular focus of the narrative simulation. Everything radiates from the Player's perspective.</span>
                  </li>
                  <li className="bg-black/20 p-3 rounded border border-white/5">
                    <strong className="text-white block mb-1">3 Transforms (The Pillars)</strong>
                    <span className="text-xs text-gray-400">Identity, World, and Story. These three pillars support the entire reality. By separating "Who," "Where," and "Why," we prevent the AI from conflating facts with fiction.</span>
                  </li>
                  <li className="bg-black/20 p-3 rounded border border-white/5">
                    <strong className="text-white block mb-1">7 Slots (The Complexity)</strong>
                    <span className="text-xs text-gray-400">Each modifier contains exactly 7 active slots. This constraint forces the AI to prioritize information, preventing the "infinite context sprawl" that confuses standard models.</span>
                  </li>
                </ul>
              </section>
            </div>
          )}

          {activePage === 'features' && (
            <div className="space-y-8 animate-fadeIn">
              <section>
                <h3 className="text-lg font-bold text-world-glow mb-3 uppercase tracking-wider">The Relational Web</h3>
                <div className="flex gap-4 items-start mb-4">
                  <div className="w-12 h-12 bg-black border border-world-glow/30 rounded flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-network-wired text-world-glow"></i>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Dynamic Social Graph (Left Panel)</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      This is not a static image. It is a live visualization of the AI's internal logic.
                    </p>
                  </div>
                </div>
                <ul className="list-disc pl-5 text-xs text-gray-400 space-y-2">
                  <li><strong>Orbit View:</strong> Shows the 6 immediate Tavern NPCs and their relationship scores to you.</li>
                  <li><strong>Detail View:</strong> Click any node to "drill down." The engine generates a radial fan showing <em>Minor NPCs</em> (right) and <em>Local Locations</em> (left) associated with that character.</li>
                  <li><strong>Hallucination Check:</strong> If a connection looks wrong here, it exposes a flaw in the model's logic immediately.</li>
                </ul>
              </section>

              <div className="w-full h-px bg-white/10 my-6"></div>

              <section>
                <h3 className="text-lg font-bold text-purple-400 mb-3 uppercase tracking-wider">Lattice Memory</h3>
                <div className="flex gap-4 items-start mb-4">
                  <div className="w-12 h-12 bg-black border border-purple-400/30 rounded flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-microchip text-purple-400"></i>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Spatial Vector Storage (Right Dock)</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Standard AI memory is a flat list. Eideus Dawn uses a 3D coordinate system (7x7x7 cubes).
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Every turn is converted into a mathematical vector (an embedding) and placed into a specific cube in the grid. We can then slice this grid to visualize how "memories" cluster together over time, creating a tangible map of the narrative history.
                </p>
              </section>
            </div>
          )}

          {activePage === 'controls' && (
             <div className="space-y-8 animate-fadeIn h-full flex flex-col">
                {!selectedControl ? (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">Interface Controls</h3>
                      <p className="text-xs text-gray-400">Select an icon to view detailed technical specifications.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {(['identity', 'world', 'story', 'memory', 'menu'] as const).map((key) => {
                          const item = CONTROL_DETAILS[key];
                          return (
                            <button 
                              key={key}
                              onClick={() => setSelectedControl(key)}
                              className="flex items-center gap-4 bg-black/20 p-4 rounded border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                            >
                              <div className={`w-12 h-12 rounded bg-black flex items-center justify-center border border-white/10 group-hover:border-white/30 ${item.color}`}>
                                <i className={`fa-solid ${item.icon} text-xl`}></i>
                              </div>
                              <div>
                                  <strong className={`${item.color} text-xs uppercase block mb-1`}>{item.title}</strong>
                                  <p className="text-[10px] text-gray-500 group-hover:text-gray-300">{item.description}</p>
                              </div>
                              <i className="fa-solid fa-chevron-right ml-auto text-gray-600 group-hover:text-white"></i>
                            </button>
                          );
                        })}
                    </div>

                    <div className="w-full h-px bg-white/10 my-4"></div>
                    <strong className="text-xs text-purple-400 uppercase tracking-wider mb-2 block">Lattice Tools</strong>
                    
                    <div className="grid grid-cols-2 gap-4">
                       {(['axis', 'faces'] as const).map((key) => {
                          const item = CONTROL_DETAILS[key];
                          return (
                            <button 
                              key={key}
                              onClick={() => setSelectedControl(key)}
                              className="bg-black/20 p-3 rounded border border-white/5 hover:bg-white/10 transition-all text-left"
                            >
                               <div className="flex items-center gap-2 mb-2">
                                  <i className={`fa-solid ${item.icon} ${item.color}`}></i>
                                  <strong className="text-white text-xs uppercase">{item.title}</strong>
                               </div>
                               <p className="text-[10px] text-gray-500 line-clamp-2">{item.description}</p>
                            </button>
                          );
                       })}
                    </div>
                  </>
                ) : (
                  <div className="animate-slideIn h-full flex flex-col">
                    <button 
                      onClick={() => setSelectedControl(null)}
                      className="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-6 uppercase tracking-wider"
                    >
                      <i className="fa-solid fa-arrow-left"></i> Back to List
                    </button>

                    <div className="bg-black/30 border border-white/10 rounded-xl p-8 flex-1">
                       <div className="flex items-center gap-4 mb-6">
                          <div className={`w-16 h-16 rounded-lg bg-black flex items-center justify-center border border-white/10 shadow-lg ${CONTROL_DETAILS[selectedControl].color}`}>
                             <i className={`fa-solid ${CONTROL_DETAILS[selectedControl].icon} text-3xl`}></i>
                          </div>
                          <div>
                             <h3 className={`text-2xl font-bold uppercase tracking-widest ${CONTROL_DETAILS[selectedControl].color}`}>
                                {CONTROL_DETAILS[selectedControl].title}
                             </h3>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <div>
                             <strong className="text-white text-xs uppercase tracking-wider block mb-2 border-b border-white/10 pb-1">Function</strong>
                             <p className="text-sm text-gray-300 leading-relaxed">
                                {CONTROL_DETAILS[selectedControl].description}
                             </p>
                          </div>
                          
                          <div>
                             <strong className="text-white text-xs uppercase tracking-wider block mb-2 border-b border-white/10 pb-1">Technical Role</strong>
                             <p className="text-sm text-gray-400 font-mono leading-relaxed bg-black/40 p-4 rounded border border-white/5">
                                {CONTROL_DETAILS[selectedControl].technical}
                             </p>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
             </div>
          )}

          {activePage === 'causality' && (
             <div className="space-y-8 animate-fadeIn">
                <section>
                   <h3 className="text-lg font-bold text-id-glow mb-3 uppercase tracking-wider">The 80% Threshold Rule</h3>
                   <div className="bg-black/20 p-4 rounded border border-green-500/20 mb-4">
                      <p className="text-sm text-gray-300 leading-relaxed">
                         The engine does not generate the entire world at once. It uses <strong>Lazy Loading</strong> based on relationship depth.
                      </p>
                   </div>
                   <ul className="space-y-4">
                      <li className="flex gap-4">
                         <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-xs shrink-0">0%</div>
                         <p className="text-xs text-gray-400 pt-1">At low relationship levels, an NPC is just a name and a vague description. They have no connections.</p>
                      </li>
                      <li className="flex gap-4">
                         <div className="w-8 h-8 rounded bg-green-900/50 flex items-center justify-center text-green-400 font-bold text-xs shrink-0 border border-green-500/50">80%</div>
                         <div>
                            <p className="text-xs text-gray-300 pt-1">When relationship score hits 80, the engine <strong>"Hydrates"</strong> the entity:</p>
                            <ul className="list-disc pl-4 mt-2 text-[10px] text-gray-400 space-y-1">
                               <li>Populates 7 "Identity Slots" (Family, Subordinates, Secrets).</li>
                               <li>Generates 1 "Local Geography" node (Home town/Lair).</li>
                               <li>Links to a "Faction" node (Geopolitics).</li>
                            </ul>
                         </div>
                      </li>
                   </ul>
                </section>

                <div className="w-full h-px bg-white/10 my-6"></div>

                <section>
                   <h3 className="text-lg font-bold text-red-400 mb-3 uppercase tracking-wider">Reputation Cascades</h3>
                   <p className="text-sm text-gray-300 leading-relaxed mb-6">
                      Actions have consequences. Because the engine links entities via the <strong>Relational Web</strong> (the Left Panel graph), a negative action propagates downstream like a virus.
                   </p>
                   
                   {/* Mechanics */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-black/20 p-3 rounded border border-white/5">
                        <div className="text-red-400 text-xs font-bold uppercase mb-2">1. Trigger</div>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          Player betrays a Main NPC (e.g., stealing, attacking, or insulting). The <strong>Relationship Score</strong> drops significantly.
                        </p>
                      </div>
                      <div className="bg-black/20 p-3 rounded border border-white/5">
                        <div className="text-red-400 text-xs font-bold uppercase mb-2">2. Propagation</div>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          The engine scans the <strong>Identity Slots</strong> of that NPC. It identifies all "Child NPCs" (subordinates, family).
                        </p>
                      </div>
                      <div className="bg-black/20 p-3 rounded border border-white/5">
                        <div className="text-red-400 text-xs font-bold uppercase mb-2">3. Manifestation</div>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          The `description` and `status` fields of all Child NPCs are rewritten to reflect the new hostility.
                        </p>
                      </div>
                   </div>

                   {/* Examples */}
                   <strong className="text-xs text-white uppercase tracking-wider block mb-3">Role-Based Consequences</strong>
                   <div className="overflow-hidden border border-white/10 rounded-lg">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-white/5 text-gray-400 font-mono uppercase">
                          <tr>
                            <th className="p-3 font-normal">Role</th>
                            <th className="p-3 font-normal">Before Cascade</th>
                            <th className="p-3 font-normal text-red-400">After Cascade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                          <tr>
                            <td className="p-3 font-bold">Merchant</td>
                            <td className="p-3 italic text-gray-500">"Offers fair prices."</td>
                            <td className="p-3 text-red-300">"Refuses service / Prices doubled."</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold">Guard</td>
                            <td className="p-3 italic text-gray-500">"Nods respectfully."</td>
                            <td className="p-3 text-red-300">"Aggressive / Attempts arrest."</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold">Informant</td>
                            <td className="p-3 italic text-gray-500">"Shares rumors."</td>
                            <td className="p-3 text-red-300">"Silent / Feigns ignorance."</td>
                          </tr>
                        </tbody>
                      </table>
                   </div>
                   
                   <p className="text-[10px] text-gray-500 mt-4 italic">
                      * Look at the Relational Web (Left Panel). The dashed lines connecting the Center Node to the Fan Nodes are the pathways this reputation data travels.
                   </p>
                </section>

                <div className="w-full h-px bg-white/10 my-6"></div>

                <section>
                   <h3 className="text-lg font-bold text-green-400 mb-3 uppercase tracking-wider">Benevolence Cascades</h3>
                   <p className="text-sm text-gray-300 leading-relaxed mb-6">
                      Just as hostility spreads, so does goodwill. Positive actions towards a key figure create a <strong>Benevolence Cascade</strong> that opens doors previously locked.
                   </p>

                   {/* Mechanics */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-black/20 p-3 rounded border border-white/5">
                        <div className="text-green-400 text-xs font-bold uppercase mb-2">1. Trigger</div>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          Player aids a Main NPC (e.g., quests, gifts, or defense). The <strong>Relationship Score</strong> increases.
                        </p>
                      </div>
                      <div className="bg-black/20 p-3 rounded border border-white/5">
                        <div className="text-green-400 text-xs font-bold uppercase mb-2">2. Propagation</div>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          The engine flags all associated Child NPCs within the social graph as "Allied".
                        </p>
                      </div>
                      <div className="bg-black/20 p-3 rounded border border-white/5">
                        <div className="text-green-400 text-xs font-bold uppercase mb-2">3. Manifestation</div>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          Entities provide discounts, intel, or safe passage based on their role in the network.
                        </p>
                      </div>
                   </div>

                   {/* Examples */}
                   <strong className="text-xs text-white uppercase tracking-wider block mb-3">Positive Reinforcement</strong>
                   <div className="overflow-hidden border border-white/10 rounded-lg">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-white/5 text-gray-400 font-mono uppercase">
                          <tr>
                            <th className="p-3 font-normal">Role</th>
                            <th className="p-3 font-normal">Before Cascade</th>
                            <th className="p-3 font-normal text-green-400">After Cascade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                          <tr>
                            <td className="p-3 font-bold">Merchant</td>
                            <td className="p-3 italic text-gray-500">"Standard rates."</td>
                            <td className="p-3 text-green-300">"Family discount applied."</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold">Guard</td>
                            <td className="p-3 italic text-gray-500">"Blocks path."</td>
                            <td className="p-3 text-green-300">"Provides escort / Unlocks gate."</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-bold">Informant</td>
                            <td className="p-3 italic text-gray-500">"Demands coin."</td>
                            <td className="p-3 text-green-300">"Volunteers secret map location."</td>
                          </tr>
                        </tbody>
                      </table>
                   </div>
                </section>
             </div>
          )}

          {activePage === 'engine' && (
            <div className="space-y-8 animate-fadeIn">
               <section>
                <h3 className="text-lg font-bold text-story-glow mb-3 uppercase tracking-wider">The Loop</h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                  What happens when you press Enter? A complex orchestration of events designed to solve the "Goldfish Memory" problem.
                </p>

                <div className="relative border-l-2 border-white/10 pl-6 space-y-8">
                  <div className="relative">
                    <div className="absolute -left-[29px] top-0 w-3 h-3 bg-cyan-500 rounded-full"></div>
                    <h4 className="text-white font-bold text-xs uppercase">1. Quantum Retrieval (RAG)</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Before generating text, the engine converts your input into numbers (vectors) and scans the Lattice. It looks for past events that are mathematically similar to now, effectively "remembering" relevant context.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[29px] top-0 w-3 h-3 bg-id-glow rounded-full"></div>
                    <h4 className="text-white font-bold text-xs uppercase">2. State Injection</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      We inject the entire "1x3x7" JSON state into the AI's prompt. This ensures it never forgets your name, the current location, or the active quest, regardless of how long the chat becomes.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[29px] top-0 w-3 h-3 bg-story-glow rounded-full"></div>
                    <h4 className="text-white font-bold text-xs uppercase">3. Narrative & Logic Split</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      The AI generates the story (Narrative) and then, in the background, calculates the mathematical updates (Logic) to change relationship scores or inventory items.
                    </p>
                  </div>

                  <div className="relative">
                     <div className="absolute -left-[29px] top-0 w-3 h-3 bg-yellow-500 rounded-full"></div>
                     <h4 className="text-white font-bold text-xs uppercase">4. Rolling Context</h4>
                     <p className="text-xs text-gray-400 mt-1">
                       If you change locations, the engine detects a "Scene Change" and wipes the short-term chat history to save costs, but keeps the Long-Term State. This allows for effectively infinite gameplay.
                     </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activePage === 'about' && (
             <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-lg border border-white/10 text-center">
                   <i className="fa-solid fa-robot text-4xl text-gray-600 mb-4"></i>
                   <h3 className="text-xl font-bold text-white mb-2">Solving the Billion Dollar Problems</h3>
                   <p className="text-sm text-gray-400 italic">
                     Semantic Drift. Hallucinations. Context Limits.
                   </p>
                </div>

                <div className="text-sm text-gray-300 leading-relaxed space-y-4">
                  <p>
                    Today's Large Language Models are brilliant but flawed storytellers. They are dreamers without memory. They forget who they are pretending to be, they hallucinate details, and they become expensive to run as conversations grow.
                  </p>
                  <p>
                    <strong>Eideus Dawn</strong> proposes a solution: stop treating AI as a "Magic Box" and start treating it as a "Processor."
                  </p>
                  <p>
                    By externalizing memory into a visual Lattice and externalizing logic into a rigid State Machine, we create an Agent that is consistent, interpretable, and infinitely scalable. This is a humble attempt to demonstrate what the future of Stateful AI Agents might look like.
                  </p>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default HelpPanel;
