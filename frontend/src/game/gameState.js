import { solve } from './gameAlgorithm.js';

const PLAYERS = ['B', 'R'];

const isInsideBoard = (state, point) =>
    Number.isInteger(point.x)
    && Number.isInteger(point.y)
    && point.x >= 0
    && point.y >= 0
    && point.x <= state.size
    && point.y <= state.size;

const pointKey = ({ x, y }) => `${x},${y}`;

const boardPoint = (state, { x, y }) => state.board[y][x];

const signedArea = boundary => {
    let area = 0;
    for (let i = 0; i < boundary.length; i += 1) {
        const current = boundary[i];
        const next = boundary[(i + 1) % boundary.length];
        area += current.x * next.y - next.x * current.y;
    }
    return area / 2;
};

const pointLocation = (point, boundary) => {
    let inside = false;
    for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i, i += 1) {
        const a = boundary[j];
        const b = boundary[i];
        const crossProduct = (b.x - a.x) * (point.y - a.y)
            - (b.y - a.y) * (point.x - a.x);
        if (crossProduct === 0
            && point.x >= Math.min(a.x, b.x)
            && point.x <= Math.max(a.x, b.x)
            && point.y >= Math.min(a.y, b.y)
            && point.y <= Math.max(a.y, b.y)) return 0;

        const crosses = (a.y > point.y) !== (b.y > point.y)
            && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
        if (crosses) inside = !inside;
    }
    return inside ? 1 : -1;
};

const getSolverData = (state, boundary) => ({
    N: state.size,
    board: state.board,
    territories: state.territories.map(territory =>
        territory.boundary.map(({ x, y }) => [x, y])),
    newBoundary: boundary.map(({ x, y }) => [x, y])
});

export function createGame(size = 8) {
    if (!Number.isInteger(size) || size < 4 || size > 20) {
        throw new Error('Размер поля должен быть от 4 до 20.');
    }

    return {
        size,
        board: Array.from({ length: size + 1 }, () => '.'.repeat(size + 1)),
        territories: [],
        currentPlayer: 'B',
        status: 'PLAYING',
        pendingMove: null,
        nextTerritoryId: 1,
        winner: null
    };
}

export function validateBoundary(state, boundary) {
    if (boundary.length < 3) return 'Self-intersection';
    if (boundary.some(point =>
        !isInsideBoard(state, point) || !PLAYERS.includes(boardPoint(state, point)))) {
        return 'No point';
    }
    return solve(getSolverData(state, boundary)).error;
}

export function placePoint(state, x, y) {
    if (state.status !== 'PLAYING' || state.pendingMove) {
        throw new Error('Сначала завершите или отмените текущий ход.');
    }
    const point = { x, y };
    if (!isInsideBoard(state, point)) throw new Error('Точка находится за пределами поля.');
    if (boardPoint(state, point) !== '.') throw new Error('Это пересечение уже занято.');

    const board = state.board.slice();
    board[y] = `${board[y].slice(0, x)}${state.currentPlayer}${board[y].slice(x + 1)}`;
    return { ...state, board, pendingMove: { kind: 'point', point } };
}

export function finishPointTurn(state) {
    if (state.pendingMove?.kind !== 'point') {
        throw new Error('Нет незавершённой постановки точки.');
    }
    return finishIfNoMoves({
        ...state,
        currentPlayer: state.currentPlayer === 'B' ? 'R' : 'B',
        pendingMove: null
    });
}

export function beginBoundary(state, x, y) {
    if (state.status !== 'PLAYING') throw new Error('Игра уже завершена.');
    const point = { x, y };
    if (!isInsideBoard(state, point) || boardPoint(state, point) !== state.currentPlayer) {
        throw new Error('Начать стену можно только со своей точки.');
    }
    if (state.pendingMove?.kind === 'point'
        && pointKey(state.pendingMove.point) !== pointKey(point)) {
        throw new Error('Начните стену с только что поставленной точки.');
    }
    if (state.pendingMove && state.pendingMove.kind !== 'point') {
        throw new Error('Стена уже строится.');
    }

    return {
        ...state,
        pendingMove: {
            kind: 'boundary',
            path: [point],
            newPoint: state.pendingMove?.kind === 'point' ? point : null
        }
    };
}

