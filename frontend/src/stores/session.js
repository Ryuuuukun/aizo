import { defineStore } from 'pinia';

import { socket } from "@/api/websocket.js";
import client from "@/api/axios.js";

const API_SESSION_URL = '/api/session';

export function useSession() {
    const session = ref(null);
    const subscribe = null;

    async function load(session) {
        const response = await client.get(`${API_SESSION_URL}/${session}`);
        _initSession(response.data);   
    }

    async function offer() {
        if (session.value !== null) {
            const response = await client.get(`${API_SESSION_URL}/${session.value.id}/offer`);
            session.value = response.data;
        }
    }

    async function move(request) {
        if (session.value !== null) {
            const response = await client.post(`${API_SESSION_URL}/${session.value.id}/move`, request);
            session.value = response.data;
        }
    }

    function clear() {
        session.value = null;
        subscribe.value?.unsubscribe();
        subscribe.value = null;
    }

    function _initSession(_session) {
        session.value = _session;
        subscribe.value = socket.subscribe('/user/queue/session', event => {
            const response = JSON.parse(event.body);
            this.session = response.payload;

            console.log(response.type, this.session);
        });
    }

    return { load, offer, move, clear };
}