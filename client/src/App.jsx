import React, { useState, useEffect } from 'react';
import { 
  socket, 
  getOrCreateSessionId, 
  getStoredPlayerName, 
  getStoredAvatar 
} from './socket.js';
import { sounds } from './utils/sound.js';

import Header from './components/Header.jsx';
import Canvas from './components/Canvas.jsx';
import PlayerList from './components/PlayerList.jsx';
import ChatBox from './components/ChatBox.jsx';
import Lobby from './components/Lobby.jsx';
import WordModal from './components/WordModal.jsx';
import RoundEndModal from './components/RoundEndModal.jsx';
import GameOverModal from './components/GameOverModal.jsx';

export default function App() {
  const [sessionId] = useState(getOrCreateSessionId);
  const [playerName, setPlayerName] = useState(() => getStoredPlayerName() || `Doodler_${Math.floor(100 + Math.random() * 900)}`);
  const [avatar, setAvatar] = useState(getStoredAvatar);

  // Room & Player State
  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState('');
  const [settings, setSettings] = useState({ rounds: 3, drawTime: 60, wordPreset: 'classic', customWords: '' });
  const [players, setPlayers] = useState([]);

  // Game loop state
  const [gameState, setGameState] = useState({
    status: 'LOBBY',
    round: 1,
    maxRounds: 3,
    drawTime: 60,
    timeLeft: 60,
    currentDrawer: null,
    isDrawer: false,
    word: null,
    blanks: '',
    hasGuessed: false,
    scores: []
  });

  // Turn Modals & Overlays
  const [wordChoices, setWordChoices] = useState([]);
  const [showWordModal, setShowWordModal] = useState(false);
  const [roundRecapData, setRoundRecapData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);

  // Messages and Canvas
  const [messages, setMessages] = useState([]);
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [guessedPlayerIds, setGuessedPlayerIds] = useState([]);
  const [mobileTab, setMobileTab] = useState('chat'); // 'chat' | 'players'

  // Auto-join on reconnect or query parameter
  useEffect(() => {
    // Socket connection listeners
    socket.on('connect', () => {
      console.log('Connected to socket server:', socket.id);
      setMyPlayerId(socket.id);
    });

    socket.on('gameStateUpdate', (state) => {
      setGameState((prev) => ({
        ...prev,
        ...state
      }));
      if (state.scores) setPlayers(state.scores);

      if (state.status === 'DRAWING') {
        setShowWordModal(false);
        setRoundRecapData(null);
      }
      if (state.status === 'LOBBY') {
        setGameOverData(null);
        setRoundRecapData(null);
        setShowWordModal(false);
      }
    });

    socket.on('timerTick', ({ timeLeft, blanks }) => {
      setGameState((prev) => ({
        ...prev,
        timeLeft,
        blanks: blanks || prev.blanks
      }));
      if (timeLeft <= 5 && timeLeft > 0) {
        sounds.playTick();
      }
    });

    socket.on('hintRevealed', ({ blanks }) => {
      setGameState((prev) => ({ ...prev, blanks }));
    });

    socket.on('chooseWordOptions', ({ words, timeout }) => {
      setWordChoices(words);
      setShowWordModal(true);
      sounds.playTurnStart();
    });

    socket.on('wordSelected', ({ word }) => {
      setShowWordModal(false);
      setGameState((prev) => ({ ...prev, word, isDrawer: true }));
      setGuessedPlayerIds([]);
      sounds.playTurnStart();
    });

    socket.on('playerGuessedCorrect', ({ playerId, playerName: guesserName, points, scores }) => {
      sounds.playCorrect();
      setGuessedPlayerIds((prev) => [...new Set([...prev, playerId])]);
      if (scores) setPlayers(scores);

      setMessages((prev) => [
        ...prev,
        {
          id: 'correct-' + Date.now() + Math.random(),
          sender: guesserName,
          points,
          isCorrectGuess: true
        }
      ]);
    });

    socket.on('nearMiss', ({ guess, message }) => {
      sounds.playNearMiss();
      setMessages((prev) => [
        ...prev,
        {
          id: 'near-' + Date.now() + Math.random(),
          text: message,
          isNearMiss: true
        }
      ]);
    });

    socket.on('chatMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('roundRecap', (data) => {
      setRoundRecapData(data);
      if (data.scores) setPlayers(data.scores);
      setGuessedPlayerIds([]);
    });

    socket.on('drawerLeftMidTurn', ({ message }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: 'sys-' + Date.now(),
          text: message,
          isSystem: true,
          isWarning: true
        }
      ]);
    });

    socket.on('gameOver', ({ scores, replays }) => {
      setGameOverData({ scores, replays });
    });

    socket.on('returnedToLobby', ({ scores }) => {
      setGameOverData(null);
      setRoundRecapData(null);
      setShowWordModal(false);
      setGameState((prev) => ({
        ...prev,
        status: 'LOBBY',
        round: 1,
        scores: scores || prev.scores
      }));
      if (scores) setPlayers(scores);
    });

    socket.on('settingsUpdated', (newSettings) => {
      setSettings(newSettings);
    });

    socket.on('hostChanged', ({ newHostId }) => {
      setIsHost(myPlayerId === newHostId);
    });

    return () => {
      socket.off('connect');
      socket.off('gameStateUpdate');
      socket.off('timerTick');
      socket.off('hintRevealed');
      socket.off('chooseWordOptions');
      socket.off('wordSelected');
      socket.off('playerGuessedCorrect');
      socket.off('nearMiss');
      socket.off('chatMessage');
      socket.off('roundRecap');
      socket.off('drawerLeftMidTurn');
      socket.off('gameOver');
      socket.off('returnedToLobby');
      socket.off('settingsUpdated');
      socket.off('hostChanged');
    };
  }, [myPlayerId]);

  // Actions
  const handleCreateRoom = (roomSettings) => {
    socket.emit(
      'createRoom',
      {
        player: {
          id: sessionId,
          sessionId,
          name: playerName,
          avatar
        }
      },
      (res) => {
        if (res && res.success) {
          setRoomId(res.roomId);
          setIsInRoom(true);
          setIsHost(true);
          setMyPlayerId(sessionId);
          if (res.settings) setSettings(res.settings);
        }
      }
    );
  };

  const handleJoinRoom = (code) => {
    socket.emit(
      'joinRoom',
      {
        roomId: code,
        player: {
          id: sessionId,
          sessionId,
          name: playerName,
          avatar
        }
      },
      (res) => {
        if (res && res.success) {
          setRoomId(res.roomId);
          setIsInRoom(true);
          setIsHost(res.isHost);
          setMyPlayerId(sessionId);
          if (res.settings) setSettings(res.settings);
          if (res.canvasHistory) setCanvasHistory(res.canvasHistory);
        } else {
          alert(res?.error || 'Failed to join room');
        }
      }
    );
  };

  const handleStartGame = () => {
    socket.emit('startGame');
  };

  const handleUpdateSettings = (newSettings) => {
    socket.emit('updateSettings', { settings: newSettings });
  };

  const handleSelectWord = (word) => {
    socket.emit('selectWord', { word });
    setShowWordModal(false);
  };

  const handlePlayAgain = () => {
    setGameOverData(null);
    socket.emit('startGame');
  };

  const handleReturnToLobby = () => {
    socket.emit('returnToLobby');
    setGameOverData(null);
  };

  const handleLeaveRoom = () => {
    socket.emit('leaveRoom');
    setIsInRoom(false);
    setRoomId('');
    setIsHost(false);
    setGameOverData(null);
    setRoundRecapData(null);
    setShowWordModal(false);
    setMessages([]);
    setCanvasHistory([]);
    setGuessedPlayerIds([]);
    window.history.replaceState({}, document.title, window.location.pathname);
    setGameState({
      status: 'LOBBY',
      round: 1,
      maxRounds: 3,
      drawTime: 60,
      timeLeft: 60,
      currentDrawer: null,
      isDrawer: false,
      word: null,
      blanks: '',
      hasGuessed: false,
      scores: []
    });
  };

  return (
    <div className="app-container">
      {/* If game is in Lobby or player hasn't joined a room yet */}
      {(!isInRoom || gameState.status === 'LOBBY') ? (
        <Lobby
          isInRoom={isInRoom}
          roomId={roomId}
          isHost={isHost}
          players={players}
          settings={settings}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onStartGame={handleStartGame}
          onUpdateSettings={handleUpdateSettings}
          playerName={playerName}
          setPlayerName={setPlayerName}
          avatar={avatar}
          setAvatar={setAvatar}
        />
      ) : (
        /* Main Active Gameplay Screen */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Header */}
          <Header
            round={gameState.round}
            maxRounds={gameState.maxRounds}
            timeLeft={gameState.timeLeft}
            status={gameState.status}
            isDrawer={gameState.isDrawer}
            word={gameState.word}
            blanks={gameState.blanks}
            roomId={roomId}
            drawerName={gameState.currentDrawer?.name}
            onLeaveRoom={handleLeaveRoom}
          />

          {/* Responsive Game Board */}
          <div className="game-board">
            {/* Left Column: Player Leaderboard */}
            <div className={`game-col-players ${mobileTab !== 'players' ? 'mobile-hidden' : ''}`}>
              <PlayerList
                players={players}
                currentDrawerId={gameState.currentDrawer?.id}
                myPlayerId={sessionId}
                guessedPlayerIds={guessedPlayerIds}
              />
            </div>

            {/* Center Column: Canvas & Drawer Controls */}
            <div className="game-col-canvas">
              <Canvas
                key={`canvas-${gameState.round}-${gameState.currentDrawer?.id}`}
                isDrawer={gameState.isDrawer}
                initialHistory={canvasHistory}
                roomId={roomId}
              />

              {/* Mobile Tab Switcher (Visible on mobile <= 860px) */}
              <div className="mobile-tabs" style={{ marginTop: '8px' }}>
                <button 
                  className={`mobile-tab-btn ${mobileTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setMobileTab('chat')}
                >
                  <span>💬 Chat & Guesses</span>
                </button>
                <button 
                  className={`mobile-tab-btn ${mobileTab === 'players' ? 'active' : ''}`}
                  onClick={() => setMobileTab('players')}
                >
                  <span>🏆 Leaderboard ({players.length})</span>
                </button>
              </div>
            </div>

            {/* Right Column: Chat & Guesses */}
            <div className={`game-col-chat ${mobileTab !== 'chat' ? 'mobile-hidden' : ''}`}>
              <ChatBox
                messages={messages}
                isDrawer={gameState.isDrawer}
                hasGuessed={gameState.hasGuessed}
              />
            </div>
          </div>

          {/* Drawer Word Selection Modal */}
          {showWordModal && (
            <WordModal
              words={wordChoices}
              timeout={gameState.timeLeft || 15}
              onSelect={handleSelectWord}
            />
          )}

          {/* End of Turn Recap Modal */}
          {roundRecapData && gameState.status === 'ROUND_RECAP' && (
            <RoundEndModal
              word={roundRecapData.word}
              drawerPoints={roundRecapData.drawerPoints}
              drawerName={roundRecapData.drawerName}
              reason={roundRecapData.reason}
              allGuessed={roundRecapData.allGuessed}
              nextTurnIn={roundRecapData.nextTurnIn}
            />
          )}

          {/* Game Over Grand Finale Podium & Replay Theater */}
          {gameOverData && (
            <GameOverModal
              scores={gameOverData.scores}
              replays={gameOverData.replays}
              isHost={isHost}
              onPlayAgain={handlePlayAgain}
              onReturnToLobby={handleReturnToLobby}
              onLeaveRoom={handleLeaveRoom}
            />
          )}
        </div>
      )}
    </div>
  );
}
