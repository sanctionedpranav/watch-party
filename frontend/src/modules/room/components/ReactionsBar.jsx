/**
 * ReactionsBar - Quick emoji reactions for key moments
 */
const EMOJIS = ['❤️', '🔥', '👏', '🍿', '😂', '😮'];

const ReactionsBar = ({ onReact }) => {
  return (
    <div className="reactions-bar" aria-label="Send an emoji reaction">
      <span className="reactions-label">Reactions:</span>
      <div className="reactions-buttons">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="reaction-btn"
            onClick={() => onReact(emoji)}
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReactionsBar;
