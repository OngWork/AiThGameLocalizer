import { useState, useEffect } from 'react';

function App() {
  const [currentView, setCurrentView] = useState('glossary');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ข้อมูลสีและชื่อหัวข้อของแต่ละหน้า
  const pageInfo = {
    file: { title: "File Translation", color: "#8ce058" },
    test: { title: "Test Translation", color: "#374BB0" },
    glossary: { title: "Glossary", color: "#f28b8b" }
  };

  // ==========================================
  // 🌟 1. Global State (Project & Tone)
  // ==========================================
  const [projectList, setProjectList] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [toneInput, setToneInput] = useState('');

  // ==========================================
  // 🌟 2. Glossary & Character State
  // ==========================================
  const [searchTerm, setSearchTerm] = useState('');
  const [glossaryList, setGlossaryList] = useState([]);
  const [enInput, setEnInput] = useState('');
  const [thInput, setThInput] = useState('');

  const [characterList, setCharacterList] = useState([]);
  const [charName, setCharName] = useState('');
  const [charPro, setCharPro] = useState('');
  const [charStatus, setCharStatus] = useState('');

  // ==========================================
  // 🌟 3. Test & File Translation State
  // ==========================================
  const [testSpeaker, setTestSpeaker] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [filePath, setFilePath] = useState('Please select or drop file anywhere in this page');

  // ==========================================
  // 🔄 FETCH DATA LOGIC (เวอร์ชัน Auto-Retry)
  // ==========================================
  useEffect(() => {
    let retryTimer;
    
    // 🌟 สำคัญมาก: บอก React ให้ไปหา Python ที่ Port 8000
    if (window.eel) {
      window.eel.set_host('http://localhost:8000');
    }

    const connectToBackend = () => {
      if (window.eel && typeof window.eel.get_existing_projects === 'function') {
        console.log("📡 [React] เชื่อมต่อสำเร็จ!");
        window.eel.get_existing_projects()((dbs) => {
          setProjectList(dbs);
          setSelectedProject(dbs.includes("Global_Glossary") ? "Global_Glossary" : dbs[0]);
        });
      } else {
        console.log("⚠️ [React] กำลังรอ Python... (Retry)");
        retryTimer = setTimeout(connectToBackend, 1000);
      }
    };

    connectToBackend();
    return () => clearTimeout(retryTimer);
  }, []);
  
  // โหลดข้อมูลทั้งหมดเมื่อเปลี่ยนโปรเจกต์
  const fetchAllProjectData = () => {
    if (window.eel && selectedProject) {
      console.log("⏳ กำลังโหลดข้อมูลของ:", selectedProject);
      
      // โหลด Tone
      window.eel.get_tone_data(selectedProject)((tone) => setToneInput(tone || ''));
      
      // โหลด Glossary
      window.eel.get_glossary_data(selectedProject)((gData) => {
        console.log("📖 Glossary Data:", gData);
        setGlossaryList(gData || []); // ถ้าไม่มีค่าให้เป็น Array ว่าง ป้องกันแอปพัง
      });
      
      // โหลด Character
      window.eel.get_character_data(selectedProject)((cData) => {
        console.log("🧑‍🤝‍🧑 Character Data:", cData);
        setCharacterList(cData || []);
      });
    }
  };

  // ==========================================
  // 🆕 Project Management Logic
  // ==========================================

  useEffect(() => {
    let retryTimer;
    
    // บังคับชี้เป้าไปที่ Python Port 8000
    if (window.eel) {
      window.eel.set_host('http://localhost:8000');
    }

    const connectToBackend = () => {
      // เช็คว่า eel พร้อม และมีฟังก์ชันที่เราต้องการหรือยัง
      if (window.eel && typeof window.eel.get_existing_projects === 'function') {
        console.log("📡 [React] เชื่อมต่อหลังบ้านสำเร็จ! กำลังดึงข้อมูล...");
        
        window.eel.get_existing_projects()((dbs) => {
          setProjectList(dbs);
          setSelectedProject(dbs.includes("Global_Glossary") ? "Global_Glossary" : dbs[0]);
        });
      } else {
        console.log("⚠️ [React] กำลังรอสายจาก Python... (Retry in 1s)");
        retryTimer = setTimeout(connectToBackend, 1000);
      }
    };

    connectToBackend();
    return () => clearTimeout(retryTimer);
  }, []);

  const handleUpdateTone = () => {
    if (window.eel && selectedProject) window.eel.update_tone_data(toneInput, selectedProject)();
  };

  // จัดการ Glossary
  const handleAddGlossary = () => {
    if (window.eel && enInput && thInput && selectedProject) {
      window.eel.add_new_term(enInput, thInput, selectedProject)(() => {
        fetchAllProjectData();
        setEnInput(''); setThInput('');
      });
    }
  };
  const handleDeleteGlossary = (enTerm) => {
    if (window.eel && selectedProject) {
      window.eel.remove_term(enTerm, selectedProject)(() => fetchAllProjectData());
    }
  };

  // จัดการ Character
  const handleAddCharacter = () => {
    if (window.eel && charName && selectedProject) {
      window.eel.add_new_character(charName, charPro, charStatus, selectedProject)(() => {
        fetchAllProjectData();
        setCharName(''); setCharPro(''); setCharStatus('');
      });
    }
  };
  const handleDeleteCharacter = (name) => {
    if (window.eel && selectedProject) {
      window.eel.remove_character(name, selectedProject)(() => fetchAllProjectData());
    }
  };

  const handleTestTranslate = () => {
    if (window.eel && testInput && selectedProject) {
      setTestOutput("Translating with AI...");
      window.eel.translate_test_sentence(testSpeaker, testInput, selectedProject)((result) => {
        setTestOutput(result);
      });
    }
  };

  const handleSelectFile = () => {
    if (window.eel) window.eel.open_file_dialog()((path) => { if (path) setFilePath(path); });
  };

  // ==========================================
  // 🔍 SEARCH FILTERS (เวอร์ชันป้องกันแอปค้างถ้าหา .en ไม่เจอ)
  // ==========================================
  const filteredGlossary = glossaryList.filter(item => 
    (item.en || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.th || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCharacter = characterList.filter(item => 
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.pronoun || '').toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="flex w-screen h-screen bg-[#f5f5f5] font-sans text-black relative overflow-hidden">
      
      {/* 🟢 ปุ่ม Hamburger */}
      <div className="absolute top-6 left-6 z-50">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-20 h-20 bg-[#BDF5D1] rounded-full flex items-center justify-center border-[4px] border-black shadow-[6px_6px_0px_#000] hover:scale-110 active:scale-95 transition-all cursor-pointer group"
        >
          <span className="text-[50px] font-black leading-none pb-1 transition-transform duration-300 group-hover:rotate-90" style={{ display: 'block', WebkitTextStroke: '1px black' }}>
            ☰
          </span>
        </button>
      </div>

      {/* 🌑 Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-80 bg-[#B5B5B5] border-r-[5px] border-black transition-transform duration-500 ease-in-out z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="flex flex-col mt-[160px] gap-[45px] px-10 text-left">
          <button onClick={() => {setCurrentView('file'); setIsSidebarOpen(false);}} className="group bg-transparent border-none p-0 flex items-center transition-all cursor-pointer text-left">
            <span className="text-[30px] font-black text-[#8ce058] tracking-widest group-hover:translate-x-3 transition-transform uppercase" style={{ WebkitTextStroke: '1.5px black', textShadow: '3px 3px 0px #000' }}>
              FILE TRANSLATE
            </span>
          </button>
          <button onClick={() => {setCurrentView('test'); setIsSidebarOpen(false);}} className="group bg-transparent border-none p-0 flex items-center transition-all cursor-pointer text-left">
            <span className="text-[30px] font-black text-[#374BB0] tracking-widest group-hover:translate-x-3 transition-transform uppercase" style={{ WebkitTextStroke: '1.5px black', textShadow: '3px 3px 0px #000' }}>
              TEST MODE
            </span>
          </button>
          <button onClick={() => {setCurrentView('glossary'); setIsSidebarOpen(false);}} className="group bg-transparent border-none p-0 flex items-center transition-all cursor-pointer text-left">
            <span className="text-[30px] font-black text-[#f28b8b] tracking-widest group-hover:translate-x-3 transition-transform uppercase" style={{ WebkitTextStroke: '1.5px black', textShadow: '3px 3px 0px #000' }}>
              GLOSSARY
            </span>
          </button>
        </nav>
      </aside>

      {/* 🟢 พื้นที่ทำงานหลัก */}
      <main className="flex-1 flex flex-col h-full w-full relative">
        <div className="w-full flex justify-center pt-8 mb-6">
          <h1 className="text-[60px] font-black tracking-wider uppercase" style={{ color: pageInfo[currentView].color, WebkitTextStroke: '2px black', textShadow: '2px 2px 0 #000' }}>
            {pageInfo[currentView].title}
          </h1>
        </div>

        {/* ========================================================= */}
        {/* 🔵 มุมมอง TEST TRANSLATION */}
        {/* ========================================================= */}
        {currentView === 'test' && (
          <div className="flex-1 flex flex-col mt-20 px-8 w-full bg-[#f5f5f5]">
            <div className="max-w-[1400px] mx-auto flex flex-col" style={{ gap: '40px' }}>
              <div className="flex items-center" style={{ gap: '30px' }}>
                <div className="w-[200px] text-right flex-none">
                  <span className="font-black text-[26px] text-[#2d4b8e] tracking-wider uppercase" style={{ textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 2px 2px 0px rgba(0,0,0,0.1)' }}>&lt;TEST&gt;</span>
                </div>
                <input type="text" value={testSpeaker} onChange={e => setTestSpeaker(e.target.value)} placeholder="Speaker (e.g. Perlica)" className="h-[65px] w-[200px] border-[4px] border-dashed border-[#8ba6e9] px-4 bg-white text-[#2d4b8e] font-bold text-lg outline-none flex-none shadow-sm" />
                <input type="text" value={testInput} onChange={e => setTestInput(e.target.value)} placeholder="Enter your English test sentence" className="h-[65px] w-[500px] border-[4px] border-dashed border-[#8ba6e9] px-4 bg-white text-[#2d4b8e] font-bold text-lg outline-none flex-none shadow-sm" />
                
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="h-[75px] w-[180px] border-[4px] border-dashed border-[#8ba6e9] px-4 bg-white text-[#8ba6e9] font-black text-xl outline-none cursor-pointer flex-none shadow-sm appearance-none text-center hover:bg-slate-50">
                  {projectList.map((proj, idx) => <option key={idx} value={proj}>{proj}</option>)}
                </select>
                
                <button onClick={handleTestTranslate} className="h-[75px] w-[100px] border-[4px] border-dashed border-[#fba98e] bg-white text-[#fba98e] font-black text-2xl active:scale-95 transition-all cursor-pointer flex-none shadow-sm hover:bg-[#fba98e]/5">OK</button>
              </div>
              <div className="flex items-start" style={{ gap: '30px' }}>
                <div className="w-[200px] text-right flex-none pt-4">
                  <span className="font-black text-[26px] text-[#2d4b8e] tracking-wider uppercase" style={{ textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 2px 2px 0px rgba(0,0,0,0.1)' }}>&lt;TEST Output&gt;</span>
                </div>
                <textarea value={testOutput} readOnly placeholder="The translation will appear here..." className="h-[120px] w-[1080px] border-[4px] border-dashed border-[#8ba6e9] p-6 bg-white text-[#2d4b8e] font-bold text-xl outline-none resize-none flex-none shadow-md"></textarea>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 🟢 มุมมอง FILE TRANSLATION */}
        {/* ========================================================= */}
        {currentView === 'file' && (
          <div className="flex-1 flex flex-col pt-6 pb-10 h-full bg-[#f5f5f5] overflow-y-auto">
            <div className="w-[1100px] mx-auto flex flex-col px-10">
              <div className="flex justify-between items-end w-full">
                <div className="flex flex-col text-[#1f8737] font-black text-[18px] leading-tight" style={{ textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' }}>
                  <span>&lt;Translate the .json file&gt;</span>
                  <span className="text-gray-600 truncate max-w-[500px]">{filePath}</span>
                </div>
                <div className="flex items-center" style={{ gap: '20px' }}>
                  <button onClick={handleSelectFile} className="h-[55px] px-6 border-[4px] border-dashed border-[#7de29b] bg-white text-[#7de29b] font-black text-lg cursor-pointer hover:bg-[#7de29b]/10">SELECT FILE</button>
                  <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="h-[55px] w-[180px] border-[4px] border-dashed border-[#7de29b] px-4 bg-white text-[#7de29b] font-black text-lg outline-none cursor-pointer appearance-none text-center">
                    {projectList.map((proj, idx) => <option key={idx} value={proj}>{proj}</option>)}
                  </select>
                  <button className="h-[55px] w-[90px] border-[4px] border-dashed border-[#fba98e] bg-white text-[#fba98e] font-black text-2xl active:scale-95 cursor-pointer hover:bg-[#fba98e]/5">OK</button>
                </div>
              </div>
              
              {/* Progress Bar & Table Mockup */}
              <div className="flex justify-center items-center gap-6 mt-[15px]">
                <span className="font-black text-[20px] text-[#1f8737]" style={{ textShadow: '1px 1px 0 #fff, 1px 1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' }}>Translating 0/0</span>
                <div className="w-[320px] h-[20px] rounded-full border-[3px] border-gray-600 bg-[#9ca3af] overflow-hidden p-[2px] shadow-inner">
                  <div className="w-[0%] h-full bg-gradient-to-r from-[#8ce058] to-[#b4f082] rounded-full transition-all"></div>
                </div>
              </div>
              <div className="relative w-full bg-[#f5f5f5] border-[5px] border-black flex flex-col h-[700px] mt-[15px] shadow-lg">
                <button className="absolute bg-[#fba98e] rounded-full border-[5px] border-black flex flex-col items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 cursor-pointer shadow-xl" style={{ width: '100px', height: '100px', top: '-50px', right: '-50px' }}>
                  <span className="text-4xl mb-[-2px]">💾</span>
                  <span className="text-[14px] font-black text-blue-900 uppercase tracking-tighter">Save</span>
                </button>
                <div className="flex w-full h-[55px] border-b-[5px] border-black bg-gray-400/30 shrink-0 font-black text-[13px] text-gray-700">
                  <div className="w-[20%] border-r-[5px] border-black flex items-center justify-center bg-gray-300/50 uppercase">Speaker</div>
                  <div className="w-[40%] border-r-[5px] border-black flex items-center justify-center uppercase text-center">English source</div>
                  <div className="flex-1 flex items-center justify-center uppercase text-center">Thai translation</div>
                </div>
                <div className="flex flex-1 w-full bg-[#f5f5f5]">
                  <div className="w-[20%] border-r-[5px] border-black h-full"></div>
                  <div className="w-[40%] border-r-[5px] border-black h-full"></div>
                  <div className="flex-1 h-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 🔴 มุมมอง GLOSSARY (Full Dynamic) */}
        {/* ========================================================= */}
        {currentView === 'glossary' && (
          <div className="flex-1 flex flex-col pt-6 pb-10 h-full bg-[#f5f5f5] overflow-y-auto font-sans text-black">
            <div className="w-[1200px] mx-auto flex flex-col">
              
              <div className="flex items-center justify-between gap-4 mb-4 px-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[18px] text-[#e67a7a] italic">Select Game:</span>
                  <select 
                    value={selectedProject} 
                    onChange={(e) => setSelectedProject(e.target.value)} 
                    className="h-[40px] w-[200px] border-[3px] border-dashed border-[#e67a7a] rounded-lg px-2 bg-white text-[#e67a7a] font-bold outline-none cursor-pointer"
                  >
                    {projectList.map((proj, idx) => <option key={idx} value={proj}>{proj}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-center">
                  <span className="font-black text-[18px] text-[#e67a7a] italic">Tone:</span>
                  <input 
                    type="text" 
                    value={toneInput}
                    onChange={(e) => setToneInput(e.target.value)}
                    onBlur={handleUpdateTone}
                    placeholder="e.g. Fantasy, Sci-fi" 
                    className="h-[40px] w-[300px] border-[3px] border-dashed border-[#e67a7a] rounded-lg px-3 bg-white text-[#e67a7a] font-bold outline-none placeholder-[#e67a7a]/40" 
                  />
                </div>
                <button onClick={handleNewProject} className="h-[40px] px-6 border-[3px] border-dashed border-[#e67a7a] bg-white text-[#e67a7a] font-black hover:bg-[#e67a7a]/5 transition-all rounded-lg">NEW PROJECT</button>
              </div>

              <div className="w-full mb-6 px-2" style={{ marginTop: '15px' }}>
                <div className="relative flex items-center">
                  <span className="absolute left-5 text-2xl z-20">🔍</span>
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in all tables..." 
                    style={{ paddingLeft: '65px', color: '#e67a7a', borderColor: '#e67a7a' }} 
                    className="w-full h-[50px] border-[3px] border-dashed rounded-xl pr-4 bg-white font-bold shadow-sm outline-none placeholder-[#e67a7a]/30" 
                  />
                </div>
              </div>

              <div className="flex gap-8 w-full h-[650px]">
                
                {/* 🟢 ตารางซ้าย: General Glossary */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-black text-[18px] text-gray-800 mb-2 px-1 uppercase italic tracking-tight">General Glossary</h3>
                  <div className="flex-1 flex flex-col bg-white border-[3px] border-black shadow-md overflow-hidden rounded-lg">
                    <div className="flex w-full h-[45px] border-b-[3px] border-black bg-gray-50 shrink-0 font-black text-[12px] text-gray-600 uppercase">
                      <div className="w-[10%] border-r-[3px] border-black flex items-center justify-center italic">#</div>
                      <div className="w-[40%] border-r-[3px] border-black flex items-center justify-center">Eng term</div>
                      <div className="w-[35%] border-r-[3px] border-black flex items-center justify-center">Th term</div>
                      <div className="flex-1 flex items-center justify-center">action</div>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white text-[13px]">
                      {filteredGlossary.map((item, index) => (
                        <div key={index} className="flex w-full h-[40px] border-b border-gray-100 hover:bg-gray-50">
                          <div className="w-[10%] border-r-[3px] border-black flex items-center justify-center text-gray-300 font-bold">{index + 1}</div>
                          <div className="w-[40%] border-r-[3px] border-black flex items-center px-4 font-bold text-gray-700">{item.en}</div>
                          <div className="w-[35%] border-r-[3px] border-black flex items-center px-4 text-gray-600">{item.th}</div>
                          <div onClick={() => handleDeleteGlossary(item.en)} style={{ color: '#FF0000' }} className="flex-1 flex items-center justify-center font-black cursor-pointer hover:underline uppercase text-[11px]">delete</div>
                        </div>
                      ))}
                    </div>
                    <div className="h-[40px] border-t-[3px] border-black bg-gray-50 flex items-center p-0 shrink-0">
                      <input type="text" value={enInput} onChange={(e) => setEnInput(e.target.value)} placeholder="English" className="w-[35%] h-full border-r border-gray-300 px-3 text-xs outline-none bg-transparent font-bold" />
                      <input type="text" value={thInput} onChange={(e) => setThInput(e.target.value)} placeholder="Thai" className="flex-1 h-full border-r border-gray-300 px-3 text-xs outline-none bg-transparent font-bold" />
                      <button onClick={handleAddGlossary} style={{ color: '#008000' }} className="h-full px-4 bg-white font-black text-[11px] uppercase hover:bg-gray-100 transition-colors border-l border-gray-300">Add/Update</button>
                    </div>
                  </div>
                </div>

                {/* 🔵 ตารางขวา: Character Settings */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-black text-[18px] text-gray-800 mb-2 px-1 uppercase italic tracking-tight">Character Settings</h3>
                  <div className="flex-1 flex flex-col bg-white border-[3px] border-black shadow-md overflow-hidden rounded-lg">
                    <div className="flex w-full h-[45px] border-b-[3px] border-black bg-gray-50 shrink-0 font-bold text-[12px] text-gray-600 uppercase">
                      <div className="w-[10%] border-r-[3px] border-black flex items-center justify-center italic">#</div>
                      <div className="w-[30%] border-r-[3px] border-black flex items-center justify-center">Character</div>
                      <div className="w-[25%] border-r-[3px] border-black flex items-center justify-center">Pronoun</div>
                      <div className="w-[20%] border-r-[3px] border-black flex items-center justify-center text-center">Status</div>
                      <div className="flex-1 flex items-center justify-center">action</div>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white text-[13px]">
                      {filteredCharacter.map((item, index) => (
                        <div key={index} className="flex w-full h-[40px] border-b border-gray-100 hover:bg-gray-50">
                          <div className="w-[10%] border-r-[3px] border-black flex items-center justify-center text-gray-300 font-bold">{index + 1}</div>
                          <div className="w-[30%] border-r-[3px] border-black flex items-center px-4 font-bold text-gray-700">{item.name}</div>
                          <div className="w-[25%] border-r-[3px] border-black flex items-center px-4 text-gray-600">{item.pronoun}</div>
                          <div className="w-[20%] border-r-[3px] border-black flex items-center px-4 text-gray-600">{item.status}</div>
                          <div onClick={() => handleDeleteCharacter(item.name)} style={{ color: '#FF0000' }} className="flex-1 flex items-center justify-center font-black cursor-pointer hover:underline uppercase text-[11px]">delete</div>
                        </div>
                      ))}
                    </div>
                    <div className="h-[40px] border-t-[3px] border-black bg-gray-50 flex items-center p-0 shrink-0">
                      <input type="text" value={charName} onChange={(e) => setCharName(e.target.value)} placeholder="Name" className="w-[25%] h-full border-r border-gray-300 px-3 text-xs outline-none bg-transparent font-bold" />
                      <input type="text" value={charPro} onChange={(e) => setCharPro(e.target.value)} placeholder="Pro" className="w-[20%] h-full border-r border-gray-300 px-3 text-xs outline-none bg-transparent font-bold" />
                      <input type="text" value={charStatus} onChange={(e) => setCharStatus(e.target.value)} placeholder="Status" className="flex-1 h-full border-r border-gray-300 px-3 text-xs outline-none bg-transparent font-bold" />
                      <button onClick={handleAddCharacter} style={{ color: '#008000' }} className="h-full px-4 bg-white font-black text-[11px] uppercase hover:bg-gray-100 transition-colors border-l border-gray-300">Add/Update</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;