/** 75.4 -> "1:15", 3725 -> "1:02:05" */
export const formatTime = (seconds = 0) => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

/** Turns a request/sync action into words: "seek to 1:30" */
export const describeAction = (type, payload = {}) => {
  switch (type) {
    case 'play': return 'play the video';
    case 'pause': return 'pause the video';
    case 'seek': return `jump to ${formatTime(payload.time)}`;
    case 'change_video': return 'change the video';
    default: return type;
  }
};
