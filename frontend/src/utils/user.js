export function displayName(user) {
    if (!user) return '—'
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    return full || user.username || user.id || 'Игрок'
}