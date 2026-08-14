import {
  ActionItem,
  Meeting,
  Summary,
  TranscriptSegment,
} from "../types/meeting";

const BASE_URL = "http://localhost:8000";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  // Centralize JSON requests and turn unsuccessful HTTP responses into errors.
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

export interface ParticipantInput {
  name: string;
  email?: string | null;
}

export interface UpdateMeetingInput {
  title?: string;
  date?: string;
  duration?: number;
  participants?: ParticipantInput[];
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
  // The detail endpoint calls this field `transcript`; the UI uses a shared name.
  return {
    ...data,
    transcript_segments: data.transcript,
  };
}

export function getMeetings(): Promise<Meeting[]> {
  // Fetch the compact meeting list used on the home page.
  return request<Meeting[]>("/meetings");
}

export function mediaUrl(path: string | null | undefined): string | null {
  // Resolve a stored media path into a full, fetchable URL.
  return path ? `${BASE_URL}${path}` : null;
}

export function uploadMeetingMedia(
  meetingId: number,
  file: File
): Promise<Meeting> {
  // Attach a video or audio file to a meeting using multipart form data.
  const form = new FormData();
  form.append("file", file);
  return fetch(`${BASE_URL}/meetings/${meetingId}/media`, {
    method: "POST",
    body: form,
  }).then(async (res) => {
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<Meeting>;
  });
}

export async function getMeeting(id: number): Promise<Meeting> {
  // Fetch the detailed response and normalize its transcript field for the UI.
  const data = await request<MeetingDetailResponse>(`/meetings/${id}`);
  return normalizeMeeting(data);
}

export function createMeeting(data: CreateMeetingInput): Promise<Meeting> {
  // Send the fields collected by the new-meeting form.
  return request<Meeting>("/meetings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMeeting(
  id: number,
  data: UpdateMeetingInput
): Promise<Meeting> {
  // Persist a partial set of meeting changes.
  return request<Meeting>(`/meetings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMeeting(id: number): Promise<void> {
  // Wait for deletion to complete while keeping the public API void-returning.
  await request<{ message: string }>(`/meetings/${id}`, {
    method: "DELETE",
  });
}

export function getTranscript(id: number): Promise<TranscriptSegment[]> {
  // Retrieve transcript segments independently when only transcript data is needed.
  return request<TranscriptSegment[]>(`/meetings/${id}/transcript`);
}

export interface TranscriptSegmentInput {
  speaker: string;
  timestamp?: string | null;
  text?: string | null;
}

export function addTranscriptSegment(
  meetingId: number,
  data: TranscriptSegmentInput
): Promise<TranscriptSegment> {
  // Append one transcript segment to an existing meeting.
  return request<TranscriptSegment>(`/meetings/${meetingId}/transcript`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSummary(id: number): Promise<Summary | null> {
  // Reuse the detail endpoint because it already includes the meeting summary.
  const meeting = await getMeeting(id);
  return meeting.summary;
}

export function getActionItems(id: number): Promise<ActionItem[]> {
  // Retrieve action items independently for the editable action-items panel.
  return request<ActionItem[]>(`/meetings/${id}/actions`);
}

export function createActionItem(
  meetingId: number,
  data: ActionItemInput
): Promise<ActionItem> {
  // Add an action item to the selected meeting.
  return request<ActionItem>(`/meetings/${meetingId}/actions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateActionItem(
  actionId: number,
  data: ActionItemUpdate
): Promise<ActionItem> {
  // Persist changes to an existing action item.
  return request<ActionItem>(`/actions/${actionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteActionItem(actionId: number): Promise<void> {
  // Wait for the delete response without exposing its message to callers.
  await request<{ message: string }>(`/actions/${actionId}`, {
    method: "DELETE",
  });
}
