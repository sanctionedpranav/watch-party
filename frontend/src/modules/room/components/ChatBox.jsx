/** Room chat - messages arrive via the 'chat_message' socket event */
import { useEffect, useRef, useState } from 'react';
import RoleBadge from '../../../shared/components/RoleBadge';

const ChatBox = ({ messages, myUserId, onSend }) => {
  const [text, setText] = useState('');
  const listRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <section className="panel chat">
      <h2 className="panel-title">Chat</h2>
      <ul className="chat-list" ref={listRef}>
        {messages.length === 0 && <li className="muted small">Say hi to the room.</li>}
        {messages.map((m) => (
          <li key={m.id} className={`chat-msg ${m.userId === myUserId ? 'mine' : ''}`}>
            <div className="chat-meta">
              <strong>{m.username}</strong> <RoleBadge role={m.role} />
            </div>
            <p>{m.text}</p>
          </li>
        ))}
      </ul>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" maxLength={500} aria-label="Message" />
        <button type="submit" className="btn btn-primary" disabled={!text.trim()}>Send</button>
      </form>
    </section>
  );
};

export default ChatBox;
