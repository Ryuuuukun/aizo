import client from "../axios";

export const GameState = (session, size) => ({
    session,
    size,

    points: [],
    territories: [],

    turnPlayer: null, // me | other
    canMove: false
});

export const API_SESSION_URL = '/api/session';

export class OnlineGame {
    constructor() {
        this.state = null;
    }

    async create(size) {
        const response = await client.post(API_SESSION_URL, { size });
        this.state = GameState(response.data.session, size);
    }

    async move(territory) {
        // const response = await client.post(`${API_SESSION_URL}/move`, { territory });
    }

    async cancel() {
        await client.delete(API_SESSION_URL, { session: this.state.session });
    }
}
