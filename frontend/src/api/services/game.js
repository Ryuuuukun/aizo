import { useAuthStore } from "@/stores/auth.js";
import { socket } from "../websocket.js";
import client from "../axios.js";

import { reactive } from "vue";

export const GameState = () => ({
    canMove: false
});

export const API_SESSION_URL = '/api/session';

class OnlineGame {
    constructor() {
        this.state = null;
        this.session = null;
        this.subsribe = null;
    }

    async create(size) {
        const response = await client.post(API_SESSION_URL, { size });
        this._initSession(response.data);
    }

    async active() {
        try {
            const response = await client.get(`${API_SESSION_URL}/active`);
            this._initSession(response.data);
        } catch (error) {
            throw error;
        }
    }

    async join(session) {
        try {
            const response = await client.post(`${API_SESSION_URL}/${session}/join`);
            this._initSession(response.data);
        } catch (error) {
            throw error;
        }
    }

    async move() {
        if (this.session && this.state.canMove) {

        }
    }

    async offer() {
        try {
            const response = await client.post(`${API_SESSION_URL}/${this.session.id}/offer`);
            this.session = response.data;
        } catch (error) {
            throw error;
        }
    }

    clear() {
        this._clearSession();
    }

    _initSession(session) {
        this.clear();

        this.state = GameState();
        this.session = session;
        this.subsribe = socket.subscribe('/user/queue/session', event => {
            const response = JSON.parse(event.body);
            this.session = response.payload;

            // обработка event
        });
    }

    _clearSession() {
        this.state = null;
        this.session = null;
        this.subsribe?.unsubscribe();
    }
}

export const online = reactive(new OnlineGame());
