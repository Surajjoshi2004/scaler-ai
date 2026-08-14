import {
  ActionItem,
  Meeting,
  Participant,
  Summary,
  TranscriptSegment,
} from "../types/meeting";

const BASE_URL = "http://localhost:8000";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export interface CreateMeetingInput {
  title: string;
  date: string;
  duration?: number;
}

export interface UpdateMeetingInput {
  title?: string;
  date?: string;
  duration?: number;
  participants?: Participant[];
}

export interface ActionItemInput {
  title: string;
  assignee?: string;
  completed?: boolean;
}

export interface ActionItemUpdate {
  title?: string;
  assignee?: string;
  completed?: boolean;
}

type MeetingDetailResponse = Omit<Meeting, "transcript_segments"> & {
  transcript: TranscriptSegment[];
};

function normalizeMeeting(data: MeetingDetailResponse): Meeting {
  return {
    ...data,
    transcript_segments: data.transcript,
  };
}

export function getMeetings(): Promise<Meeting[]> {
  return request<Meeting[]>("/meetings");
}

export async function getMeeting(id: number): Promise<Meeting> {
  const data = await request<MeetingDetailResponse>(`/meetings/${id}`);
  return normalizeMeeting(data);
}

export function createMeeting(data: CreateMeetingInput): Promise<Meeting> {
  return request<Meeting>("/meetings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMeeting(
  id: number,
  data: UpdateMeetingInput
): Promise<Meeting> {
  return request<Meeting>(`/meetings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMeeting(id: number): Promise<void> {
  await request<{ message: string }>(`/meetings/${id}`, {
    method: "DELETE",
  });
}

export function getTranscript(id: number): Promise<TranscriptSegment[]> {
  return request<TranscriptSegment[]>(`/meetings/${id}/transcript`);
}

export async function getSummary(id: number): Promise<Summary | null> {
  const meeting = await getMeeting(id);
  return meeting.summary;
}

export function getActionItems(id: number): Promise<ActionItem[]> {
  return request<ActionItem[]>(`/meetings/${id}/actions`);
}

export function createActionItem(
  meetingId: number,
  data: ActionItemInput
): Promise<ActionItem> {
  return request<ActionItem>(`/meetings/${meetingId}/actions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateActionItem(
  actionId: number,
  data: ActionItemUpdate
): Promise<ActionItem> {
  return request<ActionItem>(`/actions/${actionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteActionItem(actionId: number): Promise<void> {
  await request<{ message: string }>(`/actions/${actionId}`, {
    method: "DELETE",
  });
}
