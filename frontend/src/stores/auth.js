import Keycloak from 'keycloak-js';
import { defineStore } from 'pinia';
import { markRaw } from 'vue';

let initializationPromise = null

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: undefined,
        token: undefined,
        keycloak: undefined,
        isAuthenticated: false,
        isInitialized: false
    }),
    actions: {
        initAuth() {
            if (initializationPromise) return initializationPromise

            const instance = new Keycloak({
                url: `${window.location.origin}/auth`,
                realm: 'aizo',
                clientId: 'aizo frontend'
            });

            this.keycloak = markRaw(instance);
            initializationPromise = this._initialize(instance);
            return initializationPromise
        },
        async _initialize(instance) {
            instance.updateToken = instance.updateToken.bind(instance);
            instance.onTokenExpired = async () => {
                try {
                    const refreshed = await instance.updateToken(30);
                    if (refreshed) {
                        this.token = instance.token;
                    }
                } catch (error) {
                    this.logout();
                }
            };

            try {
                const authenticated = await instance.init({ checkLoginIframe: false });

                this.isAuthenticated = authenticated;

                if (authenticated) {
                    this.token = instance.token;
                    this.user = {
                        id: instance.subject,
                        username: instance.tokenParsed?.preferred_username,
                        email: instance.tokenParsed?.email,
                        firstName: instance.tokenParsed?.given_name,
                        lastName: instance.tokenParsed?.family_name
                    };
                }
            } catch (error) {
                console.error('Exception initialization Keycloak:', error);
                this.isAuthenticated = false;
            } finally {
                this.isInitialized = true;
            }
        },
        async login(options = {}) {
            if (!this.isInitialized) await this.initAuth()
            if (!this.keycloak) throw new Error('Keycloak не инициализирован')
            return this.keycloak.login(options)
        },
        logout() {
            this.keycloak?.logout({ redirectUri: window.location.origin });
        }
    }
});
