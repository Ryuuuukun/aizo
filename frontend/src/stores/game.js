import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
    state: () => ({
        id: null,
        mode: 'local',                   // 'local' | 'online'
        size: 8,
        status: 'playing',               // 'waiting' | 'playing' | 'finished'
        players: [
            { name: 'Игрок 1', color: 'black', score: 0 },
            { name: 'Игрок 2', color: 'red',   score: 0 },
        ],
        turn: 0, 
        points: [], 
        territories: [],
        currentWall: [], 
        canUndo: false,
        endOffer: null,
        winner: null,
        error: null,
    }),

    getters: {
        activePlayer: (s) => s.players[s.turn],
        isFinished:  (s) => s.status === 'finished',
        canEndGame:  (s) => s.status === 'playing',
        isWallBuilding: (s) => s.currentWall.length > 0,
    },

    actions: {
        newGame({ size, mode = 'local' }) {
            this.$patch({
                id: null,
                mode,
                size,
                status: 'playing',
                turn: 0,
                points: [],
                territories: [],
                currentWall: [],
                canUndo: false,
                endOffer: null,
                winner: null,
                error: null,
            })
            this.players.forEach(p => { p.score = 0 })
        },

        handleCellClick(x, y) {
            console.debug('[game] cell-click', x, y)
        },

        handlePointClick(x, y) {
            console.debug('[game] point-click', x, y)
        },

        cancelWall() {
            this.currentWall = []
            this.canUndo = false
        },

        undoMove() {
            this.cancelWall()
        },

        offerEnd() {
            if (this.mode === 'local') {
                this.status = 'finished'
                this.computeWinner()
            } else {
                this.endOffer = { by: this.turn }
            }
        },

        acceptEnd() {
            this.status = 'finished'
            this.computeWinner()
        },

        declineEnd() {
            this.endOffer = null
        },

        computeWinner() {
            const [a, b] = this.players.map(p => p.score)
            this.winner = a === b ? 'draw' : (a > b ? 0 : 1)
        },

        reset() {
            this.$patch({
                id: null,
                status: 'playing',
                turn: 0,
                points: [],
                territories: [],
                currentWall: [],
                canUndo: false,
                endOffer: null,
                winner: null,
                error: null,
            })
            this.players.forEach(p => { p.score = 0 })
        },
    },
})