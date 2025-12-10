export type Gender = 'Male' | 'Female' | 'Unknown';

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  originalGenderString: string;
}

export interface Seat {
  id: string; // Unique ID for the seat (e.g., desk-0-0-L)
  student: Student | null;
  isDisabled: boolean;
  isLocked: boolean;
}

export interface Desk {
  id: string;
  row: number;
  col: number;
  leftSeat: Seat;
  rightSeat: Seat;
}

export interface SeatingConfig {
  rows: number;
  cols: number;
  allowMixedGender: boolean; // If true, leftovers can be paired M-F
  ignoreGender: boolean; // If true, completely ignore gender when pairing
}