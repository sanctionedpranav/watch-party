/** Join with a code or a full invite link */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { roomApi } from '../api/room.api';
import { extractRoomCode } from '../../../shared/utils/roomCode';

const JoinRoomForm = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = extractRoomCode(input);
    setLoading(true);
    try {
      await roomApi.getByCode(code); // friendly error if the code is wrong
      navigate(`/room/${code}`);
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <form className="panel stack" onSubmit={handleSubmit}>
      <h2 className="panel-title">Join a party</h2>
      <label className="field">
        Room code or invite link
        <input value={input} required placeholder="K7P2QX" onChange={(e) => setInput(e.target.value)} />
      </label>
      <button type="submit" className="btn btn-ghost" disabled={loading}>
        {loading ? 'Checking...' : 'Join room'}
      </button>
    </form>
  );
};

export default JoinRoomForm;
