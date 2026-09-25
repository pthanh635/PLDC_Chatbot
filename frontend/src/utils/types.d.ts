export interface ISentMessage {
  id: string;
  content: ISentMessageContent;
  mode: LegalMode;
}

export interface IReceivedMessage {
  id: string;
  text: string;
  sources?: SourceItem[];
  isLiked: 0 | 1 | 2; // 0: none, 1: liked, 2: unliked
}

export interface IUploadedFile {
  file: File;
  id: string;
  preview?: string;
}

export interface ISentMessageContent {
  text: string;
  files: IUploadedFile[];
}

export type LegalMode =
  | "nhan_dinh"
  | "so_sanh"
  | "tinh_huong"
  | "dinh_nghia";

export interface SourceItem {
  source: string;
  page: string;
  score: number | null;
  text_preview: string;
}

export interface ChatResponse {
  mode: LegalMode;
  answer: string;
  sources: SourceItem[];
  mock: boolean;
}

export interface IChatSequence {
  id: string;
  type: "sent" | "received";
}
