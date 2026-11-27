import { Component } from "./ecs";

export const Meta = Component({ schema: obj => ({ ...obj }), tag: 'meta' });

export const Drawable = Component({ schema: (callback, zindex) => ({ callback, zindex }), tag: 'drawable' });

export class DrawSystem {
    constructor() {
        this.id = 'draw-system';
        this.native = false;
    }

    process(engine, time, delta) {
        const ctx = engine.context.ctx;
        const cnv = engine.context.cnv;

        ctx.resetTransform();
        ctx.clearRect(0, 0, cnv.width, cnv.height);

        engine.getEntities(e => e.has('drawable'))
            .sort((a, b) => a.drawable.zindex - b.drawable.zindex)
            .forEach(entity => {
                entity.drawable.callback(ctx, cnv, entity, time, delta);
            });
    }
}

export const Position = Component({ schema: (x, y) => ({ x, y }), tag: 'position' });
export const Size = Component({ schema: (x, y) => ({ x, y }), tag: 'size' });

export const Shape = Component({ schema: callback => ({ callback }), tag: 'shape' });
export const CircleShape = () => Shape((entity, event) => {
    const pos = entity.position;
    const size = entity.size;

    const dx = pos.x - event.mouseX;
    const dy = pos.y - event.mouseY;

    return dx * dx + dy * dy <= size.x * size.x / 4;
});

const EventCallback = tag => Component({ schema: callback => ({ callback }), tag });
const EventState = tag => Component({ schema: (index = 0) => ({ state: false, index }), tag });

export const Click = EventCallback('click');
export const ClickOn = EventCallback('click-on');
export const ClickOff = EventCallback('click-off');

export const Hover = EventState('hover');
export const HoverOn = EventCallback('hover-on');
export const HoverOff = EventCallback('hover-off');

export function convertCoordinates(canvas, x, y) {
    const rect = canvas.getBoundingClientRect();
    return { x: x - rect.left, y: y - rect.top };
}

export class EventSystem {
    constructor() {
        this.id = 'event-system';
        this.native = true;
    }

    init(engine) {
        const context = engine.context;
        const cnv = engine.context.cnv;

        this.controller = new AbortController();

        // click event
        this.clickable = [];
        cnv.addEventListener('mousedown', event => {
            if (!context.canClick) return;

            const { x, y } = convertCoordinates(canvas, event.clientX, event.clientY);
            event.mouseX = x;
            event.mouseY = y;

            const entity = this.clickable
                .find(entity => entity.shape.callback(entity, event));
            if (entity) {
                entity.click.callback(entity, event);
            }
        }, { signal: this.controller.signal });

        // hover event
        this.hoverable = [];
        cnv.addEventListener('mousemove', event => {
            if (!context.canHover) return;

            const { x, y } = convertCoordinates(canvas, event.clientX, event.clientY);
            event.mouseX = x;
            event.mouseY = y;

            this.hoverable
                .forEach(entity => {
                    const inside = entity.shape.callback(entity, event);
                    if (inside !== entity.hover.state) {
                        entity.hover.state = inside;
                        entity.get(inside ? 'hover-on' : 'hover-off')?.callback(entity, event);
                    }
                });
        }, { signal: this.controller.signal });
    }

    dispose() {
        this.controller.abort();
    }

    entityAdded(entity) {
        if (entity.has('position') && entity.has('size') && entity.has('shape')) {
            if (entity.has('click')) this.clickable.push(entity);
            if (entity.has('hover')) this.hoverable.push(entity);
        }
    }

    entityRemoved(entity) {
        this.clickable = this.clickable.filter(e => e !== entity);
        this.hoverable = this.hoverable.filter(e => e !== entity);
    }
}
