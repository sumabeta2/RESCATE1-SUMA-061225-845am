export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  attachments?: Attachment[];
  timestamp: number;
  isStreaming?: boolean;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
}

export interface FileMetadata {
  name: string;
  status: 'pending' | 'ready' | 'error';
  lastModified: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  RECOVERY_MODE = 'RECOVERY_MODE',
  ACTIVE = 'ACTIVE'
}

export type RoleType = 'MEDICO' | 'ENFERMERO' | 'PARAMEDICO' | 'PRIMER_RESPONDIENTE';

export interface PatientData {
  name: string;
  age: string;
  sex: string;
  medication: string;
  history: string;
}

export interface ClinicalCase {
  id: string;
  patientName: string;
  date: string;
  diagnosis_summary: string;
  isProtected: boolean;
  data: PatientData;
  roleUsed: RoleType;
}

export interface AccessCode {
  code: string;
  type: '24H' | 'MONTHLY';
  status: 'AVAILABLE' | 'ACTIVE' | 'BLOCKED' | 'EXPIRED' | 'USED';
  createdAt: string;
  expiresAt?: string; // Optional until activated
  // Binding logic
  assignedTo?: string; // Name
  phoneNumber?: string;
  deviceId?: string; // IMEI
  activatedAt?: string;
}