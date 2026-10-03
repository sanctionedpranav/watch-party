/**
 * FloatingReactions - Renders real-time floating emojis rising up over the video
 */
import { useEffect, useState } from 'react';

const FloatingReactions = ({ reactions }) => {
  const [activeBubbles, setActiveBubbles] = useState([]);

  useEffect(() => {
    if (!reactions?.length) return;
    const latest = reactions[reactions.length - 1];
    if (!latest?.id) return;

    // Give each bubble a random horizontal offset between 10% and 85%
    const leftOffset = Math.floor(Math.random() * 75) + 10;
    const bubble = {
      id: latest.id,
      emoji: latest.emoji,
      username: latest.username,
      left: `${leftOffset}%`,
    };

    setActiveBubbles((prev) => [...prev, bubble]);

    // Remove bubble after animation finishes (2.5s)
    const timer = setTimeout(() => {
      setActiveBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    }, 2500);

    return () => clearTimeout(timer);
  }, [reactions]);

  return (
    <div className="floating-reactions-container" aria-hidden="true">
      {activeBubbles.map((b) => (
        <div key={b.id} className="floating-bubble" style={{ left: b.left }}>
          <span className="floating-emoji">{b.emoji}</span>
          <span className="floating-user">{b.username}</span>
        </div>
      ))}
    </div>
  );
};

export default FloatingReactions;
