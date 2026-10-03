/** Creates a room over REST, then navigates into it (you become the Host) */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { roomApi } from '../api/room.api';

const CreateRoomForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', videoUrl: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { room } = await roomApi.create(form);
      navigate(`/room/${room.code}`);
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <form className="panel stack" onSubmit={handleSubmit}>
      <h2 className="panel-title">Start a party</h2>
      <label className="field">
        Room name
        <input value={form.name} maxLength={60} required placeholder="Friday movie night"
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </label>
      <label className="field">
        YouTube link <span className="muted">(optional)</span>
        <input value={form.videoUrl} placeholder="https://youtu.be/..."
          onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
      </label>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Creating...' : 'Create room'}
      </button>
    </form>
  );
};

export default CreateRoomForm;
