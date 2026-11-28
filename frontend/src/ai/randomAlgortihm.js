import { validateBoundary } from '../game/gameState.js';

const pointKey = ({ x, y }) => `${x},${y}`;

function getEmptyPoints(board, color) {
    if (!Array.isArray(board) || board.length === 0
        || !['B', 'R'].includes(color)) {
        throw new Error('A board and a valid player color are required.');
    }

    const size = board.length;
    if (board.some(row => typeof row !== 'string' || row.length !== size
        || [...row].some(cell => !['.', 'B', 'R'].includes(cell)))) {
        throw new Error('The board must be a square array of game rows.');
    }

    const emptyPoints = [];
    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            if (board[y][x] === '.') emptyPoints.push({ x, y });
        }
    }

    if (emptyPoints.length === 0) {
        throw new Error('There are no legal points to place.');
    }
    return emptyPoints;
}

function chooseRandom(points) {
    return points[Math.floor(Math.random() * points.length)];
}

function boundaryArea(boundary) {
    let area = 0;
    for (let i = 0; i < boundary.length; i += 1) {
        const current = boundary[i];
        const next = boundary[(i + 1) % boundary.length];
        area += current.x * next.y - next.x * current.y;
    }
    return Math.abs(area / 2);
}

export function findLegalBoundary(state, color, requiredPoint = null) {
    const points = [];
    for (let y = 0; y < state.board.length; y += 1) {
        for (let x = 0; x < state.board[y].length; x += 1) {
            if (state.board[y][x] === color) points.push({ x, y });
        }
    }

    const pointIndexes = new Map(points.map((point, index) => [pointKey(point), index]));
    const neighbors = points.map((point, index) => points
        .map((candidate, candidateIndex) => ({
            point: candidate,
            index: candidateIndex,
            distance: Math.max(
                Math.abs(candidate.x - point.x),
                Math.abs(candidate.y - point.y)
            )
        }))
        .filter(candidate => candidate.index !== index && candidate.distance === 1)
        .map(candidate => candidate.index));

    const requiredKey = requiredPoint ? pointKey(requiredPoint) : null;
    if (requiredKey && !pointIndexes.has(requiredKey)) return [];

    const boundaries = [];
    const visited = new Set();
    const path = [];
    let checksRemaining = 20_000;

    function search(startIndex, currentIndex) {
        if (checksRemaining <= 0 || boundaries.length >= 64) return;
        checksRemaining -= 1;

        for (const nextIndex of neighbors[currentIndex]) {
            if (nextIndex === startIndex) {
                if (path.length < 3
                    || (requiredKey && !visited.has(requiredKey))
                    || pointIndexes.get(pointKey(path[1])) > pointIndexes.get(pointKey(path[path.length - 1]))) {
                    continue;
                }
                if (!validateBoundary(state, path)) {
                    boundaries.push(path.map(point => ({ ...point })));
                }
                continue;
            }

            if (nextIndex <= startIndex || visited.has(pointKey(points[nextIndex]))) continue;
            visited.add(pointKey(points[nextIndex]));
            path.push(points[nextIndex]);
            search(startIndex, nextIndex);
            path.pop();
            visited.delete(pointKey(points[nextIndex]));
            if (checksRemaining <= 0 || boundaries.length >= 64) return;
        }
    }

    for (let startIndex = 0; startIndex < points.length; startIndex += 1) {
        visited.clear();
        path.length = 0;
        path.push(points[startIndex]);
        visited.add(pointKey(points[startIndex]));
        search(startIndex, startIndex);
        if (checksRemaining <= 0 || boundaries.length >= 64) break;
    }

    return boundaries;
}

export function chooseBoundary(boundaries, difficulty) {
    if (boundaries.length === 0) return null;
    if (difficulty !== 'hard') return chooseRandom(boundaries);

    return boundaries.reduce((best, boundary) =>
        boundaryArea(boundary) > boundaryArea(best) ? boundary : best);
}

export function randomDecision(board, color) {
    return chooseRandom(getEmptyPoints(board, color));
}

export function hardDecision(board, color) {
    const emptyPoints = getEmptyPoints(board, color);
    const opponent = color === 'B' ? 'R' : 'B';
    const scores = emptyPoints.map(point => {
        let ownNeighbors = 0;
        let opponentNeighbors = 0;
        const nearbyOwnPoints = [];

        for (let y = Math.max(0, point.y - 1); y <= Math.min(board.length - 1, point.y + 1); y += 1) {
            for (let x = Math.max(0, point.x - 1); x <= Math.min(board.length - 1, point.x + 1); x += 1) {
                if (x === point.x && y === point.y) continue;
                if (board[y][x] === color) {
                    ownNeighbors += 1;
                    nearbyOwnPoints.push({ x, y });
                } else if (board[y][x] === opponent) {
                    opponentNeighbors += 1;
                }
            }
        }

        let closesTriangle = false;
        for (let i = 0; i < nearbyOwnPoints.length && !closesTriangle; i += 1) {
            for (let j = i + 1; j < nearbyOwnPoints.length; j += 1) {
                const a = nearbyOwnPoints[i];
                const b = nearbyOwnPoints[j];
                const cross = (a.x - point.x) * (b.y - point.y)
                    - (a.y - point.y) * (b.x - point.x);
                const adjacent = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1;
                if (adjacent && cross !== 0) {
                    closesTriangle = true;
                    break;
                }
            }
        }

        const center = (board.length - 1) / 2;
        const centerDistance = Math.abs(point.x - center) + Math.abs(point.y - center);
        return {
            point,
            score: ownNeighbors * 3
                + opponentNeighbors
                + (closesTriangle ? 6 : 0)
                - centerDistance * 0.05
        };
    });

    const bestScore = Math.max(...scores.map(candidate => candidate.score));
    return chooseRandom(scores
        .filter(candidate => candidate.score === bestScore)
        .map(candidate => candidate.point));
}
