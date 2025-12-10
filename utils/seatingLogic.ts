import { Student, Desk, SeatingConfig, Seat, Gender } from '../types';

// Fisher-Yates Shuffle
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Generates assignments sequentially based on the student list order.
 * Used primarily during data import to show original order.
 */
export const generateSequentialAssignments = (
  allStudents: Student[],
  config: SeatingConfig,
  disabledSeatIds: Set<string>,
  lockedAssignments: Map<string, Student> // ← 不再使用旧锁，只是参数保留
): Map<string, Student | null> => {

  const { rows, cols } = config;

  // 🟢 输出结果
  const newAssignments = new Map<string, Student | null>();

  // 🟠 1. 清空旧锁定（你要求：导入名单决定锁定）
  disabledSeatIds.clear();
  lockedAssignments.clear();

  // 🟡 2. 过滤出正常要入座的学生
  //   - 跳过“空”
  //   - 跳过“锁”
  const studentsToPlace = allStudents.filter(s =>
    s.name !== '锁'
  );

  // 🔵 3. 找出所有 “锁” 学生 → 禁用对应座位
  allStudents.forEach((s, idx) => {
    if (s.name === '锁') {

      // 按顺序确定锁对应的座位序号
      const seatIndex = idx; // 第几个学生 -> 第几个座位

      // 计算座位位置
      const r = Math.floor(seatIndex / (cols * 2));
      const c = Math.floor((seatIndex % (cols * 2)) / 2);
      const side = seatIndex % 2 === 0 ? 'L' : 'R';

      const deskId = `desk-${r}-${c}`;
      const seatId = `${deskId}-${side}`;

      // 禁用该座位
      disabledSeatIds.add(seatId);
      newAssignments.set(seatId, null);
    }
  });

  // 学生指针
  let studentIndex = 0;

  // 🔶 4. 从上到下、从左到右排座
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {

      const deskId = `desk-${r}-${c}`;
      const seats = [`${deskId}-L`, `${deskId}-R`];

      for (const seatId of seats) {

        // 如果座位禁用 → 不入座
        if (disabledSeatIds.has(seatId)) {
          newAssignments.set(seatId, null);
          continue;
        }
        if(studentsToPlace[studentIndex] &&studentsToPlace[studentIndex].name === '空'){
          newAssignments.set(seatId, null);
          studentIndex++;
          continue;
        }
        // 正常分配学生
        if (studentIndex < studentsToPlace.length) {
          newAssignments.set(seatId, studentsToPlace[studentIndex]);
          studentIndex++;
        } else {
          newAssignments.set(seatId, null);
        }
      }
    }
  }

  return newAssignments;
};


/**
 * 1. Logic Component: Generates a NEW random arrangement.
 * Returns a Map of SeatID -> Student
 */
