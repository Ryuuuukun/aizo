import client from '@/api/axios.js';
import { ref } from 'vue';

const API_AUTH_URL = '/api/auth';

export function useAuthService() {
    const loading = ref(false);

    async function execute(request) {
        loading.value = true;
        const response = await request();
        loading.value = false;

        return response;
    }

    async function me() {
        return execute(async () => {
            return (await client.get(`${API_AUTH_URL}/me`)).data;
        });
    }

    return { me };
}
