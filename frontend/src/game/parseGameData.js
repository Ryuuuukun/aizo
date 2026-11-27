function parseGameData(data) {
    const toPoint = point => {
        if (Array.isArray(point)) {
            return { x: point[0], y: point[1] };
        }
        return { x: point.x, y: point.y };
    };

    const territories = (data.territories ?? []).map(territory => {
        if (Array.isArray(territory)) {
            return territory.map(toPoint);
        }
        return (territory.boundary ?? []).map(toPoint);
    });

    return {
        N: data.size ?? data.N,
        board: data.board,
        territories,
        p: (data.newBoundary ?? data.boundary ?? []).map(toPoint)
    };
}

export { parseGameData };