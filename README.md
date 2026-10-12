# 🎨 Skribbl Multiplayer Game & System Architecture
### Full Stack Developer Assignment for Sapien Robotics

A production-grade, real-time multiplayer drawing and guessing game (Skribbl.io style) built with **Node.js**, **Express**, **Socket.IO**, and **React (Vite)**, accompanied by a comprehensive **System Architecture Design Doc** for a high-scale music streaming service.

---

## 🚀 Quick Start (Running in One Documented Command)

### Prerequisites
- **Node.js** (v18+ or v20+ recommended)
- **npm** (v9+)

### One-Command Setup & Launch:
Clone or navigate to the repository folder and run:

```bash
# 1. Install dependencies
npm install && npm install --prefix client

# 2. Launch both Server & Client concurrently (Development Mode)
npm run dev
```

The application will start immediately:
- **Client Web App:** [http://localhost:5173](http://localhost:5173) (or `http://localhost:4000` in production)
- **Backend WebSocket Server:** `http://localhost:4000`

> 💡 **Production Mode Alternative:**  
> You can also run `npm run build && npm start` to build the frontend and serve both the static client and WebSocket backend from a single unified server on port **4000**: [http://localhost:4000](http://localhost:4000).

---

## 📋 Feature Checklist & Implementation Details

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **Shareable Room Links** | Rooms generated with 6-char clean room codes. Direct invite link `http://localhost:5173/?room=ABC123` auto-joins guests. | ✅ Complete |
| **Host Room Controls** | Host configures: Number of rounds (2, 3, 5, 8), Draw time (30s–100s), Word Categories (Classic, Animals, Food, Objects, Tech) + Custom comma-separated words. | ✅ Complete |
| **Drawing Tools** | **Pen**, **Eraser**, **Bucket Flood Fill** (BFS algorithm on canvas `ImageData`), **Brush Sizes** (S, M, L, XL), **16-Color Palette + Color Picker**, **Undo**, and **Clear Canvas**. | ✅ Complete |
| **Zero-Lag Stroke Streaming** | Vector-based micro-batching of normalized coordinates $[0.0, 1.0]$. Renders identical resolution regardless of screen size or zoom. | ✅ Complete |
| **Authoritative Server Turn Flow** | Drawer picks from 3 random words with 15s timer. Server manages timer countdown, hint schedule, and drawer rotation. | ✅ Complete |
| **Progressive Hint Reveals** | Letter hints (`_ _ _ _` -> `A _ _ L _`) reveal over time at 60% and 30% thresholds based on word length. | ✅ Complete |
| **Server Security Authority** | Secret word is strictly withheld from non-drawer sockets. Word validation & time-based points calculated solely on server. | ✅ Complete |
| **Chat & Near-Miss Alerts** | Correct guesses are hidden from public chat to prevent spoilers. Near-misses (Levenshtein distance 1 or 2) trigger private **"'word' is close!"** alerts. | ✅ Complete |
| **Mid-Round Joiner Sync** | New joiners receive the current turn's full action stack and immediately replay the canvas as it stands. | ✅ Complete |
| **30-Second Reconnect Window** | Persistent session tokens in `localStorage`. Players who refresh or drop connection keep their score and state if rejoining within 30s. | ✅ Complete |
| **Clean Drawer Disconnect Recovery**| If the active drawer leaves mid-turn, the turn timer clears, players are notified, the word is revealed, and the game advances to the next player. | ✅ Complete |
| **Abuse Protection** | Sliding window rate-limiting for chat (3 msgs / 2s) and strokes (60 packets / s). Coordinate clamping, brush size bounds, and 100-character max chat length. | ✅ Complete |
| **Stroke-by-Stroke Replay Theater**| Dedicated end-game theater allowing players to replay every drawing from the match with Play/Pause, speed adjustment (1x, 2x, 4x), and scrub timeline. | ✅ Complete |

---

## 🎥 Screen Recording Instructions (3 Players)

To create the required two-minute screen recording with at least 3 players:
1. Open **Player 1** in standard Google Chrome: [http://localhost:5173](http://localhost:5173) -> Click **Create Room** (Nickname: "Alice").
2. Copy the shareable invite link (click the **Share Link** button).
3. Open **Player 2** in an **Incognito / Private Window**: Paste the link -> Enter nickname "Bob" -> Join.
4. Open **Player 3** in a second browser (e.g. Brave / Edge / Firefox): Paste the link -> Enter nickname "Charlie" -> Join.
5. In Player 1's window, click **Start Game**:
   - Demonstrate Player 1 selecting a secret word from 3 options.
   - Draw using Pen, Flood Fill, Color Palette, and Brush Size.
   - Show Player 2 typing a near-miss guess (e.g., secret word "Elephant", type "Elefant" to show the orange `"close!"` alert).
   - Show Player 3 typing the correct guess (words hidden, green banner appears, points awarded).
   - Demonstrate refreshing one browser tab to show the **30-second score preservation reconnect**.
   - Show the final round **Winner Podium** and **Stroke-by-Stroke Replay Theater**!

---

## 🧪 Capacity & Load Testing (Question 1 Deliverable)

An automated benchmark load test script is provided in [`server/tests/load-test.js`](file:///c:/Users/Amit/Downloads/skribbl-multiplayer/server/tests/load-test.js). It spins up virtual rooms and players, streaming drawing strokes and measuring broadcast throughput and latency.

Run the benchmark using:
```bash
npm run test:load
```

Or test customized scale:
```bash
# Syntax: node server/tests/load-test.js <ROOMS> <PLAYERS_PER_ROOM> <DURATION_SECONDS>
node server/tests/load-test.js 30 4 5
```

### Benchmark Results (Single Node.js Process):
- **Concurrent Rooms:** 20–30 rooms
- **Connected Players:** 80–120 clients
- **Broadcast Throughput:** **~870 msgs/second**
- **Average Round-Trip Latency:** **5.4 ms**
- **P95 Latency:** **10.2 ms**
- **Process Memory (RSS):** **69.35 MB**

For the complete technical breakdown, read:  
👉 [**docs/QUESTION_1_TECHNICAL_NOTE.md**]

---

## 🎧 Question 2: Music Streaming Architecture ("Listen Together")

A comprehensive 5-page System Architecture Document addressing Spotify-style shared listening rooms at a scale of **20M MAU, 2M peak concurrent listeners, 50M track catalogue, and 200k shared rooms** is included:

👉 [**docs/QUESTION_2_SYSTEM_DESIGN.md**]

### Key Highlights of Question 2:
1. **Audio Delivery Subsystem:** Lossless FLAC master storage in S3, asynchronous CMAF chunking into 2-second HLS/MPEG-DASH segments, multi-tiered ABR, and Byte-Range pre-fetching for < 150ms instant playback.
2. **Search-as-you-Type Subsystem:** OpenSearch cluster with `edge_ngram` prefix indexing, Double Metaphone phonetics, and Debezium CDC pipeline from PostgreSQL.
3. **Room Sync Engine (< 200ms Tight Synchronization):** Decoupled audio transport from WebSocket timeline references. Continuous NTP-over-WebSocket clock skew estimation and pitch-neutral dynamic drift correction ($\pm 4\%$ `playbackRate` time-stretching).
4. **Sequence Diagram:** Full sequence flow for **"Host presses pause in a room of 5,000 listeners"** with scheduled future execution timestamps.
5. **Storage Architecture Matrix:** PostgreSQL (ACID metadata), Redis (room leases & state), Cassandra (listening history), Kafka + ClickHouse (royalty auditing).
6. **Failure Scenarios & Resilience:** 5 critical failure scenarios (coordinator death, transatlantic CDN outage, regional cloud disaster, zero-downtime rolling deploys, high-jitter cell towers) with mitigation strategies.
7. **3-Person Team Execution Roadmap:** Prioritized MVP roadmap vs. postponed features.

---

## 📂 Repository Directory Structure

```
skribbl-multiplayer/
├── package.json                 # Root script runner ("npm run dev", "npm start", "npm run test:load")
├── server/
│   ├── index.js                 # Express + Socket.IO server & event router
│   ├── game/
│   │   ├── RoomManager.js       # Room lifecycle, 30s reconnect window, session tokens
│   │   ├── GameState.js         # Turn loop, drawer rotation, word picker, hint schedule
│   │   ├── DrawingManager.js    # Canvas action stack, undo/clear, replay recording
│   │   ├── WordList.js          # Word vocabulary presets & custom word parser
│   │   ├── AbuseProtection.js   # Chat/stroke sliding window rate limiters & sanitizers
│   │   └── scoring.js           # Levenshtein distance, near-miss checker & points formula
│   └── tests/
│       └── load-test.js         # Automated load testing & capacity benchmark
├── client/
│   ├── index.html
│   ├── vite.config.js           # Vite config with WebSocket proxy
│   ├── package.json
│   └── src/
│       ├── App.jsx              # Main React orchestrator
│       ├── socket.js            # Socket.IO connection & localStorage session token
│       ├── index.css            # Responsive styling & arcade design system
│       ├── components/
│       │   ├── Lobby.jsx        # Room creation, shareable link, avatar picker, host settings
│       │   ├── Header.jsx       # Round counter, animated timer, hints/blanks, audio toggle
│       │   ├── Canvas.jsx       # Drawing tools, bucket flood fill, undo/clear, zero-lag streaming
│       │   ├── ChatBox.jsx      # Guesses, "close!" alerts, correct guess banners
│       │   ├── PlayerList.jsx   # Leaderboard ranks, drawer pencil, avatars, scores
│       │   ├── WordModal.jsx    # 3-word picker for drawer with 15s timer
│       │   ├── RoundEndModal.jsx# 5s turn recap with revealed word & bonus points
│       │   ├── GameOverModal.jsx# Winner podium, confetti explosion & replay launcher
│       │   └── ReplayTheater.jsx# Stroke-by-stroke replay player (play/pause/speed/scrub)
│       └── utils/
│           ├── floodFill.js     # BFS canvas image-data flood fill algorithm
│           └── sound.js         # Web Audio API synthesizer (pop, chime, blip, fanfare)
├── docs/
│   ├── QUESTION_1_TECHNICAL_NOTE.md # Detailed canvas sync, ordering, HA & capacity note
│   └── QUESTION_2_SYSTEM_DESIGN.md  # 5-page Spotify Listen Together Architecture Doc
└── README.md                    # Project documentation & run guide
```

