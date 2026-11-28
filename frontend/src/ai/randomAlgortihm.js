import {
    beginBoundary,
    extendBoundary,
    finishPointTurn,
    getScores,
    placePoint,
    validateBoundary
} from '../game/gameState.js';

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
    if (!['hard', 'monte-carlo', 'monteCarlo', 'expert'].includes(difficulty)) {
        return chooseRandom(boundaries);
    }

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

function completeBoundary(state, boundary) {
    let orderedBoundary = boundary;
    if (state.pendingMove?.kind === 'point') {
        const startIndex = boundary.findIndex(point =>
            point.x === state.pendingMove.point.x
            && point.y === state.pendingMove.point.y
        );
        if (startIndex >= 0) {
            orderedBoundary = [
                ...boundary.slice(startIndex),
                ...boundary.slice(0, startIndex)
            ];
        }
    }

    let next = beginBoundary(state, orderedBoundary[0].x, orderedBoundary[0].y);
    for (const point of orderedBoundary.slice(1)) {
        next = extendBoundary(next, point.x, point.y);
    }
    return extendBoundary(next, orderedBoundary[0].x, orderedBoundary[0].y);
}

function copyState(state) {
    return {
        ...state,
        board: state.board.slice(),
        territories: state.territories.map(territory => ({
            ...territory,
            boundary: territory.boundary.map(point => ({ ...point }))
        })),
        pendingMove: state.pendingMove ? {
            ...state.pendingMove,
            path: state.pendingMove.path?.map(point => ({ ...point }))
        } : null
    };
}

function getActions(state) {
    if (state.status !== 'PLAYING') return [];

    if (state.pendingMove?.kind === 'point') {
        const point = state.pendingMove.point;
        const boundaries = findLegalBoundary(state, state.currentPlayer, point)
            .slice(0, 6);
        return [
            ...boundaries.map(boundary => ({ type: 'boundary', boundary })),
            { type: 'finish' }
        ];
    }

    const existingBoundaries = findLegalBoundary(state, state.currentPlayer).slice(0, 6);
    const actions = existingBoundaries.map(boundary => ({
        type: 'boundary',
        boundary
    }));

    let emptyPoints = [];
    try {
        emptyPoints = getEmptyPoints(state.board, state.currentPlayer);
    } catch {
        return actions;
    }
    return [
        ...actions,
        ...emptyPoints.map(point => ({ type: 'point', point }))
    ];
}

function applyAction(state, action) {
    if (action.type === 'boundary') {
        return completeBoundary(state, action.boundary);
    }
    if (action.type === 'finish') {
        return finishPointTurn(state);
    }
    if (action.type === 'point') {
        return placePoint(state, action.point.x, action.point.y);
    }
    return state;
}

function rolloutAction(state) {
    const actions = getActions(state);
    if (actions.length === 0) return null;

    const boundaries = actions.filter(action => action.type === 'boundary');
    if (boundaries.length > 0) {
        if (state.pendingMove?.kind === 'point' && Math.random() < 0.7) {
            return boundaries.reduce((best, action) =>
                boundaryArea(action.boundary) > boundaryArea(best.boundary) ? action : best
            );
        }
        if (!state.pendingMove && Math.random() < 0.75) {
            return boundaries.reduce((best, action) =>
                boundaryArea(action.boundary) > boundaryArea(best.boundary) ? action : best
            );
        }
    }

    const points = actions.filter(action => action.type === 'point');
    if (points.length > 0) {
        if (Math.random() < 0.45) {
            let best = null;
            let bestScore = -Infinity;
            const candidates = points.length > 4
                ? [...points].sort(() => Math.random() - 0.5).slice(0, 4)
                : points;
            for (const action of candidates) {
                const placed = placePoint(copyState(state), action.point.x, action.point.y);
                const closing = findLegalBoundary(placed, state.currentPlayer, action.point);
                let ownNeighbors = 0;
                for (let y = Math.max(0, action.point.y - 1); y <= Math.min(state.size, action.point.y + 1); y += 1) {
                    for (let x = Math.max(0, action.point.x - 1); x <= Math.min(state.size, action.point.x + 1); x += 1) {
                        if (x !== action.point.x || y !== action.point.y) {
                            if (state.board[y][x] === state.currentPlayer) ownNeighbors += 1;
                        }
                    }
                }
                const score = closing.reduce(
                    (area, boundary) => Math.max(area, boundaryArea(boundary)),
                    0
                ) * 20 + ownNeighbors * 2;
                if (score > bestScore) {
                    best = action;
                    bestScore = score;
                }
            }
            return best ?? chooseRandom(points);
        }
        return chooseRandom(points);
    }

    const finishes = actions.filter(action => action.type === 'finish');
    if (finishes.length > 0) return finishes[0];
    return chooseRandom(actions);
}

