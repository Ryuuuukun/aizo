import { parseGameData } from './parseGameData.js';

const EPS = 1e-9;

function cross(a, b, c) {
    return (b.x - a.x) * (c.y - a.y)
         - (b.y - a.y) * (c.x - a.x);
}

function equalPoints(a, b) {
    return a.x === b.x && a.y === b.y;
}

function sign(v) {
    if (v > 0) return 1;
    if (v < 0) return -1;
    return 0;
}

function neighbors(a, b) {
    return Math.max(
        Math.abs(a.x - b.x),
        Math.abs(a.y - b.y)
    ) === 1;
}

function onSegment(p, a, b) {
    return cross(a, b, p) === 0 &&
        p.x >= Math.min(a.x, b.x) &&
        p.x <= Math.max(a.x, b.x) &&
        p.y >= Math.min(a.y, b.y) &&
        p.y <= Math.max(a.y, b.y);
}

function segmentsIntersect(a, b, c, d) {
    const c1 = cross(a, b, c);
    const c2 = cross(a, b, d);
    const c3 = cross(c, d, a);
    const c4 = cross(c, d, b);

    if (c1 === 0 && onSegment(c, a, b)) return true;
    if (c2 === 0 && onSegment(d, a, b)) return true;
    if (c3 === 0 && onSegment(a, c, d)) return true;
    if (c4 === 0 && onSegment(b, c, d)) return true;

    return sign(c1) * sign(c2) < 0 &&
           sign(c3) * sign(c4) < 0;
}

function selfIntersection(poly) {
    const n = poly.length;
    const used = new Set();

    for (const point of poly) {
        const key = point.x + ',' + point.y;

        if (used.has(key)) {
            return true;
        }

        used.add(key);
    }

    for (let i = 0; i < n; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % n];

        for (let j = i + 1; j < n; j++) {

            if (j === i + 1) continue;
            if (i === 0 && j === n - 1) continue;

            const c = poly[j];
            const d = poly[(j + 1) % n];

            if (segmentsIntersect(a, b, c, d)) {
                return true;
            }
        }
    }

    return false;
}

function sameBoundary(a, b) {
    const n = a.length;

    if (b.length !== n) {
        return false;
    }

    for (let start = 0; start < n; start++) {
        let forward = true;
        let backward = true;

        for (let i = 0; i < n; i++) {
            if (!equalPoints(
                a[i],
                b[(start + i) % n]
            )) {
                forward = false;
            }

            const index = (start - i + n) % n;

            if (!equalPoints(a[i], b[index])) {
                backward = false;
            }
        }

        if (forward || backward) {
            return true;
        }
    }

    return false;
}

function pointInPolygon(x, y, poly) {
    let inside = false;
    const n = poly.length;

    for (let i = 0; i < n; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % n];

        const px = x - a.x;
        const py = y - a.y;

        const dx = b.x - a.x;
        const dy = b.y - a.y;

        const cr = dx * py - dy * px;
        if (
            Math.abs(cr) < EPS &&
            x >= Math.min(a.x, b.x) - EPS &&
            x <= Math.max(a.x, b.x) + EPS &&
            y >= Math.min(a.y, b.y) - EPS &&
            y <= Math.max(a.y, b.y) + EPS
        ) {
            return 2;
        }
        if ((a.y > y) !== (b.y > y)) {
            const intersectionX =
                a.x + (b.x - a.x) *
                (y - a.y) / (b.y - a.y);

            if (intersectionX > x) {
                inside = !inside;
            }
        }
    }

    return inside ? 1 : 0;
}

