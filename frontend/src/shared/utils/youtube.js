/**
 * Extracts the 11-character video id from any common YouTube URL
 * (watch?v=, youtu.be/, shorts/, embed/) or returns the id itself.
 * Returns null when nothing valid is found.
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
    // not a URL
  }
  return null;
};
