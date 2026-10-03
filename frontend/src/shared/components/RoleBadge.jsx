/** Small coloured pill that shows a role, e.g. "Host" */
const LABELS = { host: 'Host', moderator: 'Moderator', participant: 'Participant', viewer: 'Viewer' };

const RoleBadge = ({ role }) => <span className={`role-badge role-${role}`}>{LABELS[role] || role}</span>;

export default RoleBadge;