function getBreakpoints(a, b, poly) {
    const rx = b.x - a.x;
    const ry = b.y - a.y;

    const rr = rx * rx + ry * ry;

    const result = [0, 1];

    for (let i = 0; i < poly.length; i++) {
        const c = poly[i];
        const d = poly[(i + 1) % poly.length];

        const sx = d.x - c.x;
        const sy = d.y - c.y;

        const qx = c.x - a.x;
        const qy = c.y - a.y;

        const denominator = rx * sy - ry * sx;

        if (Math.abs(denominator) > EPS) {

            const t =
                (qx * sy - qy * sx) / denominator;

            const u =
                (qx * ry - qy * rx) / denominator;

            if (
                t >= -EPS && t <= 1 + EPS &&
                u >= -EPS && u <= 1 + EPS
            ) {
                result.push(Math.max(0, Math.min(1, t)));
            }

        } else if (
            Math.abs(qx * ry - qy * rx) < EPS
        ) {
            const tc = (qx * rx + qy * ry) / rr;

            const dx = d.x - a.x;
            const dy = d.y - a.y;

            const td = (dx * rx + dy * ry) / rr;

            if (tc >= -EPS && tc <= 1 + EPS) {
                result.push(Math.max(0, Math.min(1, tc)));
            }

            if (td >= -EPS && td <= 1 + EPS) {
                result.push(Math.max(0, Math.min(1, td)));
            }
        }
    }

    result.sort((a, b) => a - b);

    const unique = [];

    for (const t of result) {
        if (
            unique.length === 0 ||
            Math.abs(t - unique[unique.length - 1]) > EPS
        ) {
            unique.push(t);
        }
    }

    return unique;
}

function boundaryInside(a, b) {
    const n = a.length;

    for (let i = 0; i < n; i++) {
        const u = a[i];
        const v = a[(i + 1) % n];

        const ts = getBreakpoints(u, v, b);

        for (const t of ts) {
            const x = u.x + (v.x - u.x) * t;
            const y = u.y + (v.y - u.y) * t;

            if (pointInPolygon(x, y, b) === 1) {
                return true;
            }
        }

        for (let j = 0; j + 1 < ts.length; j++) {
            const t = (ts[j] + ts[j + 1]) / 2;

            const x = u.x + (v.x - u.x) * t;
            const y = u.y + (v.y - u.y) * t;

            if (pointInPolygon(x, y, b) === 1) {
                return true;
            }
        }
    }

    return false;
}

function territoryInside(a, b) {
    let hasInside = false;

    const n = a.length;

    for (let i = 0; i < n; i++) {
        const u = a[i];
        const v = a[(i + 1) % n];

        const ts = getBreakpoints(u, v, b);

        for (const t of ts) {
            const x = u.x + (v.x - u.x) * t;
            const y = u.y + (v.y - u.y) * t;

            const state = pointInPolygon(x, y, b);

            if (state === 0) {
                return false;
            }

            if (state === 1) {
                hasInside = true;
            }
        }

        for (let j = 0; j + 1 < ts.length; j++) {
            const t = (ts[j] + ts[j + 1]) / 2;

            const x = u.x + (v.x - u.x) * t;
            const y = u.y + (v.y - u.y) * t;

            const state = pointInPolygon(x, y, b);

            if (state === 0) {
                return false;
            }

            if (state === 1) {
                hasInside = true;
            }
        }
    }

    return hasInside;
}


function solve(gameData) {
    const { N, board, territories, p } = parseGameData(gameData);
    const M = p.length;
    const K = territories.length;

    for (let i = 0; i < M; i++) {
        if (!neighbors(p[i], p[(i + 1) % M])) {
            return {
                valid: false,
                error: 'Not neighbors',
                captured: []
            };
        }
    }

    for (const point of p) {
        if (board[point.y][point.x] === '.') {
            return {
                valid: false,
                error: 'No point',
                captured: []
            };
        }
    }

    const color = board[p[0].y][p[0].x];

    for (const point of p) {
        if (board[point.y][point.x] !== color) {
            return {
                valid: false,
                error: 'Different colors',
                captured: []
            };
        }
    }

    if (selfIntersection(p)) {
        return {
            valid: false,
            error: 'Self-intersection',
            captured: []
        };
    }

    for (const territory of territories) {
        if (sameBoundary(p, territory)) {
            return {
                valid: false,
                error: 'Duplicate',
                captured: []
            };
        }
    }

    for (const territory of territories) {
        if (boundaryInside(p, territory)) {
            return {
                valid: false,
                error: 'Inside',
                captured: []
            };
        }
    }

    const captured = [];

    for (let i = 0; i < K; i++) {
        if (territoryInside(territories[i], p)) {
            captured.push(i + 1);
        }
    }

    return {
        valid: true,
        error: null,
        captured: captured
    };
}

export { solve };