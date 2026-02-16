# Specification

## Summary
**Goal:** Improve the user experience and error guidance when converting YouTube/TikTok links that typically cannot be fetched directly in the browser.

**Planned changes:**
- Detect YouTube (youtube.com, youtu.be) and TikTok (tiktok.com) URLs early in the link conversion flow and fail fast with a tailored English error that explains common browser access restrictions (CORS/auth/anti-bot) and instructs users to download and upload the video file instead.
- Add an English inline warning in the URL input UI when a YouTube or TikTok link is pasted, while still allowing users to attempt conversion.
- Refine fetch failure classification so YouTube/TikTok fetch errors show the tailored guidance instead of the generic “Unable to access the video” message, while keeping existing English error specificity for other URLs.

**User-visible outcome:** When users paste YouTube or TikTok links, they see an upfront warning and, if conversion fails, a fast, clear English message explaining why and telling them to download the video and upload it as a file instead; other URLs continue to behave as before with specific English errors.
