/** Host/moderator inbox: participant requests waiting for approval */
import { describeAction } from '../../../shared/utils/format';

const RequestsPanel = ({ requests, onRespond }) => {
  if (!requests.length) return null;

  return (
    <section className="panel requests">
      <h2 className="panel-title">Waiting for approval ({requests.length})</h2>
      <ul>
        {requests.map((r) => (
          <li key={r.id} className="request">
            <span>
              <strong>{r.username}</strong> wants to {describeAction(r.type, r.payload)}
            </span>
            <div className="request-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onRespond(r.id, true)}>Approve</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRespond(r.id, false)}>Decline</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RequestsPanel;
