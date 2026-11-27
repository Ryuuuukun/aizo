import Keycloak from 'keycloak-js';
import { defineStore } from 'pinia';
import { markRaw } from 'vue';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: undefined,
        token: undefined,
        keycloak: undefined,
        isAuthenticated: false,
        isInitialized: false
    }),
    actions: {
        async initAuth() {
            const instance = new Keycloak({
                url: 'http://localhost:8070',
                realm: 'aizo',
                clientId: 'aizo frontend'
            });

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
                const authenticated = await instance.init({
                    // onLoad: 'check-sso',
                    // silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
                    checkLoginIframe: false
                });

                this.keycloak = markRaw(instance);
                this.isAuthenticated = authenticated;

                if (authenticated) {
                    this.token = instance.token;
                    this.user = await instance.loadUserProfile();
                }
            } catch (error) {
                console.error('Exception initialization Keycloak:', error);
            }
        },
        login(options = {}) {
            this.keycloak?.login(options);
        },
        logout() {
            this.keycloak?.logout({ redirectUri: window.location.origin });
        }
    }
});
