export class Environment {
  constructor(parent = null) {
    this.vars = new Map();
    this.parent = parent;
  }
  
  has(name) {
    return this.vars.has(name) || (this.parent && this.parent.has(name));
  }

  get(name) {
    if (this.vars.has(name)) return this.vars.get(name);
    if (this.parent) return this.parent.get(name);
    return undefined;
  }

  set(name, value) {
    this.vars.set(name, value);
  }

  assign(name, value) {
    if (this.vars.has(name)) {
      this.vars.set(name, value);
    } else if (this.parent) {
      this.parent.assign(name, value);
    } else {
      this.vars.set(name, value); // Implicit global or error
    }
  }
}
