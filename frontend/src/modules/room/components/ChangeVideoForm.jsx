/** Paste a YouTube link -> validate locally -> hand the video id to the parent */
import { useState } from 'react';
import toast from 'react-hot-toast';
import { extractVideoId } from '../../../shared/utils/youtube';

const ChangeVideoForm = ({ label, onSubmit }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const videoId = extractVideoId(url);
    if (!videoId) {
      toast.error('Paste a YouTube link like youtube.com/watch?v=... or youtu.be/...');
      return;
    }
    onSubmit(videoId);
    setUrl('');
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a YouTube link" aria-label="YouTube link" />
      <button type="submit" className="btn btn-ghost" disabled={!url.trim()}>
        {label}
      </button>
    </form>
  );
};

export default ChangeVideoForm;
