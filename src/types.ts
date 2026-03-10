export enum Difficulty {
  BASIC = 'Básico',
  INTERMEDIATE = 'Intermedio',
  ADVANCED = 'Avanzado'
}

export interface PatientCase {
  id: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  difficulty: Difficulty;
  chiefComplaint: string;
  context: string;
  emotionalState: string;
  educationLevel: string;
  hiddenData: {
    medicalHistory: string;
    familyHistory: string;
    socialHistory: string;
    currentIllnessDetails: string;
  };
  systemInstruction: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Evaluation {
  score: number;
  metrics: {
    empathy: number;
    logic: number;
    clarity: number;
    completeness: number;
  };
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestedQuestions: string[];
}

export interface Attempt {
  id: string;
  caseId: string;
  date: number;
  transcript: Message[];
  evaluation?: Evaluation;
}
