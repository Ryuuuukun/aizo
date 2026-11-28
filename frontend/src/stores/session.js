import { ref } from 'vue';
import { useMessage } from 'naive-ui';

import { socket } from "@/api/websocket.js";
import client from "@/api/axios.js";

const API_SESSION_URL = '/api/session';

export function useSession() {
    const session = ref(null);
    const subscribe = ref(null);
    const listeners = new Map();

    const message = useMessage();

    async function load(id) {
        clear();
        const response = await client.get(`${API_SESSION_URL}/${id}`);
        _initSession(response.data);   
    }

    async function join(id) {
        clear();
        const response = await client.post(`${API_SESSION_URL}/${id}/join`);
        _initSession(response.data);
    }

    async function offer() {
        if (session.value !== null) {
            const response = await client.post(`${API_SESSION_URL}/${session.value.id}/offer`);
            session.value = response.data;
        } else {
            message.error('Вы не подключены к сессии');
        }
    }

    async function move(request) {
        if (session.value !== null) {
            const response = await client.post(`${API_SESSION_URL}/${session.value.id}/move`, request);
            session.value = response.data;
        } else {
            message.error('Вы не подключены к сессии');
        }
    }

    function clear() {
        listeners.clear();
        session.value = null;
        subscribe.value?.unsubscribe();
        subscribe.value = null;
    }

    function listener(event, callback) {
        listeners.set(event, callback);
    }

    function _initSession(_session) {
        session.value = _session;
        subscribe.value = socket.subscribe('/user/queue/session', event => {
            const response = JSON.parse(event.body);
            session.value = response.payload;

            const callback = listeners.get(response.type);
            if (callback) {
                callback(response.type, session.value);
            }
        });
    }

    return { session, load, join, offer, move, clear, listener };
}