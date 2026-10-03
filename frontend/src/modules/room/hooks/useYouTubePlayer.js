/**
 * useYouTubePlayer(containerRef)
 * ==============================
 * Loads the YouTube IFrame API script once and creates a player inside
 * `containerRef`. Returns { playerRef, isReady }.
 *
 * Player settings:
 *   controls: 0, disablekb: 1 -> users can't use YouTube's own controls.
 *   All control goes through OUR buttons -> the server -> everyone.
 *   This avoids "echo loops" (a remote pause triggering a local pause event
 *   that gets sent back to the server again).
 *
 * React gotcha: YouTube REPLACES the element you give it with an <iframe>.
 * If that element were rendered by React, React would crash on unmount.
 * So we create a plain <div> manually inside the container.
 */
import { useEffect, useRef, useState } from 'react';

let apiPromise = null; // shared across all players / re-renders

const loadYouTubeApi = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      // YouTube calls this global function when the script is ready
      window.onYouTubeIframeAPIReady = () => resolve(window.YT);
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    });
  }
  return apiPromise;
};

export const useYouTubePlayer = (containerRef) => {
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let player = null;
    const container = containerRef.current;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !container) return;

      const mountPoint = document.createElement('div');
      container.appendChild(mountPoint);

      player = new YT.Player(mountPoint, {
        width: '100%',
        height: '100%',
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1, iv_load_policy: 3 },
        events: {
          onReady: () => {
            if (cancelled) return;
            playerRef.current = player;
            setIsReady(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      setIsReady(false);
      playerRef.current = null;
      player?.destroy?.();
      if (container) container.innerHTML = '';
    };
  }, [containerRef]);

  return { playerRef, isReady };
};
