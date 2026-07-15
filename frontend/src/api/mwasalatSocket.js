import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

// Dedicated Socket.io namespace — fully separate from Eonix's default
// namespace, so events never cross between the two systems.
const mwasalatSocket = io(`${SOCKET_URL}/mwasalat`, {
  autoConnect: false,
  withCredentials: true,
});

export default mwasalatSocket;