function terminalReward(state, rootColor) {
    const scores = getScores(state);
    if (state.status === 'FINISHED') {
        const opponent = rootColor === 'B' ? 'R' : 'B';
        if (scores[rootColor] > scores[opponent]) return 1000 + scores[rootColor] - scores[opponent];
        if (scores[rootColor] < scores[opponent]) return -1000 + scores[rootColor] - scores[opponent];
        return 0;
    }
    const opponent = rootColor === 'B' ? 'R' : 'B';
    return (scores[rootColor] - scores[opponent]) * 100
        + [...state.board.join('')].filter(point => point === rootColor).length
        - [...state.board.join('')].filter(point => point === opponent).length;
}

function cloneAndRollout(startState, rootColor, maxMoves) {
    let state = copyState(startState);

    for (let move = 0; move < maxMoves && state.status === 'PLAYING'; move += 1) {
        const action = rolloutAction(state);
        if (!action) break;
        state = applyAction(state, action);
    }
    return terminalReward(state, rootColor);
}

export function monteCarloDecision(stateOrBoard, color, iterations = null) {
    const state = Array.isArray(stateOrBoard)
        ? {
            size: stateOrBoard.length - 1,
            board: stateOrBoard.slice(),
            territories: [],
            currentPlayer: color,
            boundaryFollowUpUsed: false,
            status: 'PLAYING',
            pendingMove: null,
            nextTerritoryId: 1,
            winner: null
        }
        : copyState(stateOrBoard);

    const root = {
        state,
        parent: null,
        action: null,
        children: [],
        untriedActions: getActions(state),
        visits: 0,
        value: 0
    };

    if (root.untriedActions.length === 0) {
        throw new Error('There are no legal moves to search.');
    }
    if (root.untriedActions.length === 1) {
        const onlyAction = root.untriedActions[0];
        return onlyAction.point ?? null;
    }

    const emptyCount = getEmptyPoints(state.board, color).length;
    const iterationCount = iterations ?? Math.min(400, Math.max(160, emptyCount * 4));
    const maxMoves = Math.min(emptyCount + 20, 80);

    for (let iteration = 0; iteration < iterationCount; iteration += 1) {
        let node = root;

        while (node.untriedActions.length === 0 && node.children.length > 0) {
            const logVisits = Math.log(Math.max(1, node.visits));
            node = node.children.reduce((best, candidate) => {
                if (candidate.visits === 0) return candidate;
                if (best.visits === 0) return best;
                const candidateMean = candidate.value / candidate.visits;
                const mean = node.state.currentPlayer === color
                    ? candidateMean
                    : -candidateMean;
                const bestMean = best.value / best.visits;
                const bestCurrentMean = node.state.currentPlayer === color
                    ? bestMean
                    : -bestMean;
                const candidateScore = mean
                    + Math.sqrt(2 * logVisits / candidate.visits);
                const bestScore = bestCurrentMean
                    + Math.sqrt(2 * logVisits / Math.max(1, best.visits));
                return candidateScore > bestScore ? candidate : best;
            });
        }

        if (node.untriedActions.length > 0) {
            const actionIndex = Math.floor(Math.random() * node.untriedActions.length);
            const action = node.untriedActions.splice(actionIndex, 1)[0];
            const childState = copyState(applyAction(copyState(node.state), action));
            const child = {
                state: childState,
                parent: node,
                action,
                children: [],
                untriedActions: getActions(childState),
                visits: 0,
                value: 0
            };
            node.children.push(child);
            node = child;
        }

        const reward = cloneAndRollout(node.state, color, maxMoves);
        while (node) {
            node.visits += 1;
            node.value += reward;
            node = node.parent;
        }
    }

    if (root.children.length === 0) {
        const pointActions = root.untriedActions.filter(action => action.type === 'point');
        return pointActions.length > 0 ? chooseRandom(pointActions).point : null;
    }

    const best = root.children
        .filter(child => child.action.type === 'point')
        .reduce((candidate, current) => {
            if (!candidate) return current;
            if (current.visits !== candidate.visits) {
                return current.visits > candidate.visits ? current : candidate;
            }
            return current.value / current.visits > candidate.value / candidate.visits
                ? current
                : candidate;
        }, null);

    if (best) return best.action.point;
    const pointActions = root.untriedActions.filter(action => action.type === 'point');
    if (pointActions.length > 0) return chooseRandom(pointActions).point;
    return chooseRandom(getEmptyPoints(state.board, color));
}

export const monteCarloTreeSearchDecision = monteCarloDecision;
export const expertDecision = monteCarloDecision;
