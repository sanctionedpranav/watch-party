/**
 * PlayerControls - play/pause, seek bar, ±10s and change video.
 * Same UI for everyone; what happens depends on the role:
 *   host / moderator -> action runs immediately for the whole room
 *   participant      -> buttons say "Ask to ..." and send a request
 *   viewer           -> everything disabled
 */
import { useState } from 'react';
import { canControlPlayback, canRequestActions } from '../../../shared/constants/roles';
import { formatTime } from '../../../shared/utils/format';
import ChangeVideoForm from './ChangeVideoForm';

const PlayerControls = ({ role, isPlaying, hasVideo, current, duration, onControl }) => {
  const canControl = canControlPlayback(role);
  const canRequest = canRequestActions(role);
  const disabled = !canControl && !canRequest;

  // While dragging the slider we show the drag position, not the player time
  const [dragValue, setDragValue] = useState(null);
  const shownTime = dragValue ?? current;

  const seekTo = (time) => onControl('seek', { time: Math.max(0, Math.min(time, duration || time)) });

  const commitDrag = () => {
    if (dragValue !== null) seekTo(dragValue);
    setDragValue(null);
  };

  const ask = canControl ? '' : 'Ask to ';

  return (
    <div className="controls">
      <div className="controls-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled || !hasVideo}
          onClick={() => onControl(isPlaying ? 'pause' : 'play')}
        >
          {ask}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="btn btn-ghost" disabled={disabled || !hasVideo} onClick={() => seekTo(current - 10)}>
          −10s
        </button>
        <button type="button" className="btn btn-ghost" disabled={disabled || !hasVideo} onClick={() => seekTo(current + 10)}>
          +10s
        </button>

        <span className="time">
          {formatTime(shownTime)} / {formatTime(duration)}
        </span>
      </div>

      <input
        type="range"
        className="seek-bar"
        aria-label="Seek"
        min={0}
        max={duration || 0}
        step={1}
        value={Math.min(shownTime, duration || 0)}
        disabled={disabled || !duration}
        onChange={(e) => setDragValue(Number(e.target.value))}
        onPointerUp={commitDrag}
        onKeyUp={commitDrag}
      />

      {disabled ? (
        <p className="muted small">Viewers can watch and chat. Ask the host for a role to request changes.</p>
      ) : (
        <ChangeVideoForm label={canControl ? 'Change video' : 'Suggest video'} onSubmit={(videoId) => onControl('change_video', { videoId })} />
      )}
    </div>
  );
};

export default PlayerControls;
