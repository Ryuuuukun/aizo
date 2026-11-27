function parseGameData(data) {
    return {
        N: data.N,
        board: data.board,

        territories: data.territories.map(poly =>
            poly.map(([x, y]) => ({ x, y }))
        ),

        p: data.newBoundary.map(([x, y]) => ({
            x,
            y
        }))
    };
}

export { parseGameData };