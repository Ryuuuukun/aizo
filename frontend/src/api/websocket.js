import SockJS from 'sockjs-client/dist/sockjs.min.js';
import { Client } from "@stomp/stompjs";

class WebSocketService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.subscriptions = new Map();
        this.authTokenProvider = async () => null;
    }

    async connect() {
        if (this.client?.active) {
            return;
        }

        const token = await this.authTokenProvider();
        if (!token) {
            console.warn('STOMP connection aborted: User is not authenticated or token is invalid');
            return;
        }

        this.client = new Client({
            webSocketFactory: () => new SockJS(`${window.location.origin}/ws`),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,
            maxReconnectDelay: 30000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            connectionTimeout: 10000,
            onConnect: () => {
                this.connected = true;
                this.subscriptions.forEach((subscription, topic) =>
                    this._subscribe(topic, subscription));
            },
            onWebSocketClose: () => {
                this.connected = false
            },
            onStompError: (frame) => {
                console.error('STOMP error: ', frame.headers.message);
            },
            beforeConnect: async () => {
                const token = await this.authTokenProvider();
                if (token) {
                    this.client.connectHeaders = {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        });

        console.log('socket connect');

        this.client.activate();
    }

    async disconnect() {
        console.log('socket disconnect');

        this.connected = false;
        if (this.client) {
            await this.client.deactivate();
            this.subscriptions.forEach(subscription => {
                subscription.active = false;
                subscription.subscription?.unsubscribe();
            });
            this.subscriptions.clear();
            this.client = null;
        }
    }

    subscribe(topic, callback) {
        const subscription = { callback, active: true, subscription: null };
        this.subscriptions.set(topic, subscription);
        if (this.connected) this._subscribe(topic, subscription);

        return {
            unsubscribe: () => {
                if (!subscription.active) return;
                subscription.active = false;
                subscription.subscription?.unsubscribe();
                if (this.subscriptions.get(topic) === subscription) {
                    this.subscriptions.delete(topic);
                }
            },
        };
    }

    _subscribe(topic, subscription) {
        if (!subscription.active) return;
        subscription.subscription = this.client.subscribe(topic, message => {
            if (subscription.active) subscription.callback(message);
        });
    }
}

export const socket = new WebSocketService();
