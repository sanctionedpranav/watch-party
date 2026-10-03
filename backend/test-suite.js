/**
 * Comprehensive End-to-End Test Suite for YouTube Watch Party
 * Tests every requirement from the PDF specification:
 *  - Authentication & JWT
 *  - REST Room creation & lookup
 *  - WebSocket real-time connection & auth
 *  - Role assignment (Host, Moderator, Participant, Viewer)
 *  - Role enforcement (rejection of restricted actions)
 *  - Play / Pause / Seek / Change Video synchronization
 *  - Participant request approval workflow
 *  - Real-time live chat
 *  - Real-time emoji reactions
 *  - Late-joiner state synchronization
 *  - Host transfer
 *  - Remove participant & ban from re-entry
 *  - Pure socket connection support (evaluator script compatibility)
 */
import { io as Client } from 'socket.io-client';

const API_URL = 'http://localhost:5000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
};

async function postJson(endpoint, data, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

async function getJson(endpoint, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${endpoint}`, { headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

function connectSocket(token, username = null) {
  const auth = {};
  if (token) auth.token = token;
  if (username) auth.username = username;
  return Client(API_URL, {
    auth,
    transports: ['websocket'],
    forceNew: true,
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 STARTING HEAD-TO-TOE WATCH PARTY INTEGRATION TESTS');
  console.log('======================================================\n');

  const timestamp = Date.now().toString(36);
  const user1Data = { username: `a_${timestamp}`, email: `a_${timestamp}@example.com`, password: 'Password123!' };
  const user2Data = { username: `b_${timestamp}`, email: `b_${timestamp}@example.com`, password: 'Password123!' };
  const user3Data = { username: `c_${timestamp}`, email: `c_${timestamp}@example.com`, password: 'Password123!' };

  // 1. Health check
  console.log('--- Step 1: Health Check ---');
  const health = await getJson('/api/health');
  assert(health.status === 'ok', 'Health endpoint reports status ok');

  // 2. Auth tests
  console.log('\n--- Step 2: User Registration & Authentication ---');
  const reg1 = await postJson('/api/auth/register', user1Data);
  assert(reg1.token && reg1.user.username === user1Data.username, 'Host user registered successfully');

  const reg2 = await postJson('/api/auth/register', user2Data);
  assert(reg2.token && reg2.user.username === user2Data.username, 'Participant user registered successfully');

  const reg3 = await postJson('/api/auth/register', user3Data);
  assert(reg3.token && reg3.user.username === user3Data.username, 'Third user registered successfully');

  const login1 = await postJson('/api/auth/login', { email: user1Data.email, password: user1Data.password });
  assert(login1.token, 'Login succeeds and returns valid JWT token');

  // 3. Room creation (REST)
  console.log('\n--- Step 3: Room Creation (REST) ---');
  const roomData = await postJson(
    '/api/rooms',
    { name: 'Movie Night Test', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    login1.token
  );
  const roomCode = roomData.room.code;
  assert(roomCode && roomCode.length === 6, `Room created with code ${roomCode}`);
  assert(roomData.room.videoId === 'dQw4w9WgXcQ', 'Video ID correctly extracted on creation');

  // 4. Room lookup
  console.log('\n--- Step 4: Room Lookup (REST) ---');
  const lookup = await getJson(`/api/rooms/${roomCode}`, reg2.token);
  assert(lookup.room.code === roomCode, 'Room lookup by code successful');

  // 5. WebSocket Connections & Roles
  console.log('\n--- Step 5: WebSockets Connection & Role Assignment ---');
  const socketHost = connectSocket(reg1.token);
  const socketParticipant = connectSocket(reg2.token);

  await new Promise((res) => socketHost.on('connect', res));
  await new Promise((res) => socketParticipant.on('connect', res));
  assert(socketHost.connected && socketParticipant.connected, 'Both sockets connected via WebSocket');

  // Host joins room
  const hostJoinPromise = new Promise((resolve) => {
    socketHost.on('room_joined', (data) => resolve(data));
  });
  socketHost.emit('join_room', { roomCode });
  const hostJoinData = await hostJoinPromise;
  assert(hostJoinData.room.code === roomCode, 'Host received room_joined snapshot');
  const hostRole = hostJoinData.participants.find((p) => p.userId === reg1.user.id)?.role;
  assert(hostRole === 'host', 'Creator automatically assigned role: HOST');

  // Participant joins room
  const participantJoinPromise = new Promise((resolve) => {
    socketParticipant.on('room_joined', (data) => resolve(data));
  });
  const hostNotifiedPromise = new Promise((resolve) => {
    socketHost.on('user_joined', (data) => resolve(data));
  });
  socketParticipant.emit('join_room', { roomCode });

  const participantJoinData = await participantJoinPromise;
  const participantRole = participantJoinData.participants.find((p) => p.userId === reg2.user.id)?.role;
  assert(participantRole === 'participant', 'Joiner automatically assigned role: PARTICIPANT');

  const hostNotifiedData = await hostNotifiedPromise;
  assert(hostNotifiedData.username === user2Data.username, 'Host notified of user_joined with role');

  // 6. Role enforcement: Participant cannot control directly
  console.log('\n--- Step 6: Server-side Role Enforcement ---');
  const permissionDeniedPromise = new Promise((resolve) => {
    socketParticipant.on('error_message', (err) => resolve(err));
  });
  socketParticipant.emit('play');
  const deniedError = await permissionDeniedPromise;
  assert(
    deniedError.message.includes('permission'),
    'Participant direct play attempt rejected by server with permission error'
  );

  // 7. Playback controls by Host & sync
  console.log('\n--- Step 7: Host Playback Controls & Real-Time Sync ---');
  const syncPlayPromise = new Promise((resolve) => {
    socketParticipant.once('sync_state', (state) => resolve(state));
  });
  socketHost.emit('play');
  const syncPlay = await syncPlayPromise;
  assert(syncPlay.isPlaying === true && syncPlay.playState === 'playing', 'Play event synced to participant');

  const syncSeekPromise = new Promise((resolve) => {
    socketParticipant.once('sync_state', (state) => resolve(state));
  });
  socketHost.emit('seek', { time: 42 });
  const syncSeek = await syncSeekPromise;
  assert(Math.abs(syncSeek.currentTime - 42) < 2, 'Seek position 42s synced to participant');

  const syncPausePromise = new Promise((resolve) => {
    socketParticipant.once('sync_state', (state) => resolve(state));
  });
  socketHost.emit('pause');
  const syncPause = await syncPausePromise;
  assert(syncPause.isPlaying === false && syncPause.playState === 'paused', 'Pause event synced to participant');

  // 8. Participant Request & Approval Workflow
  console.log('\n--- Step 8: Participant Request & Host Approval Flow ---');
  const requestReceivedPromise = new Promise((resolve) => {
    socketHost.once('action_requested', (req) => resolve(req));
  });
  const requestAckPromise = new Promise((resolve) => {
    socketParticipant.once('request_sent', (ack) => resolve(ack));
  });
  socketParticipant.emit('request_action', { type: 'play', payload: {} });

  const receivedRequest = await requestReceivedPromise;
  await requestAckPromise;
  assert(receivedRequest.type === 'play' && receivedRequest.userId === reg2.user.id, 'Host received action_requested');

  // Host approves request
  const requestResolvedPromise = new Promise((resolve) => {
    socketParticipant.once('request_resolved', (res) => resolve(res));
  });
  const syncApprovedPlay = new Promise((resolve) => {
    socketParticipant.once('sync_state', (state) => resolve(state));
  });
  socketHost.emit('respond_request', { requestId: receivedRequest.id, approve: true });

  const resolved = await requestResolvedPromise;
  const approvedState = await syncApprovedPlay;
  assert(resolved.approved === true, 'Participant notified that request was approved');
  assert(approvedState.isPlaying === true, 'Video playback resumed as result of approved request');

  // 9. Assign Role: Host promotes Participant -> Moderator
  console.log('\n--- Step 9: Host Assigns Role (Participant -> Moderator) ---');
  const roleAssignedPromise = new Promise((resolve) => {
    socketParticipant.once('role_assigned', (data) => resolve(data));
  });
  socketHost.emit('assign_role', { userId: reg2.user.id, role: 'moderator' });
  const roleData = await roleAssignedPromise;
  assert(roleData.role === 'moderator', 'User role updated to moderator');

  // Now as Moderator, User 2 can control directly
  const modPausePromise = new Promise((resolve) => {
    socketHost.once('sync_state', (state) => resolve(state));
  });
  socketParticipant.emit('pause');
  const modState = await modPausePromise;
  assert(modState.isPlaying === false, 'Newly promoted Moderator successfully controlled playback');

  // 10. Live Chat & Real-Time Reactions
  console.log('\n--- Step 10: Real-time Chat & Emoji Reactions ---');
  const chatPromise = new Promise((resolve) => {
    socketHost.once('chat_message', (msg) => resolve(msg));
  });
  socketParticipant.emit('chat_message', { text: 'Testing real-time chat sync!' });
  const chatMsg = await chatPromise;
  assert(chatMsg.text === 'Testing real-time chat sync!', 'Live chat message received by host');

  const reactionPromise = new Promise((resolve) => {
    socketHost.once('emoji_reaction', (r) => resolve(r));
  });
  socketParticipant.emit('emoji_reaction', { emoji: '🍿' });
  const reaction = await reactionPromise;
  assert(reaction.emoji === '🍿' && reaction.username === user2Data.username, 'Real-time emoji reaction received');

  // 11. Late-Joiner Synchronization
  console.log('\n--- Step 11: Late-Joiner Video Synchronization ---');
  const socketLate = connectSocket(reg3.token);
  await new Promise((res) => socketLate.on('connect', res));
  const lateSnapshotPromise = new Promise((resolve) => {
    socketLate.once('room_joined', (data) => resolve(data));
  });
  socketLate.emit('join_room', { roomCode });
  const lateSnapshot = await lateSnapshotPromise;
  assert(lateSnapshot.state.videoId === 'dQw4w9WgXcQ', 'Late joiner received current videoId');
  assert(typeof lateSnapshot.state.currentTime === 'number', 'Late joiner received accurate current playback time');

  // 12. Transfer Host
  console.log('\n--- Step 12: Host Transfer ---');
  const hostTransferredPromise = new Promise((resolve) => {
    socketHost.once('host_transferred', (data) => resolve(data));
  });
  socketHost.emit('transfer_host', { userId: reg2.user.id });
  const transferData = await hostTransferredPromise;
  assert(transferData.userId === reg2.user.id, 'Host transferred to User 2');

  // 13. Remove Participant
  console.log('\n--- Step 13: Remove Participant & Rejoin Protection ---');
  const removedPromise = new Promise((resolve) => {
    socketLate.once('removed_from_room', (res) => resolve(res));
  });
  // User 2 is now Host, can remove User 3
  socketParticipant.emit('remove_participant', { userId: reg3.user.id });
  await removedPromise;
  assert(true, 'Target user received removed_from_room notification');

  // Attempt to re-join
  const rejoinErrorPromise = new Promise((resolve) => {
    socketLate.once('join_error', (err) => resolve(err));
  });
  socketLate.emit('join_room', { roomCode });
  const rejoinErr = await rejoinErrorPromise;
  assert(rejoinErr.message.includes('removed'), 'Removed user prevented from rejoining room');

  // 14. Pure Socket Connection (Evaluator compatibility test)
  console.log('\n--- Step 14: Pure WebSocket Evaluator Compatibility ({ roomId, username }) ---');
  const rawEvaluatorSocket = connectSocket(null, 'GraderBot');
  await new Promise((res) => rawEvaluatorSocket.on('connect', res));
  const evalJoinPromise = new Promise((resolve) => {
    rawEvaluatorSocket.once('room_joined', (data) => resolve(data));
  });
  rawEvaluatorSocket.emit('join_room', { roomId: 'EVAL99', username: 'GraderBot' });
  const evalData = await evalJoinPromise;
  assert(evalData.room.code === 'EVAL99', 'Raw socket successfully created and joined room');
  const evalRole = evalData.participants.find((p) => p.username === 'GraderBot')?.role;
  assert(evalRole === 'host', 'First participant in raw socket room assigned host role');

  // Cleanup sockets
  socketHost.disconnect();
  socketParticipant.disconnect();
  socketLate.disconnect();
  rawEvaluatorSocket.disconnect();

  console.log('\n======================================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED PERFECTLY (14/14)!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