export function extendBoundary(state, x, y) {
    const move = state.pendingMove;
    if (move?.kind !== 'boundary') throw new Error('Сначала выберите начало стены.');
    const point = { x, y };
    if (!isInsideBoard(state, point) || boardPoint(state, point) !== state.currentPlayer) {
        throw new Error('Стена может проходить только через свои точки.');
    }

    if (pointKey(point) === pointKey(move.path[0])) {
        const error = validateBoundary(state, move.path);
        if (error) throw new Error(`Некорректная стена: ${error}.`);
        return captureTerritory(state, move.path, move.newPoint);
    }

    const previous = move.path[move.path.length - 1];
    if (Math.max(Math.abs(previous.x - point.x), Math.abs(previous.y - point.y)) !== 1) {
        throw new Error('Следующая точка должна быть соседней.');
    }
    if (move.path.some(item => pointKey(item) === pointKey(point))) {
        throw new Error('Нельзя повторно использовать точку стены.');
    }

    return { ...state, pendingMove: { ...move, path: [...move.path, point] } };
}

function captureTerritory(state, boundary, newPoint) {
    const result = solve(getSolverData(state, boundary));
    const captured = result.captured.map(index => state.territories[index - 1]);
    const capturedIds = new Set(captured.map(territory => territory.id));
    const territories = state.territories.filter(territory => !capturedIds.has(territory.id));
    territories.push({
        id: state.nextTerritoryId,
        owner: state.currentPlayer,
        boundary: boundary.map(point => ({ ...point })),
        area: Math.abs(signedArea(boundary))
    });

    const board = state.board.map(row => row.split(''));
    for (let y = 0; y <= state.size; y += 1) {
        for (let x = 0; x <= state.size; x += 1) {
            const point = { x, y };
            if (board[y][x] !== '.' && board[y][x] !== state.currentPlayer
                && pointLocation(point, boundary) === 1) {
                board[y][x] = state.currentPlayer;
            }
        }
    }

    return finishIfNoMoves({
        ...state,
        board: board.map(row => row.join('')),
        territories,
        pendingMove: null,
        nextTerritoryId: state.nextTerritoryId + 1,
        capturedTerritoryIds: captured.map(territory => territory.id),
        capturedNewPoint: newPoint
    });
}

export function cancelTurn(state) {
    const move = state.pendingMove;
    if (!move) return state;
    let board = state.board;
    const newPoint = move.kind === 'point' ? move.point : move.newPoint;
    if (newPoint) {
        board = state.board.slice();
        const row = board[newPoint.y];
        board[newPoint.y] = `${row.slice(0, newPoint.x)}.${row.slice(newPoint.x + 1)}`;
    }
    return { ...state, board, pendingMove: null };
}

export function finishGame(state) {
    const scores = getScores(state);
    return {
        ...state,
        status: 'FINISHED',
        pendingMove: null,
        winner: scores.B === scores.R ? 'TIE' : scores.B > scores.R ? 'B' : 'R'
    };
}

function finishIfNoMoves(state) {
    if (state.status !== 'PLAYING' || state.board.some(row => row.includes('.'))) {
        return state;
    }
    if (hasLegalBoundary(state)) return state;
    const scores = getScores(state);
    return {
        ...state,
        status: 'FINISHED',
        winner: scores.B === scores.R ? 'TIE' : scores.B > scores.R ? 'B' : 'R'
    };
}

function hasLegalBoundary(state) {
    const points = [];
    for (let y = 0; y <= state.size; y += 1) {
        for (let x = 0; x <= state.size; x += 1) {
            if (state.board[y][x] === state.currentPlayer) points.push({ x, y });
        }
    }

    let checksRemaining = 100_000;
    for (const start of points) {
        const path = [start];
        const visited = new Set([pointKey(start)]);
        const search = current => {
            for (let y = Math.max(0, current.y - 1); y <= Math.min(state.size, current.y + 1); y += 1) {
                for (let x = Math.max(0, current.x - 1); x <= Math.min(state.size, current.x + 1); x += 1) {
                    if (x === current.x && y === current.y) continue;
                    if (state.board[y][x] !== state.currentPlayer) continue;
                    checksRemaining -= 1;
                    if (checksRemaining < 0) return true;
                    const next = { x, y };
                    const key = pointKey(next);
                    if (key === pointKey(start) && path.length >= 3) {
                        if (!validateBoundary(state, path)) return true;
                        continue;
                    }
                    if (visited.has(key)) continue;
                    visited.add(key);
                    path.push(next);
                    if (search(next)) return true;
                    path.pop();
                    visited.delete(key);
                }
            }
            return false;
        };
        if (search(start)) return true;
    }
    return false;
}

export function getScores(state) {
    return state.territories.reduce((scores, territory) => {
        scores[territory.owner] += territory.area ?? Math.abs(signedArea(territory.boundary));
        return scores;
    }, { B: 0, R: 0 });
}