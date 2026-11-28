import client from "../axios.js";

export const API_SESSION_URL = '/api/session';

export function useSessionSevice() {
    async function waiting({ size = 20, page = 0 } = { }) {
        const response = await client.get(`${API_SESSION_URL}/waiting?size=${size}&page=${page}`);
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

    async function create({ size, name } = { }) {
        const response = await client.post(API_SESSION_URL, { size, name });
        return response.data;
    }

    return { waiting, active, join, create };
}