
export function resolvePlayerColor(session, userId) {
    if (!session || !userId) return null
    if (session.creator?.keycloak === userId) return 'B'
    if (session.opponent?.keycloak === userId) return 'R'
    return null
}

export function resolveTurnColor(session) {
    if (!session?.turnPlayer) return null
    return resolvePlayerColor(session, session.turnPlayer.id)
}

export function displayNameFromUser(user, authUser = null) {
    if (!user) return '—'

    if (authUser && authUser.id === user.id) {
        const full = [authUser.firstName, authUser.lastName]
            .filter(Boolean)
            .join(' ')
            .trim()
        return full || authUser.username || authUser.id?.slice(0, 8) || 'Игрок'
    }

    return user.id?.slice(0, 8) || 'Игрок'
}