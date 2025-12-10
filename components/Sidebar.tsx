import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, RefreshCw, Users, Settings, FileText, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Student, SeatingConfig } from '../types';
import { parseInputData } from '../utils/fileHandlers';

interface SidebarProps {
  students: Student[];
  onImport: (students: Student[]) => void;
  onConfigChange: (config: SeatingConfig) => void;
  onShuffle: () => void;
  onExport: () => void;
  currentConfig: SeatingConfig;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  students, 
  onImport, 
  onConfigChange, 
  onShuffle,
  onExport,
  currentConfig 
}) => {
  const [inputText, setInputText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize collapse state based on screen width
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    
    // Set initial state
    checkMobile();
  }, []);

  const handleTextImport = () => {
    const parsed = parseInputData(inputText);
    if (parsed.length > 0) {
      onImport(parsed);
      // Keep text after loading
    }
  };

  const handleClearText = () => {
    setInputText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseInputData(text);
      onImport(parsed);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const maleCount = students.filter(s => s.gender === 'Male').length;
  const femaleCount = students.filter(s => s.gender === 'Female').length;

  return (
    <div 
      className={`
        bg-white border-r border-gray-200 flex flex-col shadow-lg z-20 transition-all duration-300 ease-in-out
        ${isCollapsed 
          ? 'md:w-16 w-full h-auto' 
          : 'md:w-60 w-full md:h-full h-[75vh]'
        }
        ${isCollapsed ? 'overflow-hidden' : 'overflow-hidden'} 
      `}
    >
      {/* Header & Toggle */}
      <div className={`flex items-center p-4 bg-indigo-600 text-white shrink-0 h-16 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        
        {/* Title - Hidden when collapsed */}
        <div className={`flex items-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users size={24} />
            <span className="hidden md:inline">Seating</span>
            <span className="md:hidden">座位管理系统</span>
          </h1>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {/* Mobile Icon */}
          <span className="md:hidden">
            {isCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </span>
          {/* Desktop Icon */}
          <span className="hidden md:block">
            {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </span>
        </button>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto transition-opacity duration-200 ${isCollapsed ? 'hidden opacity-0' : 'block opacity-100'}`}>
        <div className="p-6 space-y-8">
          
          {/* Import Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} /> 数据输入
            </h2>
            <div>首次按加载顺序入座</div>
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition-colors text-center cursor-pointer bg-gray-50"
                 onClick={() => fileInputRef.current?.click()}>
              <Upload className="mx-auto text-gray-400 mb-2" size={24} />
              <p className="text-sm text-gray-600 font-medium">上传 CSV/TXT</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.txt"
                onChange={handleFileUpload}
              />
            </div>

            <div className="relative">
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y min-h-[100px] pb-10"
                placeholder="粘贴数据...&#10;张老师,男&#10;李老师,女&#10;用英文分号间隔"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              {inputText && (
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button 
                    onClick={handleClearText}
                    className="bg-gray-200 text-gray-600 px-3 py-1 text-xs rounded-full hover:bg-gray-300 transition"
                    title="Clear text"
                  >
                    Clear
                  </button>
                  <button 
                    onClick={handleTextImport}
                    className="bg-indigo-600 text-white px-3 py-1 text-xs rounded-full hover:bg-indigo-700 transition"
                  >
                    Load
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 px-1 font-mono">
              <span>合计: {students.length}</span>
              <span className="text-blue-600">M: {maleCount}</span>
              <span className="text-pink-600">F: {femaleCount}</span>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Settings size={16} /> 其他配置
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">行数</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={currentConfig.rows}
                  onChange={(e) => onConfigChange({...currentConfig, rows: parseInt(e.target.value) || 1})}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">列数</label>
                <input 
                  type="number" 
                  min="1" 
                  max="12"
                  value={currentConfig.cols}
                  onChange={(e) => onConfigChange({...currentConfig, cols: parseInt(e.target.value) || 1})}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>
            </div>
            
            {/* Seating Strategy Section */}
            <div className="bg-white p-3 border border-gray-200 rounded-lg space-y-3">
               <h3 className="text-xs font-bold text-gray-600 uppercase">排座策略</h3>
               
               {/* Option 1: Same Gender */}
               <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-2">
                    <input 
                       id="strategySame" 
                       type="radio" 
                       name="seatingStrategy"
                       checked={!currentConfig.ignoreGender}
                       onChange={() => onConfigChange({...currentConfig, ignoreGender: false})}
                       className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="strategySame" className="text-sm font-medium text-gray-700">同性排座</label>
                 </div>
                 
                 {/* Indented Sub-option for Same Gender */}
                 <div className={`ml-6 transition-all duration-300 ${currentConfig.ignoreGender ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex items-start gap-2">
                        <input
                            id="mixedLeftovers"
                            type="checkbox"
                            checked={currentConfig.allowMixedGender}
                            onChange={(e) => onConfigChange({...currentConfig, allowMixedGender: e.target.checked})}
                            disabled={currentConfig.ignoreGender}
                            className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="mixedLeftovers" className="text-xs text-gray-600 leading-tight">
                            如果同性人数不足，则允许男女混坐
                        </label>
                    </div>
                 </div>
               </div>
               
               <hr className="border-gray-100" />

               {/* Option 2: Mixed Gender */}
               <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                    <input 
                       id="strategyMixed" 
                       type="radio" 
                       name="seatingStrategy"
                       checked={currentConfig.ignoreGender}
                       onChange={() => onConfigChange({...currentConfig, ignoreGender: true})}
                       className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="strategyMixed" className="text-sm font-medium text-gray-700">完全男女混坐</label>
                 </div>
                 <div className="ml-6">
                    <p className="text-xs text-gray-400">尽可能先将异性安排在一起。</p>
                 </div>
               </div>

            </div>

          </div>

          {/* Actions */}
          <div className="pt-4 space-y-3 pb-8">
            <button 
              onClick={onShuffle}
              disabled={students.length === 0}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all shadow-md
                ${students.length === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:scale-95'}`}
            >
              <RefreshCw size={20} className={students.length > 0 ? "transition-transform active:rotate-180" : ""} />
              点击打乱座位
            </button>
            
            <button 
              onClick={onExport}
              disabled={students.length === 0}
              className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-gray-50 transition-colors"
            >
              <Download size={20} />
              导出结果 CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;