/**
 * ParticipantList - everyone in the room with their role.
 * The host additionally sees, for each other person:
 *   a role dropdown, "Make host" and "Remove".
 */
import RoleBadge from '../../../shared/components/RoleBadge';
import { ASSIGNABLE_ROLES, ROLES, isHost } from '../../../shared/constants/roles';

const ParticipantList = ({ participants, me, onAssignRole, onRemove, onTransferHost }) => {
  const iAmHost = isHost(me?.role);

  return (
    <section className="panel">
      <h2 className="panel-title">In the room ({participants.length})</h2>
      <ul className="participant-list">
        {participants.map((p) => {
          const isMe = p.userId === me?.userId || (me?.username && p.username === me?.username);
          const canManage = iAmHost && !isMe && p.role !== ROLES.HOST;

          return (
            <li key={p.userId} className="participant">
              <span className="avatar" aria-hidden="true">{p.username[0].toUpperCase()}</span>
              <span className="participant-name">
                {p.username}
                {isMe && <span className="muted"> (you)</span>}
              </span>

              {canManage ? (
                <div className="participant-actions">
                  <select value={p.role} onChange={(e) => onAssignRole(p.userId, e.target.value)} aria-label={`Role for ${p.username}`}>
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="icon-btn"
                    title="Make host"
                    onClick={() => window.confirm(`Make ${p.username} the host? You will become a moderator.`) && onTransferHost(p.userId)}
                  >
                    👑
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    title="Remove from room"
                    onClick={() => window.confirm(`Remove ${p.username} from the room?`) && onRemove(p.userId)}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <RoleBadge role={p.role} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ParticipantList;
