import { defineStore } from 'pinia'
import {
    beginBoundary,
    cancelTurn,
    createGame,
    extendBoundary,
    finishGame,
    finishPointTurn,
    getScores,
    placePoint,
} from '../game/gameState.js'

const PLAYER_DETAILS = [
    { name: 'Игрок 1', color: 'black', territory: 'B' },
    { name: 'Игрок 2', color: 'red', territory: 'R' },
]

export const useGameStore = defineStore('game', {
    state: () => ({
        id: null,
        mode: 'local',
        game: createGame(8),
        error: null,
    }),

    getters: {
        size: state => state.game.size,
        board: state => state.game.board,
        territories: state => state.game.territories,
        pendingMove: state => state.game.pendingMove,
        currentPlayer: state => state.game.currentPlayer,
        isFinished: state => state.game.status === 'FINISHED',
        canEndGame: state => state.game.status === 'PLAYING',
        canUndo: state => Boolean(state.game.pendingMove),
        isWallBuilding: state => state.game.pendingMove?.kind === 'boundary',
        turn: state => state.game.currentPlayer === 'B' ? 0 : 1,
        activePlayer: state => {
            const player = PLAYER_DETAILS[state.game.currentPlayer === 'B' ? 0 : 1]
            return { name: player.name, color: player.color }
        },
        winner: state => {
            if (state.game.winner === 'TIE') return 'draw'
            if (state.game.winner === 'B') return 0
            if (state.game.winner === 'R') return 1
            return null
        },
        players: state => {
            const scores = getScores(state.game)
            return PLAYER_DETAILS.map(player => ({
                name: player.name,
                color: player.color,
                score: scores[player.territory],
            }))
        },
    },

    actions: {
        newGame({ size, mode = 'local' }) {
            this.game = createGame(size)
            this.id = null
            this.mode = mode
            this.error = null
        },

        handlePointClick(x, y) {
            if (this.game.status !== 'PLAYING') return
            if (!Number.isInteger(x)
                || !Number.isInteger(y)
                || x < 0
                || y < 0
                || x > this.game.size
                || y > this.game.size) {
                this.error = 'Точка находится за пределами поля.'
                return
            }

            const current = this.game
            const color = current.board[y][x]

            try {
                if (current.pendingMove?.kind === 'boundary') {
                    this.game = extendBoundary(current, x, y)
                } else if (current.pendingMove?.kind === 'point') {
                    const placed = current.pendingMove.point
                    if (placed.x === x && placed.y === y) {
                        this.game = finishPointTurn(current)
                    } else if (color === current.currentPlayer) {
                        const boundary = beginBoundary(current, placed.x, placed.y)
                        this.game = extendBoundary(boundary, x, y)
                    } else {
                        throw new Error('Поставьте точку или продолжите стену своей точкой.')
                    }
                } else if (color === '.') {
                    this.game = placePoint(current, x, y)
                } else if (color === current.currentPlayer) {
                    this.game = beginBoundary(current, x, y)
                } else {
                    throw new Error('Можно начать стену только со своей точки.')
                }

                this.error = null
            } catch (error) {
                this.error = error.message
            }
        },

        confirmWall() {
            const move = this.game.pendingMove
            if (move?.kind !== 'boundary') return
            this.handlePointClick(move.path[0].x, move.path[0].y)
        },

        cancelWall() {
            this.game = cancelTurn(this.game)
            this.error = null
        },

        undoMove() {
            this.cancelWall()
        },

        offerEnd() {
            if (this.game.status !== 'PLAYING') return
            this.game = finishGame(this.game)
            this.error = null
        },

        clearError() {
            this.error = null
        },

        reset() {
            this.game = createGame(this.game.size)
            this.id = null
            this.mode = 'local'
            this.error = null
        },
    },
})