export const generateNewAssignments = (
  allStudents: Student[],
  config: SeatingConfig,
  disabledSeatIds: Set<string>,
  lockedAssignments: Map<string, Student>
): Map<string, Student | null> => {
  const { rows, cols, allowMixedGender, ignoreGender } = config;
  const newAssignments = new Map<string, Student | null>();

  // --- Step 1: Pre-fill Locked Assignments & Identify Grid Geometry ---
  const availableDesks: { id: string; emptySeats: string[] }[] = [];

  // Initialize assignments with locked students
  lockedAssignments.forEach((student, seatId) => {
    newAssignments.set(seatId, student);
  });

  // Scan the grid to find empty slots, grouped by Desk
  // We iterate top-left to bottom-right (Row major)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const deskId = `desk-${r}-${c}`;
      const seats = [`${deskId}-L`, `${deskId}-R`];
      const emptySeatsForThisDesk: string[] = [];

      for (const seatId of seats) {
        // If disabled, mark as null immediately
        if (disabledSeatIds.has(seatId)) {
          newAssignments.set(seatId, null);
          continue;
        }

        // If locked, it's already set in newAssignments, so skip
        if (newAssignments.has(seatId)) {
          continue;
        }

        // Otherwise, it's a valid empty slot
        emptySeatsForThisDesk.push(seatId);
      }

      if (emptySeatsForThisDesk.length > 0) {
        availableDesks.push({
          id: deskId,
          emptySeats: emptySeatsForThisDesk
        });
      }
    }
  }

  // --- Step 2: Prepare Student Queues (Pairs vs Singles) ---
  
  // Filter out students who are already locked
  const lockedStudentIds = new Set<string>();
  lockedAssignments.forEach(s => lockedStudentIds.add(s.id));
  const availableStudents = allStudents.filter(s => !lockedStudentIds.has(s.id));

  let pairsQueue: Student[][] = [];
  let singlesQueue: Student[] = [];

  if (ignoreGender) {
    // Mode: Mixed Gender Strategy (Prioritize Boy-Girl Pairs)
    // Strategy: Separate M/F, Pair them up, then handle leftovers.
    
    const males = shuffleArray(availableStudents.filter(s => s.gender === 'Male'));
    const females = shuffleArray(availableStudents.filter(s => s.gender === 'Female'));
    const others = shuffleArray(availableStudents.filter(s => s.gender === 'Unknown'));

    // 1. Create Mixed Gender Pairs (M-F)
    while (males.length > 0 && females.length > 0) {
      // Randomly determine who is on Left vs Right to avoid bias
      const p1 = males.pop()!;
      const p2 = females.pop()!;
      if (Math.random() > 0.5) {
        pairsQueue.push([p1, p2]);
      } else {
        pairsQueue.push([p2, p1]);
      }
    }
    
    // 2. Handle Leftovers (Remaining M, F, and U)
    // Since we are in "Mixed Mode", we just shuffle everyone remaining and pair them up.
    let leftovers = [...males, ...females, ...others];
    leftovers = shuffleArray(leftovers);

    while (leftovers.length >= 2) {
      pairsQueue.push([leftovers.pop()!, leftovers.pop()!]);
    }

    if (leftovers.length > 0) {
      singlesQueue.push(leftovers[0]);
    }

    // 3. IMPORTANT: Shuffle the ENTIRE pairs queue now.
    // This ensures that "Perfect Pairs" (M-F) and "Leftover Pairs" (M-M, F-F etc) are
    // distributed randomly throughout the classroom, rather than leftovers being stuck at the end.
    pairsQueue = shuffleArray(pairsQueue);

  } else {
    // Mode: Same Gender Priority
    const males = shuffleArray(availableStudents.filter(s => s.gender === 'Male'));
    const females = shuffleArray(availableStudents.filter(s => s.gender === 'Female'));
    const others = shuffleArray(availableStudents.filter(s => s.gender === 'Unknown'));

    // 1. Create Same-Gender Pairs
    while (males.length >= 2) {
      pairsQueue.push([males.pop()!, males.pop()!]);
    }
    while (females.length >= 2) {
      pairsQueue.push([females.pop()!, females.pop()!]);
    }
    while (others.length >= 2) {
      pairsQueue.push([others.pop()!, others.pop()!]);
    }
    
    // Shuffle the pairs so M-M and F-F are intermixed on the board
    pairsQueue = shuffleArray(pairsQueue);

    // 2. Handle Leftovers
    let leftovers = [...males, ...females, ...others];
    
    if (allowMixedGender) {
      // Try to pair leftovers (M-F)
      leftovers = shuffleArray(leftovers);
      while (leftovers.length >= 2) {
        // Create mixed pairs
        const p1 = leftovers.pop()!;
        const p2 = leftovers.pop()!;
        // Randomize order
        if (Math.random() > 0.5) pairsQueue.push([p1, p2]);
        else pairsQueue.push([p2, p1]);
      }
    }
    
    // Shuffle again if we added mixed pairs to the end, to distribute them?
    // User didn't explicitly ask for this in "Same Gender" mode, but it's good practice.
    // However, usually in "Same Gender" mode, users might prefer keeping the "exceptions" (mixed)
    // at the back. We'll leave it appended for Same Gender mode unless requested.

    // Remaining truly single students
    singlesQueue = leftovers; 
  }

  // --- Step 3: Assign to Desks (Geometry Aware) ---

  for (const desk of availableDesks) {
    const slots = desk.emptySeats; // Array of seatIDs (length 1 or 2)

    if (slots.length === 2) {
      // --- Case: Double Desk (2 Empty Slots) ---
      // Priority 1: Assign a Pair
      if (pairsQueue.length > 0) {
        const pair = pairsQueue.pop()!;
        newAssignments.set(slots[0], pair[0]);
        newAssignments.set(slots[1], pair[1]);
      } 
      // Priority 2: Assign 2 Singles
      else if (singlesQueue.length >= 2) {
        const s1 = singlesQueue.pop()!;
        const s2 = singlesQueue.pop()!;
        
        // STRICT SEPARATION LOGIC
        // Only applies if we are in Same Gender Mode (!ignoreGender) and mixed leftovers are NOT allowed.
        if (!ignoreGender && !allowMixedGender) {
           const g1 = s1.gender;
           const g2 = s2.gender;
           
           // If they are different genders (and not unknown), they cannot sit together.
           if (g1 !== g2 && g1 !== 'Unknown' && g2 !== 'Unknown') {
              // Seat s1 alone.
              newAssignments.set(slots[0], s1);
              newAssignments.set(slots[1], null); 
              
              // Return s2 to queue to be seated at the next desk
              singlesQueue.push(s2); 
           } else {
              // Same gender or allowed.
              newAssignments.set(slots[0], s1);
              newAssignments.set(slots[1], s2);
           }
        } else {
           // Mixed Mode or Mixed Allowed
           newAssignments.set(slots[0], s1);
           newAssignments.set(slots[1], s2);
        }
      } 
      // Priority 3: Assign 1 Single (Leftover)
      else if (singlesQueue.length === 1) {
        newAssignments.set(slots[0], singlesQueue.pop()!);
        newAssignments.set(slots[1], null);
      } 
      else {
        // No students left
        newAssignments.set(slots[0], null);
        newAssignments.set(slots[1], null);
      }
    } 
    else {
      // --- Case: Single Desk (1 Empty Slot) ---
      // (Other slot is Disabled or Locked)
      
      // Priority 1: Use a Single
      if (singlesQueue.length > 0) {
        newAssignments.set(slots[0], singlesQueue.pop()!);
      } 
      // Priority 2: Break a Pair
      else if (pairsQueue.length > 0) {
        const pair = pairsQueue.pop()!;
        newAssignments.set(slots[0], pair[0]);
        // The partner becomes single
        singlesQueue.push(pair[1]); 
      } 
      else {
        newAssignments.set(slots[0], null);
      }
    }
  }

  return newAssignments;
};

