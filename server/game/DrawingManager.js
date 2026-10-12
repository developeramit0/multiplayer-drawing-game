/**
 * Manages drawing state for the active turn and records stroke-by-stroke history
 * for the end-of-game replay gallery.
 */
export class DrawingManager {
  constructor() {
    this.currentActions = []; // Actions for current turn
    this.turnStartTime = 0;
    this.currentTurnInfo = null;
    this.gameReplays = []; // All completed drawings for this game
  }

  startTurn(drawer, word, round, turnIndex) {
    this.currentActions = [];
    this.turnStartTime = Date.now();
    this.currentTurnInfo = {
      round,
      turnIndex,
      drawer: {
        id: drawer.id,
        name: drawer.name,
        avatar: drawer.avatar
      },
      word,
      startTime: this.turnStartTime,
      actions: []
    };
  }

  addAction(action) {
    const timeOffset = Date.now() - (this.turnStartTime || Date.now());
    const actionWithTime = { ...action, timeOffset };

    if (action.type === 'clear') {
      this.currentActions = [];
      if (this.currentTurnInfo) {
        this.currentTurnInfo.actions.push(actionWithTime);
      }
      return { type: 'clear' };
    }

    if (action.type === 'undo') {
      if (this.currentActions.length > 0) {
        this.currentActions.pop();
      }
      if (this.currentTurnInfo) {
        this.currentTurnInfo.actions.push(actionWithTime);
      }
      return { type: 'undo', currentActions: this.currentActions };
    }

    // Stroke or Fill
    this.currentActions.push(action);
    if (this.currentTurnInfo) {
      this.currentTurnInfo.actions.push(actionWithTime);
    }

    return action;
  }

  getCurrentState() {
    return [...this.currentActions];
  }

  endTurn() {
    if (this.currentTurnInfo && this.currentTurnInfo.actions.length > 0) {
      this.currentTurnInfo.endTime = Date.now();
      this.currentTurnInfo.duration = Math.round((this.currentTurnInfo.endTime - this.turnStartTime) / 1000);
      this.gameReplays.push({ ...this.currentTurnInfo });
    }
    this.currentActions = [];
    this.currentTurnInfo = null;
  }

  getAllReplays() {
    return this.gameReplays;
  }

  reset() {
    this.currentActions = [];
    this.gameReplays = [];
    this.currentTurnInfo = null;
  }
}
