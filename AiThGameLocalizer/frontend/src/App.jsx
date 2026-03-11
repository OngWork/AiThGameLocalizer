import { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:5000/api';

function App() {
  const [currentView, setCurrentView] = useState('file');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pageInfo = {
    file: { title: "File Translation", color: "#8ce058" },
    test: { title: "Test Translation", color: "#374BB0" },
    glossary: { title: "Glossary", color: "#f28b8b" }
  };

  const [projectList, setProjectList] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [toneInput, setToneInput] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [glossaryList, setGlossaryList] = useState([]);
  const [enInput, setEnInput] = useState('');
  const [thInput, setThInput] = useState('');

  const [characterList, setCharacterList] = useState([]);
  const [charName, setCharName] = useState('');
  const [charPro, setCharPro] = useState('');
  const [charStatus, setCharStatus] = useState('');

  const [testSpeaker, setTestSpeaker] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  
  const [filePath, setFilePath] = useState('Please select or drop file anywhere in this page');
  const [fileData, setFileData] = useState([]); 
  const [isTranslating, setIsTranslating] = useState(false); 
  const [progress, setProgress] = useState({ current: 0, total: 0 }); 

  // 🌟 State สำหรับทำเอฟเฟกต์ตอนลากไฟล์มาวาง
  const [isDragging, setIsDragging] = useState(false);

  // ==========================================
  // 🔄 FETCH DATA
  // ==========================================
  const fetchProjects = () => {
    fetch(`${API_BASE}/projects`).then(res => res.json()).then(data => {
      setProjectList(data);
      if (!selectedProject && data.length > 0) setSelectedProject(data.includes("Global_Glossary") ? "Global_Glossary" : data[0]);
    });
  };

  const fetchProjectDetails = () => {
    if (selectedProject) {
      fetch(`${API_BASE}/details/${selectedProject}`).then(res => res.json()).then(data => {
        setToneInput(data.tone);
        setGlossaryList(data.glossary.map(g => ({ ...g, originalEn: g.en })));
        setCharacterList(data.characters.map(c => ({ ...c, originalName: c.name })));
      });
    }
  };

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { fetchProjectDetails(); }, [selectedProject, currentView]);
  const fetchAllProjectData = () => { fetchProjectDetails(); };

  // ==========================================
  // 🎯 ACTION HANDLERS
  // ==========================================
  const handleNewProject = async () => {
    const name = prompt("Enter new project name:");
    if (name) { await fetch(`${API_BASE}/projects/new`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_name: name }) }); setSelectedProject(name); fetchProjects(); }
  };

  const handleUpdateTone = async () => {
    if (selectedProject) await fetch(`${API_BASE}/tone/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tone: toneInput, project_name: selectedProject }) });
  };

  const handleAddGlossary = async () => {
    if (enInput && thInput && selectedProject) { await fetch(`${API_BASE}/glossary/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ en: enInput, th: thInput, project_name: selectedProject }) }); fetchAllProjectData(); setEnInput(''); setThInput(''); }
  };

  const handleDeleteGlossary = async (enTerm) => {
    if (selectedProject) { await fetch(`${API_BASE}/glossary/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ en: enTerm, project_name: selectedProject }) }); fetchAllProjectData(); }
  };

  const handleGlossaryInlineChange = (originalEn, field, value) => { setGlossaryList(prev => prev.map(item => item.originalEn === originalEn ? { ...item, [field]: value } : item)); };
  const handleGlossaryInlineBlur = async (item) => {
    if (!item.en || !item.th) return; 
    if (item.en !== item.originalEn) await fetch(`${API_BASE}/glossary/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ en: item.originalEn, project_name: selectedProject }) });
    await fetch(`${API_BASE}/glossary/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ en: item.en, th: item.th, project_name: selectedProject }) });
    setGlossaryList(prev => prev.map(g => g.originalEn === item.originalEn ? { ...g, originalEn: item.en } : g));
  };

  const handleAddCharacter = async () => {
    if (charName && selectedProject) { await fetch(`${API_BASE}/characters/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: charName, pronoun: charPro, status: charStatus, project_name: selectedProject }) }); fetchAllProjectData(); setCharName(''); setCharPro(''); setCharStatus(''); }
  };

  const handleDeleteCharacter = async (name) => {
    if (selectedProject) { await fetch(`${API_BASE}/characters/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, project_name: selectedProject }) }); fetchAllProjectData(); }
  };

  const handleCharacterInlineChange = (originalName, field, value) => { setCharacterList(prev => prev.map(item => item.originalName === originalName ? { ...item, [field]: value } : item)); };
  const handleCharacterInlineBlur = async (item) => {
    if (!item.name) return;
    if (item.name !== item.originalName) await fetch(`${API_BASE}/characters/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: item.originalName, project_name: selectedProject }) });
    await fetch(`${API_BASE}/characters/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: item.name, pronoun: item.pronoun, status: item.status, project_name: selectedProject }) });
    setCharacterList(prev => prev.map(c => c.originalName === item.originalName ? { ...c, originalName: item.name } : c));
  };

  const handleTestTranslate = async () => {
    if (!testInput || !selectedProject) return;
    setTestOutput("Translating with AI...");
    try {
      const res = await fetch(`${API_BASE}/translate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ speaker: testSpeaker, text: testInput, project_name: selectedProject }) });
      const data = await res.json(); setTestOutput(data.result);
    } catch (err) { setTestOutput("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ AI"); }
  };

  const handleSelectFile = async () => {
    try {
      const res = await fetch(`${API_BASE}/file/dialog`);
      const data = await res.json();
      if (data.path) {
        setFilePath(data.path);
        const readRes = await fetch(`${API_BASE}/file/read`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: data.path }) });
        const readData = await readRes.json();
        if (readData.rows) { setFileData(readData.rows); setProgress({ current: 0, total: readData.rows.length }); }
      }
    } catch (err) { console.error("Select file error:", err); }
  };

  // 🌟 ฟังก์ชันจัดการ Drag & Drop 
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.json')) {
      alert("⚠️ กรุณาลากไฟล์นามสกุล .json มาวางเท่านั้นครับ");
      return;
    }

    setFilePath(`[Dropped] ${file.name}`);
    
    // อ่านไฟล์ด้วย React แล้วส่งข้อความไปให้ Python ประมวลผล
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      try {
        const res = await fetch(`${API_BASE}/file/read_drop`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content })
        });
        const readData = await res.json();
        if (readData.rows) {
          setFileData(readData.rows);
          setProgress({ current: 0, total: readData.rows.length });
        } else { alert("⚠️ อ่านไฟล์ไม่ได้ หรือไฟล์ผิดฟอร์แมต"); }
      } catch (err) { console.error(err); }
    };
    reader.readAsText(file);
  };

  const handleStartFileTranslate = async () => {
    if (!fileData.length || !selectedProject || isTranslating) return;
    setIsTranslating(true);
    let currentData = [...fileData];
    for (let i = 0; i < currentData.length; i++) {
      if (currentData[i].translated) continue; 
      setProgress({ current: i + 1, total: currentData.length }); 
      try {
        const res = await fetch(`${API_BASE}/translate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ speaker: currentData[i].speaker, text: currentData[i].original, project_name: selectedProject }) });
        const data = await res.json();
        currentData[i].translated = data.result;
        setFileData([...currentData]); 
      } catch (err) { console.error("Error translation row", i); }
    }
    setIsTranslating(false); alert("🎉 แปลไฟล์เสร็จสมบูรณ์!");
  };

  const handleSaveFile = async () => {
    if (!filePath || !fileData.length) { alert("⚠️ ไม่มีข้อมูลให้บันทึกครับ"); return; }
    try {
      const dialogRes = await fetch(`${API_BASE}/file/save_dialog`);
      const dialogData = await dialogRes.json();
      if (!dialogData.path) return; 
      const savePath = dialogData.path;

      await fetch(`${API_BASE}/file/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ save_path: savePath, data: fileData }) });
      alert(`💾 บันทึกไฟล์สำเร็จเรียบร้อย!\nไฟล์ถูกบันทึกไว้ที่:\n${savePath}`);
    } catch (err) { console.error("Save error:", err); alert("❌ เกิดข้อผิดพลาดในการบันทึกไฟล์"); }
  };

  const filteredGlossary = glossaryList.filter(item => (item.en || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.th || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredCharacter = characterList.filter(item => (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.pronoun || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.status || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="flex w-screen h-screen bg-[#f5f5f5] font-sans text-black relative overflow-hidden">
      
      <div className="absolute top-6 left-6 z-50">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-20 h-20 bg-[#BDF5D1] rounded-full flex items-center justify-center border-[4px] border-black shadow-[6px_6px_0px_#000] hover:scale-110 active:scale-95 transition-all cursor-pointer group">
          <span className="text-[50px] font-black leading-none pb-1 transition-transform duration-300 group-hover:rotate-90" style={{ display: 'block', WebkitTextStroke: '1px black' }}>☰</span>
        </button>
      </div>

      <aside className={`fixed top-0 left-0 h-full w-80 bg-[#B5B5B5] border-r-[5px] border-black transition-transform duration-500 ease-in-out z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="flex flex-col mt-[160px] gap-[45px] px-10 text-left">
          <button onClick={() => {setCurrentView('file'); setIsSidebarOpen(false);}} className="group bg-transparent border-none p-0 flex items-center transition-all cursor-pointer text-left"><span className="text-[30px] font-black text-[#8ce058] tracking-widest group-hover:translate-x-3 transition-transform uppercase" style={{ WebkitTextStroke: '1.5px black', textShadow: '3px 3px 0px #000' }}>FILE TRANSLATE</span></button>
          <button onClick={() => {setCurrentView('test'); setIsSidebarOpen(false);}} className="group bg-transparent border-none p-0 flex items-center transition-all cursor-pointer text-left"><span className="text-[30px] font-black text-[#374BB0] tracking-widest group-hover:translate-x-3 transition-transform uppercase" style={{ WebkitTextStroke: '1.5px black', textShadow: '3px 3px 0px #000' }}>TEST MODE</span></button>
          <button onClick={() => {setCurrentView('glossary'); setIsSidebarOpen(false);}} className="group bg-transparent border-none p-0 flex items-center transition-all cursor-pointer text-left"><span className="text-[30px] font-black text-[#f28b8b] tracking-widest group-hover:translate-x-3 transition-transform uppercase" style={{ WebkitTextStroke: '1.5px black', textShadow: '3px 3px 0px #000' }}>GLOSSARY</span></button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full w-full relative">
        <div className="w-full flex justify-center pt-8 mb-6">
          <h1 className="text-[60px] font-black tracking-wider uppercase" style={{ color: pageInfo[currentView].color, WebkitTextStroke: '2px black', textShadow: '2px 2px 0 #000' }}>{pageInfo[currentView].title}</h1>
        </div>

        {currentView === 'test' && (
          <div className="flex-1 flex flex-col mt-20 px-8 w-full bg-[#f5f5f5]">
            <div className="max-w-[1400px] mx-auto flex flex-col" style={{ gap: '40px' }}>
              <div className="flex items-center" style={{ gap: '30px' }}>
                <div className="w-[200px] text-right flex-none"><span className="font-black text-[26px] text-[#2d4b8e] tracking-wider uppercase" style={{ textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 2px 2px 0px rgba(0,0,0,0.1)' }}>&lt;TEST&gt;</span></div>
                <input type="text" value={testSpeaker} onChange={e => setTestSpeaker(e.target.value)} placeholder="Speaker (e.g. Perlica)" className="h-[65px] w-[200px] border-[4px] border-dashed border-[#8ba6e9] px-4 bg-white text-[#2d4b8e] font-bold text-lg outline-none flex-none shadow-sm" />
                <input type="text" value={testInput} onChange={e => setTestInput(e.target.value)} placeholder="Enter your English test sentence" className="h-[65px] w-[500px] border-[4px] border-dashed border-[#8ba6e9] px-4 bg-white text-[#2d4b8e] font-bold text-lg outline-none flex-none shadow-sm" />
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="h-[75px] w-[180px] border-[4px] border-dashed border-[#8ba6e9] px-4 bg-white text-[#8ba6e9] font-black text-xl outline-none cursor-pointer flex-none shadow-sm appearance-none text-center hover:bg-slate-50">
                  {projectList.map((proj, idx) => <option key={idx} value={proj}>{proj}</option>)}
                </select>
                <button onClick={handleTestTranslate} className="h-[75px] w-[100px] border-[4px] border-dashed border-[#fba98e] bg-white text-[#fba98e] font-black text-2xl active:scale-95 transition-all cursor-pointer flex-none shadow-sm hover:bg-[#fba98e]/5">OK</button>
              </div>
              <div className="flex items-start" style={{ gap: '30px' }}>
                <div className="w-[200px] text-right flex-none pt-4"><span className="font-black text-[26px] text-[#2d4b8e] tracking-wider uppercase" style={{ textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 2px 2px 0px rgba(0,0,0,0.1)' }}>&lt;TEST Output&gt;</span></div>
                <textarea value={testOutput} readOnly placeholder="The translation will appear here..." className="h-[120px] w-[1080px] border-[4px] border-dashed border-[#8ba6e9] p-6 bg-white text-[#2d4b8e] font-bold text-xl outline-none resize-none flex-none shadow-md"></textarea>
              </div>
            </div>
          </div>
        )}

        {/* 🌟 🔴 มุมมอง FILE TRANSLATION (เพิ่ม onDragOver/onDrop เข้าไป) */}
        {currentView === 'file' && (
          <div 
            className={`flex-1 flex flex-col pt-6 pb-10 h-full overflow-y-auto transition-colors duration-300 ${isDragging ? 'bg-[#e2f8d8]' : 'bg-[#f5f5f5]'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="w-[1100px] mx-auto flex flex-col px-10 relative">
              
              {/* Overlay ตอนกำลังลากไฟล์ (ช่วยบอกผู้ใช้) */}
              {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center border-[8px] border-dashed border-[#8ce058] bg-white/80 rounded-xl pointer-events-none">
                  <span className="text-5xl font-black text-[#1f8737] uppercase tracking-widest">Drop JSON Here! 📥</span>
                </div>
              )}

              <div className="flex justify-between items-end w-full">
                <div className="flex flex-col text-[#1f8737] font-black text-[18px] leading-tight" style={{ textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' }}>
                  <span>&lt;Translate the .json file&gt;</span>
                  <span className="text-gray-600 truncate max-w-[500px]">{filePath}</span>
                </div>
                <div className="flex items-center" style={{ gap: '20px' }}>
                  <button onClick={handleSelectFile} className="h-[55px] px-6 border-[4px] border-dashed border-[#7de29b] bg-white text-[#7de29b] font-black text-lg cursor-pointer hover:bg-[#7de29b]/10 z-10">SELECT FILE</button>
                  <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="h-[55px] w-[180px] border-[4px] border-dashed border-[#7de29b] px-4 bg-white text-[#7de29b] font-black text-lg outline-none cursor-pointer appearance-none text-center z-10">
                    {projectList.map((proj, idx) => <option key={idx} value={proj}>{proj}</option>)}
                  </select>
                  <button onClick={handleStartFileTranslate} disabled={isTranslating} className={`h-[55px] w-[90px] border-[4px] border-dashed border-[#fba98e] bg-white text-[#fba98e] font-black text-2xl active:scale-95 cursor-pointer z-10 ${isTranslating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#fba98e]/5'}`}>OK</button>
                </div>
              </div>
              
              <div className="flex justify-center items-center gap-6 mt-[15px]">
                <span className="font-black text-[20px] text-[#1f8737]" style={{ textShadow: '1px 1px 0 #fff, 1px 1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' }}>Translating {progress.current}/{progress.total}</span>
                <div className="w-[320px] h-[20px] rounded-full border-[3px] border-gray-600 bg-[#9ca3af] overflow-hidden p-[2px] shadow-inner">
                  <div className="h-full bg-gradient-to-r from-[#8ce058] to-[#b4f082] rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>

              <div className="relative w-full bg-[#f5f5f5] border-[5px] border-black flex flex-col h-[700px] mt-[15px] shadow-lg">
                <button onClick={handleSaveFile} className="absolute bg-[#fba98e] rounded-full border-[5px] border-black flex flex-col items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 cursor-pointer shadow-xl" style={{ width: '100px', height: '100px', top: '-50px', right: '-50px' }}>
                  <span className="text-4xl mb-[-2px]">💾</span>
                  <span className="text-[14px] font-black text-blue-900 uppercase tracking-tighter">Save</span>
                </button>

                <div className="flex w-full h-[55px] border-b-[5px] border-black bg-gray-400/30 shrink-0 font-black text-[13px] text-gray-700">
                  <div className="w-[15%] border-r-[5px] border-black flex items-center justify-center bg-gray-300/50 uppercase">Speaker</div>
                  <div className="w-[42%] border-r-[5px] border-black flex items-center justify-center uppercase text-center">English source</div>
                  <div className="flex-1 flex items-center justify-center uppercase text-center">Thai translation (Editable)</div>
                </div>

                <div className="flex flex-col flex-1 w-full bg-transparent overflow-y-auto">
                  {fileData.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-black text-2xl uppercase tracking-widest pointer-events-none">
                      SELECT OR DROP JSON FILE HERE
                    </div>
                  )}
                  {fileData.map((row, idx) => (
                    <div key={idx} className="flex w-full min-h-[60px] border-b-[3px] border-gray-300 bg-white hover:bg-green-50 focus-within:bg-blue-50 transition-colors">
                      <div className="w-[15%] border-r-[5px] border-black p-2 flex items-center justify-center font-bold text-[#e67a7a] break-all text-[12px] uppercase text-center shrink-0">{row.speaker || "SYSTEM"}</div>
                      <div className="w-[42%] border-r-[5px] border-black p-3 font-bold text-gray-800 break-words shrink-0">{row.original}</div>
                      <textarea 
                        value={row.translated} 
                        onChange={(e) => { const newData = [...fileData]; newData[idx].translated = e.target.value; setFileData(newData); }}
                        placeholder="กำลังรอการแปล หรือ พิมพ์คำแปลเองที่นี่..."
                        className="flex-1 p-3 font-black text-[#2d4b8e] bg-transparent outline-none resize-none focus:text-blue-700 w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🔴 มุมมอง GLOSSARY (เหมือนเดิมเป๊ะ) */}
        {currentView === 'glossary' && (
          <div className="flex-1 flex flex-col pt-6 pb-10 h-full bg-[#f5f5f5] overflow-y-auto font-sans text-black">
            <div className="w-[1200px] mx-auto flex flex-col">
              
              <div className="flex items-center justify-between gap-4 mb-4 px-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[18px] text-[#e67a7a] italic">Select Game:</span>
                  <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="h-[40px] w-[200px] border-[3px] border-dashed border-[#e67a7a] rounded-lg px-2 bg-white text-[#e67a7a] font-bold outline-none cursor-pointer">
                    {projectList.map((proj, idx) => <option key={idx} value={proj}>{proj}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-center">
                  <span className="font-black text-[18px] text-[#e67a7a] italic">Tone:</span>
                  <input type="text" value={toneInput} onChange={(e) => setToneInput(e.target.value)} onBlur={handleUpdateTone} placeholder="e.g. Fantasy, Sci-fi" className="h-[40px] w-[300px] border-[3px] border-dashed border-[#e67a7a] rounded-lg px-3 bg-white text-[#e67a7a] font-bold outline-none placeholder-[#e67a7a]/40" />
                </div>
                <button onClick={handleNewProject} className="h-[40px] px-6 border-[3px] border-dashed border-[#e67a7a] bg-white text-[#e67a7a] font-black hover:bg-[#e67a7a]/5 transition-all rounded-lg">NEW PROJECT</button>
              </div>

              <div className="w-full mb-6 px-2" style={{ marginTop: '15px' }}>
                <div className="relative flex items-center">
                  <span className="absolute left-5 text-2xl z-20">🔍</span>
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search in all tables..." style={{ paddingLeft: '65px', color: '#e67a7a', borderColor: '#e67a7a' }} className="w-full h-[50px] border-[3px] border-dashed rounded-xl pr-4 bg-white font-bold shadow-sm outline-none placeholder-[#e67a7a]/30" />
                </div>
              </div>

              <div className="flex gap-8 w-full h-[650px]">
                
                <div className="flex-1 flex flex-col">
                  <h3 className="font-black text-[18px] text-gray-800 mb-2 px-1 uppercase italic tracking-tight">General Glossary</h3>
                  <div className="flex-1 flex flex-col bg-white border-[3px] border-black shadow-md overflow-hidden rounded-lg">
                    <div className="flex w-full h-[45px] border-b-[3px] border-black bg-gray-50 shrink-0 font-black text-[12px] text-gray-600 uppercase">
                      <div className="w-[10%] border-r-[3px] border-black flex items-center justify-center italic">#</div>
                      <div className="w-[40%] border-r-[3px] border-black flex items-center justify-center">Eng term (Edit)</div>
                      <div className="w-[35%] border-r-[3px] border-black flex items-center justify-center">Th term (Edit)</div>
                      <div className="flex-1 flex items-center justify-center">action</div>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white text-[13px]">
                      {filteredGlossary.map((item, index) => (
                        <div key={index} className="flex w-full h-[40px] border-b border-gray-100 hover:bg-gray-50 focus-within:bg-blue-50 transition-colors">
                          <div className="w-[10%] border-r-[3px] border-black flex items-center justify-center text-gray-300 font-bold">{index + 1}</div>
                          <input className="w-[40%] border-r-[3px] border-black px-4 font-bold text-gray-700 bg-transparent outline-none focus:text-[#2d4b8e]" value={item.en} onChange={(e) => handleGlossaryInlineChange(item.originalEn, 'en', e.target.value)} onBlur={() => handleGlossaryInlineBlur(item)} />
                          <input className="w-[35%] border-r-[3px] border-black px-4 text-gray-600 bg-transparent outline-none focus:text-[#2d4b8e] focus:font-bold" value={item.th} onChange={(e) => handleGlossaryInlineChange(item.originalEn, 'th', e.target.value)} onBlur={() => handleGlossaryInlineBlur(item)} />
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

                <div className="flex-1 flex flex-col">
                  <h3 className="font-black text-[18px] text-gray-800 mb-2 px-1 uppercase italic tracking-tight">Character Settings</h3>
                  <div className="flex-1 flex flex-col bg-white border-[3px] border-black shadow-md overflow-hidden rounded-lg">
                    <div className="flex w-full h-[45px] border-b-[3px] border-black bg-gray-50 shrink-0 font-bold text-[12px] text-gray-600 uppercase">
                      <div className="w-[10%] border-r-[3px] border-black flex items-center justify-center italic">#</div>
                      <div className="w-[30%] border-r-[3px] border-black flex items-center justify-center">Character (Edit)</div>
                      <div className="w-[25%] border-r-[3px] border-black flex items-center justify-center">Pronoun (Edit)</div>
                      <div className="w-[20%] border-r-[3px] border-black flex items-center justify-center text-center">Status (Edit)</div>
                      <div className="flex-1 flex items-center justify-center">action</div>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white text-[13px]">
                      {filteredCharacter.map((item, index) => (
                        <div key={index} className="flex w-full h-[40px] border-b border-gray-100 hover:bg-gray-50 focus-within:bg-blue-50 transition-colors">
                          <div className="w-[10%] border-r-[3px] border-black flex items-center justify-center text-gray-300 font-bold">{index + 1}</div>
                          <input className="w-[30%] border-r-[3px] border-black px-4 font-bold text-gray-700 bg-transparent outline-none focus:text-[#2d4b8e]" value={item.name} onChange={(e) => handleCharacterInlineChange(item.originalName, 'name', e.target.value)} onBlur={() => handleCharacterInlineBlur(item)} />
                          <input className="w-[25%] border-r-[3px] border-black px-4 text-gray-600 bg-transparent outline-none focus:text-[#2d4b8e]" value={item.pronoun} onChange={(e) => handleCharacterInlineChange(item.originalName, 'pronoun', e.target.value)} onBlur={() => handleCharacterInlineBlur(item)} />
                          <input className="w-[20%] border-r-[3px] border-black px-4 text-gray-600 bg-transparent outline-none focus:text-[#2d4b8e]" value={item.status} onChange={(e) => handleCharacterInlineChange(item.originalName, 'status', e.target.value)} onBlur={() => handleCharacterInlineBlur(item)} />
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