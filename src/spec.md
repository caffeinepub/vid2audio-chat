# Specification

## Summary
**Goal:** Make URL-based TikTok conversions more resilient and improve frontend error handling so MP3 conversions never crash and failures provide clear, accurate English messaging.

**Planned changes:**
- Harden the client-side MP3 encoding/conversion pipeline to prevent uncaught exceptions (e.g., null buffer errors) and ensure jobs reliably end as Done (with download) or Failed (with a user-friendly English error).
- Improve URL fetch/resolution for TikTok short links by following redirects and attempting best-effort retrieval of the underlying video content before failing.
- Relax overly strict response validation so conversion can proceed when a fetched Blob is convertible even if Content-Type is missing or is `application/octet-stream` (instead of requiring `video/*`).
- Update URL fetch failure messages to be English, specific (invalid URL vs blocked fetch vs non-video response), and accurate about third-party access limitations while noting the app will try multiple strategies.

**User-visible outcome:** Users can upload a video and convert it to MP3 without the UI crashing; URL-based conversions (including TikTok short links) try more reliably to fetch and convert videos, and when something can’t be accessed, the app shows clear English failure reasons and suggested alternatives.
