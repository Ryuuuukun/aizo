import { defineStore } from 'pinia'

export const useLobbyStore = defineStore('lobby', {
    state: () => ({
        games: [],
        loading: false,
        error: null,
        query: '',
        page: 1,
        pageSize: 6,
    }),

    getters: {

        waitingGames: (s) => s.games.filter(g => g.status === 'WAITING'),

        filteredGames() {
            const q = this.query.trim().toLowerCase()
            const source = this.waitingGames
            if (!q) return source
            return source.filter(g => (g.name || '').toLowerCase().includes(q))
        },

        totalPages() {
            return Math.max(1, Math.ceil(this.filteredGames.length / this.pageSize))
        },

        pagedGames() {
            const start = (this.page - 1) * this.pageSize
            return this.filteredGames.slice(start, start + this.pageSize)
        },
    },

    actions: {

        async fetchGames() {
            this.loading = true
            this.error = null
            try {

                //this.games = список игр

                this.page = 1
            } catch (e) {
                this.error = 'Не удалось загрузить список игр'
                console.error(e)
            } finally {
                this.loading = false
            }
        },

        setQuery(value) {
            this.query = value
            this.page = 1
        },

        setPage(value) {
            this.page = Math.min(Math.max(1, value), this.totalPages)
        },

        async createGame({ name, size }) {
            const newGame = {
                id: crypto.randomUUID(),
                name,
                creator: { id: 'me', username: 'me', firstName: 'Вы' },
                opponent: null,
                turnPlayer: null,
                status: 'WAITING',
                createdAt: new Date().toISOString(),
                startedAt: null,
                finishedAt: null,
            }
            this.games.unshift(newGame)
            return newGame.id
        },


        async joinGame(id) {
            
            return id
        },
    },
})