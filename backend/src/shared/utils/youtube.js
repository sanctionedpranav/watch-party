/**
 * youtube.js
 * ----------
 * Accepts a YouTube URL *or* a raw video id and returns the 11-char video id.
 * Supported:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/shorts/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID
 *   VIDEO_ID
 * Returns null if nothing valid is found.
 */
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export const extractVideoId = (input = '') => {
  const value = String(input).trim();
  if (VIDEO_ID_REGEX.test(value)) return value;

  try {
    const url = new URL(value);

    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1, 12);
      return VIDEO_ID_REGEX.test(id) ? id : null;
    }

    if (url.hostname.endsWith('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v && VIDEO_ID_REGEX.test(v)) return v;

      const match = url.pathname.match(/\/(embed|shorts|live|v)\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[2];
    }
  } catch {
    // Not a URL -> fall through
  }
  return null;
};
