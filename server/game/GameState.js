import { getWordPool, pickRandomWords } from './WordList.js';
import { 
  checkGuess, 
  calculateGuesserPoints, 
  calculateDrawerPoints, 
  generateWordHint 
} from './scoring.js';
import { DrawingManager } from './DrawingManager.js';

export const GAME_STATUS = {
  LOBBY: 'LOBBY',
  CHOOSING_WORD: 'CHOOSING_WORD',
  DRAWING: 'DRAWING',
  ROUND_RECAP: 'ROUND_RECAP',
  GAME_OVER: 'GAME_OVER'
};

export class GameState {
  constructor(room, io) {
    this.room = room; // Parent Room instance
    this.io = io;
    this.status = GAME_STATUS.LOBBY;
    
    // Configuration
    this.maxRounds = 3;
    this.drawTime = 60; // seconds
    this.wordPreset = 'classic';
    this.customWords = '';
    
    // Game loop tracking
    this.currentRound = 1;
    this.turnOrder = []; // Array of player IDs
    this.currentTurnIndex = 0;
    this.currentDrawerId = null;
    this.secretWord = '';
    this.wordOptions = [];
    this.revealedHintIndices = new Set();
    this.guessedPlayerIds = new Set();
    this.turnGuessRank = 0;

    // Timers
    this.timer = null;
    this.timeLeft = 0;

    // Drawing state & Replay recordings
    this.drawingManager = new DrawingManager();
  }

  updateSettings({ rounds, drawTime, wordPreset, customWords }) {
    if (this.status !== GAME_STATUS.LOBBY) return false;
    if (rounds) this.maxRounds = Math.max(1, Math.min(10, Number(rounds) || 3));
    if (drawTime) this.drawTime = Math.max(20, Math.min(180, Number(drawTime) || 60));
    if (wordPreset) this.wordPreset = wordPreset;
    if (typeof customWords === 'string') this.customWords = customWords;
    return true;
  }

  startGame() {
    if (this.status !== GAME_STATUS.LOBBY) return false;
    const activePlayers = this.room.getActivePlayers();
    if (activePlayers.length < 2) {
      // Allow single player practice/testing mode if explicitly started by host
    }

    // Reset scores
    for (const p of this.room.players.values()) {
      p.score = 0;
    }

    this.currentRound = 1;
    this.turnOrder = activePlayers.map(p => p.id);
    this.currentTurnIndex = 0;
    this.drawingManager.reset();

    this.startTurn();
    return true;
  }

  startTurn() {
    this.clearTimer();
    this.guessedPlayerIds.clear();
    this.turnGuessRank = 0;
    this.revealedHintIndices.clear();

    const activePlayers = this.room.getActivePlayers();
    if (activePlayers.length === 0) {
      this.status = GAME_STATUS.LOBBY;
      this.broadcastState();
      return;
    }

    // If turnIndex exceeds players, advance round
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.currentTurnIndex = 0;
      this.currentRound++;
      if (this.currentRound > this.maxRounds) {
        this.endGame();
        return;
      }
    }

    // Find valid drawer
    let drawerId = this.turnOrder[this.currentTurnIndex];
    let drawer = this.room.players.get(drawerId);

    // Skip disconnected players
    while ((!drawer || drawer.isDisconnected) && this.currentTurnIndex < this.turnOrder.length - 1) {
      this.currentTurnIndex++;
      drawerId = this.turnOrder[this.currentTurnIndex];
      drawer = this.room.players.get(drawerId);
    }

    if (!drawer || drawer.isDisconnected) {
      // Re-evaluate round
      this.currentRound++;
      if (this.currentRound > this.maxRounds) {
        this.endGame();
        return;
      }
      this.currentTurnIndex = 0;
      this.startTurn();
      return;
    }

    this.currentDrawerId = drawerId;
    this.status = GAME_STATUS.CHOOSING_WORD;

    // Pick 3 words for drawer
    const wordPool = getWordPool(this.wordPreset, this.customWords);
    this.wordOptions = pickRandomWords(wordPool, 3);
    this.secretWord = '';

    // Broadcast word choices to drawer only
    const drawerSocket = this.io.sockets.sockets.get(drawer.socketId);
    if (drawerSocket) {
      drawerSocket.emit('chooseWordOptions', {
        words: this.wordOptions,
        timeout: 15
      });
    }

