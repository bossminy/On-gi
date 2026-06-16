export type PersonaType = "colleague" | "therapist" | "senior";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: string; // "sunny" | "cloudy" | "rainy" | "windy"
  title: string;
  content: string;
  selfPraise: string; // A compliment written to oneself
}

export interface Prescription {
  id: string;
  date: string;
  stressLevel: number;
  schoolGrade: string;
  mainStruggle: string;
  content: string; // Markdown response from Gemini
}
