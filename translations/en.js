// English Translations
const en = {
  title: "Planin 2000 - Retro Planning Poker",
  oldBrowserNotice: "⚠️ This site works best with Internet Explorer 5.5 or Netscape Navigator 4.7 ⚠️",
  checkingServer: "Checking server...",
  serverOnline: "Server online! Using custom server.",
  serverOffline: "Server offline! Using cloud server.",
  usingFallbackServer: "Using cloud server (fallback)",
  fallbackServerOnline: "Fallback server online!",
  creatingRoom: "Creating room...",
  
  // Create room
  createRoomTitle: "Create New Room",
  createRoom: "Create Room",
  roomId: "Room ID:",
  
  // Join room
  joinRoomTitle: "Join an existing room",
  joinRoomPlaceholder: "Paste room ID here",
  join: "Join",
  
  // Voting room
  votingRoomTitle: "Voting Room",
  connectedUsers: "Connected Users",
  vote: "Vote:",
  show: "Show",
  hide: "Hide",
  showValues: "Show Values",
  hideValues: "Hide Values",
  clear: "Clear",
  
  // Modals
  newRoom: "New Room",
  enterName: "Enter your name",
  enterNameBeforeCreate: "Enter your name before creating the room:",
  enterNameBeforeJoin: "Enter your name before joining the room:",
  namePlaceholder: "Your name",
  cancel: "Cancel",
  create: "Create Room",
  enterRoomTitle: "Enter Room",
  ok: "OK",
  systemAlert: "System Alert",
  
  // Footer
  createdBy: "Created by Gabriel",
  helpCreator: "Support the creator",
  madeWith: "Made with",
  
  // Error messages
  pleaseEnterName: "Please enter your name.",
  nameTooLong: "Your name was adjusted to the maximum length of 30 characters.",
  enterRoomId: "Enter a room ID",
  cannotCopyId: "Could not copy the ID. Please select and copy manually.",
  roomNotFound: "Room not found. Please verify the ID and try again.",
  configError: "Configuration error: invalid key. Please reload the page and try again.",
  connectionError: "Connection error. Please try again.",
  hostClosedConnection: "The host closed the connection",
  cannotConnect: "Could not connect to the room. Try again.",
  serverConnectionError: "Server connection error. Switching to cloud server...",
  nameRequired: "Name is required!",
  
  // New connection handling texts
  invalidKey: "Invalid access key. Using alternative server.",
  networkError: "Network error. Check your internet connection.",
  webrtcNotSupported: "WebRTC is not supported by this browser.",
  serverError: "Server error. Trying to reconnect...",
  connectionClosed: "Connection closed unexpectedly.",
  errorConnecting: "Error connecting",
  timeoutError: "Connection timed out. Network may be unstable.",
  roomCreated: "Room successfully created! ID",
  lostConnection: "Lost connection to server.",
  lostConnectionToHost: "Lost connection to room host.",
  
  // Modes
  darkMode: "Dark Mode",
  
  // Buttons
  toggleDarkMode: "Toggle Dark Mode"
};

// Export translations
if (typeof module !== 'undefined' && module.exports) {
  module.exports = en;
} 