    // Start 15-second choosing countdown
    this.timeLeft = 15;
    this.broadcastState();

    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimer();
        // Auto-select first word if drawer didn't choose in time
        this.selectWord(this.wordOptions[0]);
      } else {
        this.io.to(this.room.id).emit('timerTick', { timeLeft: this.timeLeft });
      }
    }, 1000);
  }

  selectWord(chosenWord) {
    if (this.status !== GAME_STATUS.CHOOSING_WORD) return;
    this.clearTimer();

    // Verify chosen word is valid
    if (!this.wordOptions.includes(chosenWord)) {
      chosenWord = this.wordOptions[0] || 'apple';
    }

    this.secretWord = chosenWord;
    this.status = GAME_STATUS.DRAWING;
    this.timeLeft = this.drawTime;

    const drawer = this.room.players.get(this.currentDrawerId);
    if (drawer) {
      this.drawingManager.startTurn(
        drawer, 
        this.secretWord, 
        this.currentRound, 
        this.currentTurnIndex
      );
    }

    // Inform drawer of the chosen word
    const drawerSocket = drawer ? this.io.sockets.sockets.get(drawer.socketId) : null;
    if (drawerSocket) {
      drawerSocket.emit('wordSelected', { word: this.secretWord });
    }

    this.broadcastState();

    // Start drawing countdown
    this.timer = setInterval(() => {
      this.timeLeft--;

      // Hints reveal logic over time
      this.checkHintReveal();

      if (this.timeLeft <= 0) {
        this.clearTimer();
        this.endTurn(false, 'Time is up!');
      } else {
        this.io.to(this.room.id).emit('timerTick', { 
          timeLeft: this.timeLeft,
          blanks: this.getBlanks()
        });
      }
    }, 1000);
  }

  checkHintReveal() {
    if (!this.secretWord) return;
    const wordLetters = this.secretWord.split('').map((char, index) => ({ char, index }))
      .filter(({ char, index }) => char !== ' ' && char !== '-' && !this.revealedHintIndices.has(index));

    if (wordLetters.length <= 1) return; // Keep at least 1-2 letters hidden

    const totalSeconds = this.drawTime;
    const maxHintsAllowed = Math.max(1, Math.floor(this.secretWord.length / 3));

    // Reveal 1st hint at 60% remaining time
    if (this.timeLeft <= Math.floor(totalSeconds * 0.6) && this.revealedHintIndices.size < 1) {
      const randomIndex = wordLetters[Math.floor(Math.random() * wordLetters.length)].index;
      this.revealedHintIndices.add(randomIndex);
      this.io.to(this.room.id).emit('hintRevealed', { blanks: this.getBlanks() });
    }
    // Reveal 2nd hint at 30% remaining time
    else if (this.timeLeft <= Math.floor(totalSeconds * 0.3) && this.revealedHintIndices.size < Math.min(2, maxHintsAllowed)) {
      const randomIndex = wordLetters[Math.floor(Math.random() * wordLetters.length)].index;
      this.revealedHintIndices.add(randomIndex);
      this.io.to(this.room.id).emit('hintRevealed', { blanks: this.getBlanks() });
    }
  }

  getBlanks() {
    if (!this.secretWord) return '';
    return generateWordHint(this.secretWord, this.revealedHintIndices);
  }

  handleGuess(player, message) {
    if (this.status !== GAME_STATUS.DRAWING) return { isCorrect: false, displayInChat: true };
    if (player.id === this.currentDrawerId) return { isCorrect: false, displayInChat: true }; // Drawer cannot guess
    if (this.guessedPlayerIds.has(player.id)) {
      // Player already guessed correctly. They can chat, but their messages are only visible to other players who already guessed!
      return { isCorrect: false, displayInChat: false, alreadyGuessed: true };
    }

    const { isCorrect, isNearMiss, distance } = checkGuess(message, this.secretWord);

    if (isCorrect) {
      this.guessedPlayerIds.add(player.id);
      this.turnGuessRank++;

      // Points calculation
      const pointsEarned = calculateGuesserPoints(this.timeLeft, this.drawTime, this.turnGuessRank);
      player.score = (player.score || 0) + pointsEarned;

      // Broadcast correct guess event (without spoiling the word in chat)
      this.io.to(this.room.id).emit('playerGuessedCorrect', {
        playerId: player.id,
        playerName: player.name,
        points: pointsEarned,
        scores: this.room.getScores()
      });

      // Check if all eligible players have guessed
      const nonDrawerActivePlayers = this.room.getActivePlayers()
        .filter(p => p.id !== this.currentDrawerId);

      if (nonDrawerActivePlayers.length > 0 && 
          nonDrawerActivePlayers.every(p => this.guessedPlayerIds.has(p.id))) {
        // Everyone guessed! End turn early
        setTimeout(() => {
          this.endTurn(true, 'Everyone guessed the word!');
        }, 1000);
      }

      return { isCorrect: true, displayInChat: false };
    }

    if (isNearMiss) {
      // Emit private near-miss event to this player's socket ONLY
      const socket = this.io.sockets.sockets.get(player.socketId);
      if (socket) {
        socket.emit('nearMiss', {
          guess: message,
          message: `'${message}' is close!`
        });
      }
      return { isCorrect: false, isNearMiss: true, displayInChat: true };
    }

    return { isCorrect: false, displayInChat: true };
  }

  endTurn(allGuessed = false, reason = '') {
    this.clearTimer();
    this.status = GAME_STATUS.ROUND_RECAP;

    // Award bonus points to drawer based on how many people guessed
    const drawer = this.room.players.get(this.currentDrawerId);
    const eligibleCount = this.room.getActivePlayers().filter(p => p.id !== this.currentDrawerId).length;
    const drawerPoints = drawer ? calculateDrawerPoints(this.guessedPlayerIds.size, eligibleCount) : 0;
    
    if (drawer && drawerPoints > 0) {
      drawer.score = (drawer.score || 0) + drawerPoints;
    }

    this.drawingManager.endTurn();

    // Broadcast recap with revealed secret word and updated scores
    this.io.to(this.room.id).emit('roundRecap', {
      word: this.secretWord,
      drawerPoints,
      drawerName: drawer ? drawer.name : 'Unknown',
      allGuessed,
      reason,
      scores: this.room.getScores(),
      nextTurnIn: 5
    });

    // Wait 5 seconds recap before transitioning to next turn
    this.timer = setTimeout(() => {
      this.currentTurnIndex++;
      this.startTurn();
    }, 5000);
  }

  handleDrawerDisconnect(disconnectedPlayerId) {
    if (this.currentDrawerId !== disconnectedPlayerId) return;

    // Clean recovery when drawer leaves mid-turn
    this.clearTimer();
    this.io.to(this.room.id).emit('drawerLeftMidTurn', {
      word: this.secretWord || 'None',
      message: 'The drawer disconnected! Skipping to the next player in 3 seconds...'
    });

    this.drawingManager.endTurn();

    setTimeout(() => {
      this.currentTurnIndex++;
      this.startTurn();
    }, 3000);
  }

  endGame() {
    this.clearTimer();
    this.status = GAME_STATUS.GAME_OVER;

    const finalScores = this.room.getScores();
    const replays = this.drawingManager.getAllReplays();

    this.io.to(this.room.id).emit('gameOver', {
      scores: finalScores,
      replays
    });

    this.broadcastState();
  }

  resetToLobby() {
    this.clearTimer();
    this.status = GAME_STATUS.LOBBY;
    this.currentRound = 1;
    this.currentTurnIndex = 0;
    this.currentDrawerId = null;
    this.secretWord = '';
    this.wordOptions = [];
    this.revealedHintIndices.clear();
    this.guessedPlayerIds.clear();
    this.turnGuessRank = 0;
    this.drawingManager.reset();

    for (const p of this.room.players.values()) {
      p.score = 0;
    }

    this.io.to(this.room.id).emit('returnedToLobby', {
      scores: this.room.getScores()
    });
    this.broadcastState();
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  broadcastState() {
    const activePlayers = this.room.getActivePlayers();
    const scores = this.room.getScores();

    for (const player of this.room.players.values()) {
      if (player.isDisconnected) continue;
      const socket = this.io.sockets.sockets.get(player.socketId);
      if (!socket) continue;

      const isDrawer = player.id === this.currentDrawerId;

      socket.emit('gameStateUpdate', {
        status: this.status,
        round: this.currentRound,
        maxRounds: this.maxRounds,
        drawTime: this.drawTime,
        timeLeft: this.timeLeft,
        currentDrawer: this.room.players.get(this.currentDrawerId) ? {
          id: this.currentDrawerId,
          name: this.room.players.get(this.currentDrawerId).name,
          avatar: this.room.players.get(this.currentDrawerId).avatar
        } : null,
        isDrawer,
        // Secret word is strictly withheld from non-drawers!
        word: isDrawer ? this.secretWord : null,
        blanks: isDrawer ? this.secretWord : this.getBlanks(),
        hasGuessed: this.guessedPlayerIds.has(player.id),
        scores
      });
    }
  }
}
