import client from "../axios.js";

export const API_SESSION_URL = '/api/session';

export function useSessionSevice() {
    async function waiting({ size = 20, page = 0 } = { }) {
        const response = await client.get(`${API_SESSION_URL}/waiting`, {
            params: { size, page },
        });
        return response.data;
    }

    async function get(id) {
        const response = await client.get(`${API_SESSION_URL}/${id}`);
        return response.data;
    }

    async function active() {
        const response = await client.get(`${API_SESSION_URL}/active`);
        return response.data;
    }

    async function join(session) {
        const response = await client.post(`${API_SESSION_URL}/${session}/join`);
        return response.data;
    }

    async function create({ size, name, timerLimit = 300000 } = { }) {
        const response = await client.post(API_SESSION_URL, { size, name, timerLimit });
        return response.data;
    }

    async function move(id, board) {
        const response = await client.post(`${API_SESSION_URL}/${id}/move`, { board });
        return response.data;
    }

    async function offer(id) {
        const response = await client.post(`${API_SESSION_URL}/${id}/offer`);
        return response.data;
    }

    return { waiting, active, get, join, create, move, offer };
}