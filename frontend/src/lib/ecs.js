export class ComponentInstance {
    constructor(value, tag) {
        this.value = value;
        this.tag = tag;
    }
}

export class EntityInstance {
    constructor(components) {
        this.id = crypto.randomUUID();
        this.components = Object.fromEntries(components
            .map(component => [component.tag, component]));
    }

    has(tag) {
        return tag in this.components;
    }

    get(tag) {
        return this.components[tag]?.value;
    }

    add(component) {
        this.components[component.tag] = component;
    }

    remove(tag) {
        this.components[tag] = undefined;
    }
}

export class Engine {
    constructor(context) {
        this.entities = new Map();
        this.systems  = new Map();
        this.context  = context || { };

        this.entitiesToRemove = new Set();
    }

    addEntity(entity) {
        if (!this.entities.has(entity.id)) {
            this.entities.set(entity.id, entity);
            this.systems
                .forEach(system => {
                    system.entityAdded?.(entity);
                });
        }
    }

    removeEntity(id) {
        if (this.entities.has(id)) {
            this.entitiesToRemove.add(this.entities.get(id));
        }
    }

    getEntities(predicate) {
        return [...this.entities.values()].filter(entity => predicate(entity));
    }

    addSystem(system) {
        this.systems.set(system.id, system);
    }

    update(time, delta) {
        this.systems
            .forEach(system => {
                system.process?.(this, time, delta);
            });
        this._flushEntitiesToRemove();
    }

    _flushEntitiesToRemove() {
        if (this.entitiesToRemove.size === 0) return;

        this.entitiesToRemove
            .forEach(entity => {
                this.entities.delete(entity.id);
                this.systems.forEach(system => {
                    system.entityRemoved?.(entity);
                });
            });
        this.entitiesToRemove.clear();
    }

    launch() {
        this.runnnig = true;

        let timestamp = performance.now();
        const frame = time => {
            this.update(time, time - timestamp);
            timestamp = time;

            if (this.runnnig) {
                requestAnimationFrame(frame);
            }
        };

        this.systems.forEach(system => system.init?.(this));
        requestAnimationFrame(frame);
    }

    dispose() {
        this.runnnig = false;
        this.systems.forEach(system => system.dispose?.(this));
    }
}

export function Component({ schema, tag }) {
    return (...args) => new ComponentInstance(schema?.(...args), tag);
}

export function Entity(schema) {
    return (...args) => new Proxy(new EntityInstance(schema(...args)), {
        set(target, prop, value) {
            if (prop in target) {
                target[prop] = value;
                return true;
            }

            target.components.set(prop, value);
            return true;
        },
        get(target, prop) {
            if (typeof prop === 'symbol' || prop.startsWith?.('__v_') || prop in target) {
                return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
            }
            return target.get(prop);
        }
    });
}
