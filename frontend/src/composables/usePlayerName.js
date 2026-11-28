import { ref, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const nameCache = new Map()

/**
 * Возвращает имя игрока по UserResponse.
 * Если это текущий пользователь — берёт из authStore.
 * Если нет — из кэша или короткий id (заглушка до появления эндпоинта).
 *
 * @param {Ref<Object|null>} userRef  — UserResponse (реактивный)
 * @param {Function|null} fetcher     — опционально (keycloakId) => Promise<string>
 */
export function usePlayerName(userRef, fetcher = null) {
    const authStore = useAuthStore()
    const cachedName = ref(null)
    const loading = ref(false)

    function resolveLocal(user) {
        if (!user) return null

        if (authStore.user && authStore.user.id === user.keycloak) {
            const full = [authStore.user.firstName, authStore.user.lastName]
                .filter(Boolean)
                .join(' ')
                .trim()
            return full || authStore.user.username || null
        }

        if (user.keycloak && nameCache.has(user.keycloak)) {
            return nameCache.get(user.keycloak)
        }

        return null
    }

    async function tryFetch(user) {
        if (!user?.keycloak || !fetcher) return
        if (nameCache.has(user.keycloak)) {
            cachedName.value = nameCache.get(user.keycloak)
            return
        }
        loading.value = true
        try {
            const name = await fetcher(user.keycloak)
            if (name) {
                nameCache.set(user.keycloak, name)
                cachedName.value = name
            }
        } finally {
            loading.value = false
        }
    }

    const name = computed(() => {
        const user = userRef.value
        if (!user) return '—'

        const local = resolveLocal(user)
        if (local) return local

        if (cachedName.value) return cachedName.value

        return user.id?.slice(0, 8) || 'Игрок'
    })

    watch(
        userRef,
        (user) => {
            cachedName.value = null
            if (!user) return
            const local = resolveLocal(user)
            if (local) return
            tryFetch(user)
        },
        { immediate: true }
    )

    return { name, loading }
}