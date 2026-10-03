/**
 * useRoomSocket(roomCode)
 * =======================
 * Owns the WebSocket connection for one room and turns server events into
 * React state. Components never touch the socket directly - they get:
 *   state:   status, room, participants, me, syncState, messages, requests
 *   actions: control(), assignRole(), removeParticipant(), transferHost(),
 *            sendMessage(), respondToRequest()
 *
 * control(type, payload) is the clever bit:
 *   - host/moderator  -> emits 'play' / 'seek' ... directly
 *   - participant     -> emits 'request_action' so host/mod can approve it
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createSocket } from '../../../shared/lib/socket';
import { EVENTS } from '../../../shared/constants/socketEvents';
import { canControlPlayback } from '../../../shared/constants/roles';
import { describeAction } from '../../../shared/utils/format';
import { useAuth } from '../../auth/hooks/useAuth';

export const useRoomSocket = (roomCode) => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [status, setStatus] = useState('connecting'); // connecting | joined | error
  const [error, setError] = useState('');
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [syncState, setSyncState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reactions, setReactions] = useState([]);

  // "me" is derived from the participant list, so role changes update automatically
  const me = useMemo(() => participants.find((p) => p.userId === user?.id), [participants, user]);

  /**
   * Save the server state together with the LOCAL time we received it.
   * The player can then compute "where should the video be now" without
   * relying on server and browser clocks matching.
   */
  const saveSyncState = (state) => setSyncState({ ...state, receivedAt: Date.now() });

  useEffect(() => {
    const socket = createSocket(token);
    socketRef.current = socket;

    // (Re)join on every connect - this also handles automatic reconnects
    socket.on('connect', () => socket.emit(EVENTS.JOIN_ROOM, { roomCode }));
    socket.on('connect_error', (err) => {
      setStatus('error');
      setError(err.message || 'Cannot connect to the server');
    });

    socket.on(EVENTS.ROOM_JOINED, (data) => {
      setRoom(data.room);
      setParticipants(data.participants);
      setRequests(data.pendingRequests);
      saveSyncState(data.state);
      setStatus('joined');
    });

    socket.on(EVENTS.JOIN_ERROR, ({ message }) => {
      setStatus('error');
      setError(message);
    });

    socket.on(EVENTS.SYNC_STATE, (state) => {
      saveSyncState(state);
      // Show what happened, unless I did it myself
      if (state.by && !state.by.startsWith(user.username)) {
        toast(`${state.by}: ${describeAction(state.action, { time: state.currentTime })}`);
      }
    });

    socket.on(EVENTS.USER_JOINED, (data) => {
      setParticipants(data.participants);
      toast(`${data.username} joined`, { icon: '👋' });
    });

    socket.on(EVENTS.USER_LEFT, (data) => setParticipants(data.participants));

    socket.on(EVENTS.ROLE_ASSIGNED, (data) => {
      setParticipants(data.participants);
      if (data.userId === user.id) toast.success(`You are now a ${data.role}`);
    });

    socket.on(EVENTS.HOST_TRANSFERRED, (data) => {
      setParticipants(data.participants);
      setRoom((prev) => ({ ...prev, hostId: data.userId }));
      toast(`${data.username} is the new host`, { icon: '👑' });
    });

    socket.on(EVENTS.PARTICIPANT_REMOVED, (data) => setParticipants(data.participants));

    socket.on(EVENTS.REMOVED_FROM_ROOM, ({ by }) => {
      toast.error(`${by} removed you from the room`);
      navigate('/', { replace: true });
    });

    socket.on(EVENTS.CHAT_MESSAGE, (msg) => setMessages((prev) => [...prev.slice(-199), msg]));
    socket.on(EVENTS.EMOJI_REACTION, (reaction) => {
      setReactions((prev) => [...prev.slice(-15), reaction]);
    });

    // ---- request / approval flow ----
    socket.on(EVENTS.ACTION_REQUESTED, (request) => {
      setRequests((prev) => [...prev, request]);
      toast(`${request.username} wants to ${describeAction(request.type, request.payload)}`, { icon: '✋' });
    });
    socket.on(EVENTS.PENDING_REQUESTS, (list) => setRequests(list));
    socket.on(EVENTS.REQUEST_CLOSED, ({ requestId }) =>
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
    );
    socket.on(EVENTS.REQUEST_SENT, ({ type }) => toast(`Asked the host to ${describeAction(type)}`));
    socket.on(EVENTS.REQUEST_RESOLVED, ({ approved, by, type }) =>
      approved
        ? toast.success(`${by} approved: ${describeAction(type)}`)
        : toast.error(`${by} declined your request`)
    );

    socket.on(EVENTS.ERROR_MESSAGE, ({ message }) => toast.error(message));

    // Cleanup: leaving the page = leaving the room
    return () => {
      socket.emit(EVENTS.LEAVE_ROOM);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, token, user.id, user.username, navigate]);

  const emit = useCallback((event, payload) => socketRef.current?.emit(event, payload), []);

  // ---- actions exposed to components ----
  const control = useCallback(
    (type, payload = {}) => {
      if (canControlPlayback(me?.role)) emit(type, payload);
      else emit(EVENTS.REQUEST_ACTION, { type, payload });
    },
    [emit, me?.role]
  );

  return {
    status,
    error,
    room,
    participants,
    me,
    syncState,
    messages,
    requests,
    reactions,
    control,
    assignRole: (userId, role) => emit(EVENTS.ASSIGN_ROLE, { userId, role }),
    removeParticipant: (userId) => emit(EVENTS.REMOVE_PARTICIPANT, { userId }),
    transferHost: (userId) => emit(EVENTS.TRANSFER_HOST, { userId }),
    sendMessage: (text) => emit(EVENTS.CHAT_MESSAGE, { text }),
    sendReaction: (emoji) => emit(EVENTS.EMOJI_REACTION, { emoji }),
    respondToRequest: (requestId, approve) => emit(EVENTS.RESPOND_REQUEST, { requestId, approve }),
  };
};
