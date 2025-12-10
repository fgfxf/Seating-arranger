import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Classroom from './components/Classroom';
import { Student, SeatingConfig } from './types';
import { generateNewAssignments, buildDesksFromState, generateSequentialAssignments } from './utils/seatingLogic';
import { exportToCSV } from './utils/fileHandlers';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [config, setConfig] = useState<SeatingConfig>({
    rows: 6,
    cols: 5,
    allowMixedGender: false,
    ignoreGender: false,
  });
  
  // State 1: Configuration of the physical room (Disabled Seats)
  const [disabledSeatIds, setDisabledSeatIds] = useState<Set<string>>(new Set());
  
  // State 2: User preferences (Locked Students)
  const [lockedAssignments, setLockedAssignments] = useState<Map<string, Student>>(new Map());

  // State 3: Current Position of everyone (SeatID -> Student | null)
  // This is the Source of Truth for position.
  const [currentAssignments, setCurrentAssignments] = useState<Map<string, Student | null>>(new Map());

  // Derived State: The Desk Objects used for rendering
  const desks = useMemo(() => {
    return buildDesksFromState(currentAssignments, config, disabledSeatIds, lockedAssignments);
  }, [currentAssignments, config, disabledSeatIds, lockedAssignments]);


  // 1. SHUFFLE / INITIALIZE: Generates a brand new layout
  const handleShuffle = useCallback(() => {
    const newMap = generateNewAssignments(students, config, disabledSeatIds, lockedAssignments);
    setCurrentAssignments(newMap);
  }, [students, config, disabledSeatIds, lockedAssignments]);


  // Initial load effect
  useEffect(() => {
    // Only run initial shuffle if we have students and no assignments yet
    if (students.length > 0 && currentAssignments.size === 0) {
        handleShuffle();
    }
  }, [students, handleShuffle, currentAssignments.size]);


  const handleImport = (newStudents: Student[]) => {
    // Auto-adjust grid size
    const availableSeatsPerDesk = 2; 
    let newRows = config.rows;
    let newCols = config.cols;

    if (newStudents.length > newRows * newCols * availableSeatsPerDesk) {
        const requiredDesks = Math.ceil(newStudents.length / availableSeatsPerDesk);
        newCols = config.cols; 
        newRows = Math.ceil(requiredDesks / newCols);
    }
    
    const newConfig = { ...config, rows: newRows, cols: newCols };
    
    // Reset locks on new import
    const newLocks = new Map<string, Student>();

    // Generate assignments SEQUENTIALLY (preserving import order)
    const sequentialAssignments = generateSequentialAssignments(
      newStudents,
      newConfig,
      disabledSeatIds,
      newLocks
    );
    newStudents = newStudents.filter(s =>
    s.name !== '锁' &&
    s.name !== '空',
  );
    // Update all states
    setStudents(newStudents);
    setConfig(newConfig);
    setLockedAssignments(newLocks);
    setCurrentAssignments(sequentialAssignments);
  };

  const handleExport = () => {
    exportToCSV(desks);
  };

  // 2. TOGGLE DISABLE:
  // Logic: Mark disabled. If student exists, move to first empty valid seat. Do NOT reshuffle others.
  const handleToggleDisable = (targetSeatId: string) => {
    setDisabledSeatIds(prev => {
      const nextDisabled = new Set(prev);
      const isDisabling = !nextDisabled.has(targetSeatId);

      // Update the Set
      if (isDisabling) {
        nextDisabled.add(targetSeatId);
      } else {
        nextDisabled.delete(targetSeatId);
      }

      // Handle Student Displacement
      if (isDisabling) {
        const displacedStudent = currentAssignments.get(targetSeatId);
        
        // If there was someone here, we need to move them
        if (displacedStudent) {
            // Remove from current seat
            setCurrentAssignments(curr => {
                const nextAssignments = new Map(curr);
                nextAssignments.delete(targetSeatId);
                
                // Find first empty seat
                // Iterate exactly as the grid renders to find "First" (Top-Left to Bottom-Right)
                let moved = false;
                for (let r = 0; r < config.rows; r++) {
                    for (let c = 0; c < config.cols; c++) {
                        const deskId = `desk-${r}-${c}`;
                        const seats = [`${deskId}-L`, `${deskId}-R`];
                        
                        for (const sId of seats) {
                            // Candidate must be:
                            // 1. Not the seat we just disabled
                            // 2. Not in the disabled list (use nextDisabled)
                            // 3. Not locked (conceptually, locked usually implies occupied, but check anyway)
                            // 4. Currently Empty
                            if (sId !== targetSeatId && 
                                !nextDisabled.has(sId) && 
                                !lockedAssignments.has(sId) && 
                                !nextAssignments.get(sId)) {
                                
                                nextAssignments.set(sId, displacedStudent);
                                moved = true;
                                break;
                            }
                        }
                        if (moved) break;
                    }
                    if (moved) break;
                }
                
                // If we couldn't find a spot, they are unfortunately removed from the board 
                // (appearing in 'No students loaded' if list empty, but here they just vanish from view until next shuffle)
                return nextAssignments;
            });

            // Also remove any lock on this seat just in case
            if (lockedAssignments.has(targetSeatId)) {
                setLockedAssignments(locks => {
                    const nextLocks = new Map(locks);
                    nextLocks.delete(targetSeatId);
                    return nextLocks;
                });
            }
        }
      }

      return nextDisabled;
    });
  };

  // 3. TOGGLE LOCK:
  // Logic: Just update the lock map. Do NOT move anyone.
  const handleToggleLock = (seatId: string) => {
    const studentInSeat = currentAssignments.get(seatId);

    setLockedAssignments(prev => {
      const next = new Map(prev);
      if (next.has(seatId)) {
        // Unlock
        next.delete(seatId);
      } else if (studentInSeat) {
        // Lock only if there is a student
        next.set(seatId, studentInSeat);
      }
      return next;
    });
  };

  // 4. SWAP SEATS:
  // Logic: Swap values in the Map. Update Locks if necessary.
  const handleSeatSwap = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    setCurrentAssignments(prev => {
        const next = new Map(prev);
        const sourceStudent = next.get(sourceId) || null;
        const targetStudent = next.get(targetId) || null;

        // Perform Swap
        if (sourceStudent) next.set(targetId, sourceStudent);
        else next.set(targetId, null); // Explicitly set null to clear if empty

        if (targetStudent) next.set(sourceId, targetStudent);
        else next.set(sourceId, null);

        // Update Locks Logic:
        // If I drag a LOCKED student A to seat B. 
        // Logic choice: Does the Lock stay at A (now holding B), or move with A?
        // Standard UX: The "Seat" is usually locked, or the "Student" is locked.
        // Based on previous code `lockedAssignments` maps SeatID -> Student.
        // Let's implement: The lock follows the STUDENT if possible, or we just clear locks involved to avoid confusion.
        // Simplest: Clear locks on swapped seats to avoid mismatch (User must re-lock if desired).
        if (lockedAssignments.has(sourceId) || lockedAssignments.has(targetId)) {
             // We do this in a setTimeout to avoid updating state while rendering another state update 
             // (though here it's fine as we aren't in render).
             // But we need to access setLockedAssignments outside this callback.
        }

        return next;
    });

    // Handle lock clearing for involved seats separately
    if (lockedAssignments.has(sourceId) || lockedAssignments.has(targetId)) {
        setLockedAssignments(prev => {
            const next = new Map(prev);
            // We can try to be smart: if Source was locked, lock Target now?
            // For now, let's just UNLOCK swapped seats to prevent "Ghost locks" (Lock says Bob, but Alice is there)
            next.delete(sourceId);
            next.delete(targetId);
            return next;
        });
    }
  };

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-gray-100">
      <Sidebar 
        students={students} 
        onImport={handleImport}
        onConfigChange={(newConfig) => {
             setConfig(newConfig);
             // Note: Changing dimensions might hide students if grid shrinks. 
             // We aren't automatically reshuffling here to preserve state, 
             // but user might lose visibility of students in high rows/cols.
             // Ideally, we might trigger a reshuffle if rows/cols change significantly, 
             // but per request "don't reshuffle", we leave it.
        }}
        currentConfig={config}
        onShuffle={handleShuffle}
        onExport={handleExport}
      />
      <Classroom 
        desks={desks} 
        rows={config.rows} 
        cols={config.cols}
        onToggleDisable={handleToggleDisable}
        onToggleLock={handleToggleLock}
        onSwapSeats={handleSeatSwap}
      />
    </div>
  );
};

export default App;