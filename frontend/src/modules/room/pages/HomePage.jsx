import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { roomApi } from '../api/room.api';
import CreateRoomForm from '../components/CreateRoomForm';
import JoinRoomForm from '../components/JoinRoomForm';

const HomePage = () => {
  const { user } = useAuth();
  const [myRooms, setMyRooms] = useState([]);

  useEffect(() => {
    roomApi.getMine().then((data) => setMyRooms(data.rooms)).catch(() => {});
  }, []);

  return (
    <main className="home">
      <section className="hero">
        <h1>Press play together.</h1>
        <p className="muted">
          Hi {user.username}. Start a room, share the code, and everyone watches the same YouTube video at the same second.
        </p>
      </section>

      <div className="home-grid">
        <CreateRoomForm />
        <JoinRoomForm />
      </div>

      {myRooms.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">Your rooms</h2>
          <ul className="room-list">
            {myRooms.map((room) => (
              <li key={room.code}>
                <Link to={`/room/${room.code}`}>{room.name}</Link>
                <span className="room-code">{room.code}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
};

export default HomePage;
