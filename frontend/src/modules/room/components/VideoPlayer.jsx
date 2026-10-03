/**
 * VideoPlayer - applies the server's sync_state to the YouTube player.
 * ===================================================================
 * Every time syncState changes (and every 2s as a safety net) we:
 *   1. compute where the video SHOULD be:
 *        expected = currentTime + (now - receivedAt)/1000   (if playing)
 *   2. load the right video if it changed
 *   3. seek only if we drifted more than DRIFT_TOLERANCE seconds
 *      (seeking on every tiny difference would cause stutter)
 *   4. play or pause to match
 *
 * Browsers block autoplay with sound until the user interacts with the page,
 * so a person opening an invite link must click "Start watching" once.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';
import PlayerControls from './PlayerControls';
import ReactionsBar from './ReactionsBar';
import FloatingReactions from './FloatingReactions';

const DRIFT_TOLERANCE = 1.5; // seconds
const RESYNC_INTERVAL = 2000; // ms

const PLAYER_STATE = { ENDED: 0, PLAYING: 1, BUFFERING: 3 };

const VideoPlayer = ({ syncState, role, onControl, reactions = [], onReact }) => {
  const containerRef = useRef(null);
  const { playerRef, isReady } = useYouTubePlayer(containerRef);

  // If the user already clicked something on this page (e.g. "Join room"), autoplay is allowed
  const [unlocked, setUnlocked] = useState(() => navigator.userActivation?.hasBeenActive ?? false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });

  const applySync = useCallback(() => {
    const player = playerRef.current;
    if (!player || !isReady || !unlocked || !syncState?.videoId) return;

    const { videoId, isPlaying, currentTime, receivedAt } = syncState;
    const expected = isPlaying ? currentTime + (Date.now() - receivedAt) / 1000 : currentTime;

    // 1) Different video? Load it at the right second and stop here.
    if (player.getVideoData?.()?.video_id !== videoId) {
      if (isPlaying) player.loadVideoById(videoId, expected);
      else player.cueVideoById(videoId, expected);
      return;
    }

    // 2) Fix drift (but don't chase the end of a finished video)
    const duration = player.getDuration();
    const pastEnd = duration > 0 && expected >= duration - 1;
    if (!pastEnd && Math.abs(player.getCurrentTime() - expected) > DRIFT_TOLERANCE) {
      player.seekTo(expected, true);
    }

    // 3) Match play / pause
    const state = player.getPlayerState();
    if (isPlaying && !pastEnd && state !== PLAYER_STATE.PLAYING && state !== PLAYER_STATE.BUFFERING) {
      player.playVideo();
    }
    if (!isPlaying && state === PLAYER_STATE.PLAYING) player.pauseVideo();
  }, [playerRef, isReady, unlocked, syncState]);

  // Apply immediately on every new server state...
  useEffect(() => {
    applySync();
  }, [applySync]);

  // ...and re-check every few seconds to correct drift / buffering differences
  useEffect(() => {
    const id = setInterval(applySync, RESYNC_INTERVAL);
    return () => clearInterval(id);
  }, [applySync]);

  // Read the local player time for the progress bar
  useEffect(() => {
    if (!isReady) return undefined;
    const id = setInterval(() => {
      const player = playerRef.current;
      if (!player?.getCurrentTime) return;
      setProgress({ current: player.getCurrentTime() || 0, duration: player.getDuration() || 0 });
    }, 500);
    return () => clearInterval(id);
  }, [isReady, playerRef]);

  return (
    <div className="player-wrap">
      <div className="player-frame">
        <div ref={containerRef} className="player-iframe" />

        {/* Transparent shield: clicking the iframe would toggle play locally and break sync */}
        <div className="player-shield" />

        {/* Floating emoji reactions */}
        <FloatingReactions reactions={reactions} />

        {!syncState?.videoId && (
          <div className="player-overlay">
            <p>No video yet. Paste a YouTube link below to start.</p>
          </div>
        )}

        {syncState?.videoId && !unlocked && (
          <div className="player-overlay">
            <button type="button" className="btn btn-primary btn-lg" disabled={!isReady} onClick={() => setUnlocked(true)}>
              {isReady ? '▶ Start watching' : 'Loading player...'}
            </button>
            <p className="muted">Your browser needs one click before it can play video with sound.</p>
          </div>
        )}
      </div>

      <PlayerControls
        role={role}
        isPlaying={Boolean(syncState?.isPlaying)}
        hasVideo={Boolean(syncState?.videoId)}
        current={progress.current}
        duration={progress.duration}
        onControl={onControl}
      />

      {onReact && <ReactionsBar onReact={onReact} />}
    </div>
  );
};

export default VideoPlayer;
