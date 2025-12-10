import React from 'react';
import { Desk as DeskType, Student, Seat } from '../types';
import { Ban, CheckCircle, Lock, Unlock } from 'lucide-react';

interface ClassroomProps {
  desks: DeskType[];
  rows: number;
  cols: number;
  onToggleDisable: (seatId: string) => void;
  onToggleLock: (seatId: string) => void;
  onSwapSeats: (sourceId: string, targetId: string) => void;
}

interface StudentSeatProps {
  seat: Seat;
  label: string;
  onToggleDisable: (id: string) => void;
  onToggleLock: (id: string) => void;
  onSwapSeats: (sourceId: string, targetId: string) => void;
}

const StudentSeat: React.FC<StudentSeatProps> = ({ seat, label, onToggleDisable, onToggleLock, onSwapSeats }) => {
  const { student, isDisabled, isLocked, id } = seat;

  const handleDragStart = (e: React.DragEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isDisabled) return;
    e.preventDefault(); // Allow drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isDisabled) return;
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId) {
      onSwapSeats(sourceId, id);
    }
  };

  // Styles
  const buttonBaseClass = "p-1 bg-white/80 hover:bg-white rounded-full shadow-sm transition-all z-10 flex items-center justify-center w-[25px] h-[25px]";

  if (isDisabled) {
    return (
      <div className="group relative flex-1 flex flex-col items-center justify-center h-20 bg-gray-200 rounded border border-gray-300 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[length:10px_10px]"></div>
        <Ban size={25} className="text-gray-400 opacity-50" />
        <button 
          onClick={() => onToggleDisable(id)}
          className={`absolute top-1 right-1 ${buttonBaseClass} opacity-0 group-hover:opacity-100 hover:text-green-600`}
          title="Enable Seat"
        >
           <CheckCircle size={16} />
        </button>
      </div>
    );
  }

  if (!student) {
    return (
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="group relative flex-1 flex flex-col items-center justify-center h-20 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-300 transition-colors hover:bg-gray-100 hover:border-gray-400"
      >
        <span className="text-xs font-mono select-none">{label}</span>
        <span className="text-xs select-none">Empty</span>
        
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onToggleDisable(id)}
            className={`${buttonBaseClass} text-gray-400 hover:text-red-500`}
            title="Disable Seat"
          >
            <Ban size={16} />
          </button>
        </div>
      </div>
    );
  }

  const genderColor = 
    student.gender === 'Male' ? 'bg-blue-100 text-blue-800 ' : 
    student.gender === 'Female' ? 'bg-pink-100 text-pink-800 ' : 
    'bg-gray-100 text-gray-800 border-gray-300';

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`group relative flex-1 flex flex-col items-center justify-center h-20 rounded  ${genderColor} transition-all hover:shadow-md hover:scale-[1.02] cursor-move select-none ${isLocked ? 'ring-[5px] ring-yellow-400' : ''}`}
    >
      <span className="text-lg font-bold leading-tight px-1 text-center line-clamp-2 text-[1.525rem] md:text-[1.525rem]" title={student.name}>
        {student.name}
      </span>
      
      {/* Controls Container */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        
        {/* Lock Button */}
        <button 
          onClick={() => onToggleLock(id)}
          className={`${buttonBaseClass} ${isLocked ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500'}`}
          title={isLocked ? "Unlock Seat" : "Lock Student"}
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>

        {/* Disable Button */}
        <button 
          onClick={() => onToggleDisable(id)}
          className={`${buttonBaseClass} text-gray-400 hover:text-red-500`}
          title="Disable Seat"
        >
          <Ban size={16} />
        </button>
      </div>

      {/* Lock Indicator (Visible even when not hovering if locked) */}
      {isLocked && (
        <div className="absolute top-1 left-1 text-yellow-500 opacity-50 pointer-events-none">
          <Lock size={12} />
        </div>
      )}
    </div>
  );
};

const Classroom: React.FC<ClassroomProps> = ({ desks, rows, cols, onToggleDisable, onToggleLock, onSwapSeats }) => {
  return (
    <div className="flex-1 h-screen overflow-auto bg-gray-100 p-8 relative">
      <div className="min-w-fit mx-auto">
        <div className="mb-6 flex justify-between items-end flex-wrap gap-4 w-full max-w-7xl mx-auto">
           <div>
             <h2 className="text-2xl font-bold text-gray-800">教室布局</h2>
             <p className="text-gray-500 text-sm">讲台区域</p>
           </div>
           <div className="flex gap-4 text-xs font-medium flex-wrap">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div> 男</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-pink-100 border border-pink-300 rounded"></div> 女</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded relative overflow-hidden"><div className="absolute inset-0 bg-black/10"></div></div> 不可坐</div>
              <div className="flex items-center gap-1"><Lock size={12} className="text-yellow-500"/> 固定座位</div>
           </div>
        </div>
        
        {/* Chalkboard / Front indicator */}
        <div className="w-full max-w-3xl mx-auto h-4 bg-gray-300 rounded-full mb-10 shadow-inner flex items-center justify-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">--------黑-------板--------</span>
        </div>

        <div 
          className="grid gap-6 mx-auto pb-20 w-fit"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(200px, 1fr))`
          }}
        >
          {desks.map((desk) => (
            <div 
              key={desk.id} 
              className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-2 relative transition-shadow duration-300"
            >
              {/* <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full z-10 whitespace-nowrap">
                桌子 {desk.row}-{desk.col}
              </div> */}
              <div className="flex gap-2 w-full mt-2">
                <StudentSeat 
                  seat={desk.leftSeat} 
                  label="L" 
                  onToggleDisable={onToggleDisable}
                  onToggleLock={onToggleLock}
                  onSwapSeats={onSwapSeats}
                />
                <StudentSeat 
                  seat={desk.rightSeat} 
                  label="R" 
                  onToggleDisable={onToggleDisable}
                  onToggleLock={onToggleLock}
                  onSwapSeats={onSwapSeats}
                />
              </div>
              {/* Desk Surface visual */}
              <div className="h-2 w-full bg-amber-100 rounded-b-lg border-t border-amber-200"></div>
            </div>
          ))}
        </div>

        {desks.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
            <p className="text-lg">No students loaded.</p>
            <p className="text-sm">Use the sidebar to import names.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classroom;