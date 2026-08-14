export interface Participant {
  id: number;
  meeting_id: number;
  name: string;
  email: string | null;
}

export interface TranscriptSegment {
  id: number;
  meeting_id: number;
  speaker: string;
  timestamp: string | null;
  text: string | null;
}

export interface Summary {
  id: number;
  meeting_id: number;
  overview: string | null;
}

export interface ActionItem {
  id: number;
  meeting_id: number;
  title: string;
  assignee: string | null;
  completed: boolean;
}

export interface Meeting {
  id: number;
  title: string;
  date: string;
  duration: number | null;
  participants: Participant[];
  transcript_segments: TranscriptSegment[];
  summary: Summary | null;
  action_items: ActionItem[];
}
