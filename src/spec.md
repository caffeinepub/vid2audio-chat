# Specification

## Summary
**Goal:** Provide a chat-style web UI that converts user-supplied videos (uploaded files or accessible direct video URLs) into downloadable MP3 or WAV audio, with clear status, progress, and history.

**Planned changes:**
- Build a conversational (chat-thread) interface with an input composer that supports pasting a video URL and selecting a local video file.
- Add a guided flow in-chat to select output format (MP3/WAV) and start conversion, with English prompts and validation for empty/invalid URLs.
- Implement client-side conversion for uploaded video files to MP3 and WAV, showing progress/busy states, handling errors safely, and providing a download action plus basic output metadata (format, filename).
- Attempt in-browser fetching/conversion for publicly accessible direct video file URLs; when inaccessible (e.g., CORS/auth/non-direct), show a clear English fallback message recommending file upload.
- Record a conversion job history within the same chat thread, including input type (Link/Upload), chosen format, status (Pending/Converting/Done/Failed), timestamp, and (on success) a download link that works until page refresh.
- Apply a consistent, distinct visual theme across the chat UI and states (avoid a blue/purple-dominant palette), with clear hover/focus/disabled/loading styling.

**User-visible outcome:** Users can interact in a chat-like screen to paste a video link or upload a video, choose MP3 or WAV, watch conversion progress, download the resulting audio, and review past conversion attempts (including failures with reasons) in the same conversation thread.
