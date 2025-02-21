export interface Message {
  text: string;
  translation?: string;
  audioUrl?: string;
  isUser: boolean;
  isTranscribed?: boolean;
}