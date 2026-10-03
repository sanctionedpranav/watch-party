/** Room name, invite code, copy link and leave */
import toast from 'react-hot-toast';
import RoleBadge from '../../../shared/components/RoleBadge';

const RoomHeader = ({ room, me, onLeave }) => {
  const copyInvite = async () => {
    const link = `${window.location.origin}/room/${room.code}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied');
    } catch {
      toast(link); // clipboard blocked -> at least show it
    }
  };

  return (
    <div className="room-header">
      <div>
        <h1 className="room-title">{room.name}</h1>
        <p className="muted">
          Room code <span className="room-code">{room.code}</span>
          <span className="you-are">You are <RoleBadge role={me?.role} /></span>
        </p>
      </div>
      <div className="room-header-actions">
        <button type="button" className="btn btn-ghost" onClick={copyInvite}>Copy invite link</button>
        <button type="button" className="btn btn-ghost danger" onClick={onLeave}>Leave</button>
      </div>
    </div>
  );
};

export default RoomHeader;
