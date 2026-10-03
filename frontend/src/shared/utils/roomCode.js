/** Accepts "k7p2qx" or "https://site.com/room/K7P2QX" and returns "K7P2QX" */
export const extractRoomCode = (input = '') => {
  const value = input.trim();
  const match = value.match(/\/room\/([A-Za-z0-9]+)/);
  return (match ? match[1] : value).toUpperCase();
};
