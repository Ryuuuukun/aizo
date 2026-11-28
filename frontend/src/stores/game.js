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
import {
    chooseBoundary,
    findLegalBoundary,
    hardDecision,
    monteCarloDecision,
    randomDecision,
} from '../ai/randomAlgortihm.js'

const PLAYER_DETAILS = [
    { name: 'Игрок 1', color: 'black', territory: 'B' },
    { name: 'Игрок 2', color: 'red', territory: 'R' },
]

function getPlayerDetails(mode) {
    if (mode === 'computer') {
        return [
            { name: 'Вы', color: 'black', territory: 'B' },
            { name: 'Компьютер', color: 'red', territory: 'R' },
        ]
    }
    return PLAYER_DETAILS
}

function completeComputerBoundary(state, boundary) {
    let next = beginBoundary(state, boundary[0].x, boundary[0].y)
    for (const point of boundary.slice(1)) {
        next = extendBoundary(next, point.x, point.y)
    }
    return extendBoundary(next, boundary[0].x, boundary[0].y)
}

function rotateBoundaryToPoint(boundary, point) {
    const startIndex = boundary.findIndex(candidate =>
        candidate.x === point.x && candidate.y === point.y)
    return [...boundary.slice(startIndex), ...boundary.slice(0, startIndex)]
}

export const useGameStore = defineStore('game', {
    state: () => ({
        id: null,
        mode: 'local',
        difficulty: 'random',
        game: createGame(8),
        error: null,
        turnDuration: 300,
    }),

    getters: {
        size: state => state.game.size,
        board: state => state.game.board,
        territories: state => state.game.territories,
        treasures: state => state.game.treasures,
        pendingMove: state => state.game.pendingMove,
        currentPlayer: state => state.game.currentPlayer,
        isFinished: state => state.game.status === 'FINISHED',
        canEndGame: state => state.game.status === 'PLAYING',
        canUndo: state => Boolean(state.game.pendingMove),
        isWallBuilding: state => state.game.pendingMove?.kind === 'boundary',
        turn: state => state.game.currentPlayer === 'B' ? 0 : 1,
        activePlayer: state => {
            const player = getPlayerDetails(state.mode)[state.game.currentPlayer === 'B' ? 0 : 1]
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
            return getPlayerDetails(state.mode).map(player => ({
                name: player.name,
                color: player.color,
                score: scores[player.territory],
            }))
        },
    },

    actions: {
        newGame({
            size,
            mode = 'local',
            difficulty = 'random',
            treasures = mode === 'treasures',
        }) {
            if (!['local', 'computer', 'treasures'].includes(mode)) {
                throw new Error('Выбран неизвестный режим игры.')
            }
            if (!['random', 'hard', 'monte-carlo', 'monteCarlo', 'expert'].includes(difficulty)) {
                throw new Error('Выбрана неизвестная сложность компьютера.')
            }

            this.game = createGame(size, treasures)
            this.id = null
            this.mode = mode
            this.difficulty = difficulty
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

        playComputerTurn() {
            if (this.mode !== 'computer'
                || this.game.currentPlayer !== 'R'
                || this.game.pendingMove
                || this.game.status !== 'PLAYING') {
                return false
            }

            const existingBoundary = chooseBoundary(
                findLegalBoundary(this.game, 'R'),
                this.difficulty
            )
            if (existingBoundary) {
                this.game = completeComputerBoundary(this.game, existingBoundary)
                this.error = null
                return true
            }

            const decide = this.difficulty === 'monte-carlo'
                || this.difficulty === 'monteCarlo'
                || this.difficulty === 'expert'
                ? monteCarloDecision
                : (this.difficulty === 'hard' ? hardDecision : randomDecision)
            const point = this.difficulty === 'monte-carlo'
                || this.difficulty === 'monteCarlo'
                || this.difficulty === 'expert'
                ? monteCarloDecision(this.game, 'R')
                : decide(this.game.board, 'R')
            const afterPoint = placePoint(this.game, point.x, point.y)
            const newBoundary = chooseBoundary(
                findLegalBoundary(afterPoint, 'R', point),
                this.difficulty
            )
            this.game = newBoundary
                ? completeComputerBoundary(afterPoint, rotateBoundaryToPoint(newBoundary, point))
                : finishPointTurn(afterPoint)
            this.error = null
            return true
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
            this.difficulty = 'random'
            this.error = null
        },
    },
})
