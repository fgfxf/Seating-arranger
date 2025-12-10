import { Student, Desk, Gender } from '../types';
import { normalizeGender } from './seatingLogic';

export const parseInputData = (text: string): Student[] => {
  const lines = text.split(/\r?\n/);
  const students: Student[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Handle CSV or simple comma separation
    // Assuming format: "Name, Gender" or "Name,Gender"
    const parts = trimmed.split(/,|，/); // Support English and Chinese comma
    
    if (parts.length >= 1) {
      const name = parts[0].trim();
      // If no gender provided, default to unknown
      const genderStr = parts.length > 1 ? parts[1].trim() : '';
      
      if (name) {
        students.push({
          id: Math.random().toString(36).substr(2, 9),
          name,
          gender: normalizeGender(genderStr),
          originalGenderString: genderStr
        });
      }
    }
  });

  return students;
};

export const exportToCSV = (desks: Desk[]) => {
  function genderToChinese(gender: Gender): string {
  switch (gender) {
    case 'Male':
      return '男';
    case 'Female':
      return '女';
    default:
      return '';
  }
}

  const rows: string[] = [];

  desks.forEach(desk => {
    const left = desk.leftSeat;
    const right = desk.rightSeat;

    if (left.student) {
      rows.push(`${left.student.name},${genderToChinese(left.student.gender)}`);
    }else if(left.isDisabled){
      rows.push("锁");
    }else{
      rows.push("空");
    }

    if (right.student) {
      rows.push(`${right.student.name},${genderToChinese(right.student.gender)}`);
    }else if(right.isDisabled){
      rows.push("锁");
    }else{
      rows.push("空");
    }
  });

  // 🔑 找到最后一个真正有名字的学生
  let lastIndex = rows.length - 1;
  for (; lastIndex >= 0; lastIndex--) {
    const r = rows[lastIndex];
    if (r !== "空" && r !== "锁") break;
  }

  // 截取数组，只保留到最后一个有名字的学生
  const finalRows = rows.slice(0, lastIndex + 1);
  const csvContent = [...finalRows].join('\n');
  
  // Add BOM (Byte Order Mark) to ensure Excel opens UTF-8 correctly
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'seating_arrangement.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};