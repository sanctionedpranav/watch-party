/**
 * RoomPage - wires the socket hook to the UI components.
 * All real-time logic lives in useRoomSocket; this file is just layout.
 */
import { Link, useNavigate, useParams } from 'react-router-dom';
import Loader from '../../../shared/components/Loader';
import { canApproveRequests } from '../../../shared/constants/roles';
import { useRoomSocket } from '../hooks/useRoomSocket';
import RoomHeader from '../components/RoomHeader';
import VideoPlayer from '../components/VideoPlayer';
import RequestsPanel from '../components/RequestsPanel';
import ParticipantList from '../components/ParticipantList';
import ChatBox from '../components/ChatBox';

const RoomPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const party = useRoomSocket(code.toUpperCase());

  if (party.status === 'error') {
    return (
      <main className="center-page">
        <div className="panel stack">
          <h1>Can&apos;t open this room</h1>
          <p className="muted">{party.error}</p>
          <Link to="/" className="btn btn-primary">Back to home</Link>
        </div>
      </main>
    );
  }

  if (party.status !== 'joined') return <Loader text="Joining the room..." />;

  return (
    <main className="room-layout">
      <section className="room-main">
        <RoomHeader room={party.room} me={party.me} onLeave={() => navigate('/')} />
        <VideoPlayer
          syncState={party.syncState}
          role={party.me?.role}
          onControl={party.control}
          reactions={party.reactions}
          onReact={party.sendReaction}
        />
        {canApproveRequests(party.me?.role) && (
          <RequestsPanel requests={party.requests} onRespond={party.respondToRequest} />
        )}
      </section>

      <aside className="room-side">
        <ParticipantList
          participants={party.participants}
          me={party.me}
          onAssignRole={party.assignRole}
          onRemove={party.removeParticipant}
          onTransferHost={party.transferHost}
        />
        <ChatBox messages={party.messages} myUserId={party.me?.userId} onSend={party.sendMessage} />
      </aside>
    </main>
  );
};

export default RoomPage;