/**
 * 2. Visual Component: Builds the Desk/Seat objects from the state.
 * Does NOT randomize. Purely maps IDs to objects.
 */
export const buildDesksFromState = (
    currentAssignments: Map<string, Student | null>,
    config: SeatingConfig,
    disabledSeatIds: Set<string>,
    lockedAssignments: Map<string, Student>
): Desk[] => {
    const { rows, cols } = config;
    const desks: Desk[] = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const deskId = `desk-${r}-${c}`;
            const leftId = `${deskId}-L`;
            const rightId = `${deskId}-R`;

            const createSeat = (seatId: string): Seat => {
                const isLocked = lockedAssignments.has(seatId);
                const isDisabled = disabledSeatIds.has(seatId);
                
                const student = currentAssignments.get(seatId) || null;

                return {
                    id: seatId,
                    student: student,
                    isDisabled: isDisabled,
                    isLocked: isLocked
                };
            };

            desks.push({
                id: deskId,
                row: r + 1,
                col: c + 1,
                leftSeat: createSeat(leftId),
                rightSeat: createSeat(rightId)
            });
        }
    }
    return desks;
};

export const normalizeGender = (input: string): Gender => {
  const lower = input.trim().toLowerCase();
  if (['m', 'male', 'boy', 'man', '男', '男生'].includes(lower)) return 'Male';
  if (['f', 'female', 'girl', 'woman', '女', '女生'].includes(lower)) return 'Female';
  return 'Unknown';
};