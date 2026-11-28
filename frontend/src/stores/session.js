import { onScopeDispose, readonly, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useSessionSevice } from '@/api/services/session'
import { socket } from '@/api/websocket.js'

export function useSession() {
    const session = ref(null)
    const loading = ref(false)
    const message = useMessage()
    const service = useSessionSevice()
    let subscription = null
    let sessionId = null

    function applySession(nextSession) {
        if (nextSession?.id === sessionId) session.value = nextSession
    }

    async function connect(id) {
        clear()
        sessionId = id
        loading.value = true
        try {
            await socket.connect()
            subscription = socket.subscribe('/user/queue/session', event => {
                try {
                    const response = JSON.parse(event.body)
                    applySession(response.payload)
                } catch (error) {
                    console.error('Unable to process session update', error)
                    message.error('Не удалось обработать обновление игры')
                }
            })
            applySession(await service.get(id))
        } finally {
            loading.value = false
        }
    }

    async function move(board) {
        if (!session.value) throw new Error('Сессия ещё не загружена')
        applySession(await service.move(session.value.id, board))
    }

    async function offer() {
        if (!session.value) throw new Error('Сессия ещё не загружена')
        applySession(await service.offer(session.value.id))
    }

    function clear() {
        subscription?.unsubscribe()
        subscription = null
        sessionId = null
        session.value = null
    }

    onScopeDispose(clear)

    return {
        session: readonly(session),
        loading: readonly(loading),
        connect,
        move,
        offer,
        clear,
    }
}
