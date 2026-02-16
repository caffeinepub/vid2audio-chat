# Specification

## Summary
**Goal:** Align YouTube/TikTok restricted-source messaging and remove any UI copy that implies “any link will work,” setting correct expectations for browser-based conversion.

**Planned changes:**
- Ensure the YouTube restricted-source failure message is exactly: "YouTube videos cannot be accessed directly from the browser due to CORS restrictions and anti-bot protection. Please download the video using a YouTube downloader and upload the file directly." and use it consistently anywhere YouTube URL conversion is blocked (including early restricted-source checks and any fetch-failure classification mapped to YouTube).
- Update the URL input inline restricted-source warning text to be in English and clearly communicate that some sources (including YouTube) commonly cannot be accessed directly in the browser and that download+upload is the expected workaround, avoiding claims that “any link” will work.

**User-visible outcome:** When users paste or attempt to convert a YouTube link, they see consistent English messaging that explains the browser restriction and instructs them to download the video and upload it instead, and the UI no longer suggests that any arbitrary link will convert successfully.
