import { Environment } from './Environment';
import { parse } from 'acorn';

export class CodeVisualizerEngine {
  constructor(code) {
    this.code = code;
    this.snapshots = [];
    this.callStack = [];
    this.webAPIs = [];
    this.macrotaskQueue = [];
    this.microtaskQueue = [];
    this.consoleLogs = [];
    this.globalEnv = new Environment();
    this.nextTimerId = 1;
    this.currentTime = 0;
    this.eventListeners = new Map();

    this.setupBuiltIns();

    try {
      this.ast = parse(code, { ecmaVersion: 2020, locations: true });
    } catch (e) {
      this.ast = null;
      this.error = e;
    }
  }

  setupBuiltIns() {
    this.globalEnv.set('console', {
      log: (...args) => {
        const text = args.map(a => String(a?.value !== undefined ? a.value : a)).join(' ');
        this.consoleLogs.push(text);
      }
    });

    this.globalEnv.set('setTimeout', (cb, ms) => {
      const id = this.nextTimerId++;
      const timeMs = ms?.value || 0;
      
      this.webAPIs.push({
        id,
        name: `setTimeout (cb, ${timeMs}ms)`,
        triggerTime: this.currentTime + timeMs,
        callback: cb
      });
      
      return { value: id, type: 'number' };
    });

    this.globalEnv.set('Promise', {
      resolve: (val) => {
        return {
          type: 'Promise',
          value: val,
          then: (cb) => {
             this.microtaskQueue.push({
               type: 'Microtask (then)',
               callback: cb,
               arg: val
             });
             return this.globalEnv.get('Promise').resolve(val);
          }
        };
      }
    });

    this.globalEnv.set('fetch', (urlArgs) => {
      return {
        type: 'Promise',
        then: (cb) => {
          const id = this.nextTimerId++;
          this.webAPIs.push({
            id,
            name: `fetch()`,
            triggerTime: this.currentTime + 10, // Simulated network delay
            isFetch: true,
            callback: cb
          });
          return this.globalEnv.get('Promise').resolve({}); 
        }
      };
    });

    this.globalEnv.set('document', {
      getElementById: (idArg) => {
        const elementId = idArg?.value || idArg;
        return {
          type: 'DOMElement',
          id: elementId,
          addEventListener: (eventArg, cb) => {
            const eventName = eventArg?.value || eventArg;
            const key = `${elementId}-${eventName}`;
            if (!this.eventListeners.has(key)) {
               this.eventListeners.set(key, []);
            }
            this.eventListeners.get(key).push(cb);
          }
        };
      }
    });
  }

  serializeEnv(env) {
    const scopes = [];
    let current = env;
    while (current) {
      const scopeData = {};
      for (const [k, v] of current.vars.entries()) {
         if (typeof v === 'function') scopeData[k] = '[Native Function]';
         else if (v && v.type === 'DOMElement') scopeData[k] = `[DOM ${v.id}]`;
         else if (v && v.type === 'Function') scopeData[k] = `[Function: ${v.name}]`;
         else if (v && v.type === 'Promise') scopeData[k] = '[Promise]';
         else if (typeof v === 'object' && v !== null && v.value !== undefined) scopeData[k] = v.value;
         else scopeData[k] = String(v);
      }
      
      let scopeName = 'Closure';
      if (current === this.globalEnv) scopeName = 'Global';
      else if (scopes.length === 0) scopeName = 'Local';
      
      scopes.push({
         name: scopeName,
         vars: scopeData
      });
      current = current.parent;
    }
    return scopes;
  }

  recordSnapshot(node, contextName = 'Global', env = this.globalEnv) {
    if (!node) return;
    this.snapshots.push({
      line: node.loc ? node.loc.start.line : null,
      callStack: JSON.parse(JSON.stringify(this.callStack)),
      webAPIs: JSON.parse(JSON.stringify(this.webAPIs.map(api => api.name))),
      macrotaskQueue: JSON.parse(JSON.stringify(this.macrotaskQueue.map(m => m.name || m.type))),
      microtaskQueue: JSON.parse(JSON.stringify(this.microtaskQueue.map(m => m.name || m.type))),
      console: [...this.consoleLogs],
      memory: this.serializeEnv(env),
      contextName
    });
  }

  run() {
    if (!this.ast) return [];

    this.callStack.push({ name: 'main()', state: 'running' });
    this.macrotaskQueue.push({ type: 'script', name: 'script', node: this.ast, env: this.globalEnv });

    return this.runLoop();
  }

  triggerDOMEvent(elementId, eventName) {
     const key = `${elementId}-${eventName}`;
     const listeners = this.eventListeners.get(key);
     if (listeners && listeners.length > 0) {
       listeners.forEach((cb) => {
         this.macrotaskQueue.push({
            type: 'Macrotask (DOM Event)',
            name: `Event: ${eventName}`,
            callback: cb,
            env: this.globalEnv
         });
       });
       
       this.recordSnapshot({ loc: { start: { line: null } } }, `Triggered ${eventName}`, this.globalEnv);
       return this.runLoop(); // Process the new queues
     }
     return this.snapshots;
  }

  runLoop() {
    let loopCount = 0;

    // Event Loop Simulation
    while ((this.macrotaskQueue.length > 0 || this.microtaskQueue.length > 0 || this.webAPIs.length > 0) && loopCount < 500) {
      loopCount++;
      
      // 1. Process Macrotask
      if (this.macrotaskQueue.length > 0) {
        const task = this.macrotaskQueue.shift();
        
        if (task.type === 'script') {
          this.evaluate(task.node, task.env, 'main()');
        } else if (task.type === 'Macrotask (setTimeout)' || task.type === 'Macrotask (DOM Event)') {
          this.callStack.push({ name: task.name || 'callback', state: 'running' });
          this.recordSnapshot(task.callback.node || { loc: { start: { line: 1 } } }, task.name, task.env);
          this.evaluateCall(task.callback, [], task.env, task.name);
          this.callStack.pop();
          this.recordSnapshot({ loc: { start: { line: null } } }, 'Global', this.globalEnv);
        }
      }

      // 2. Process Microtasks
      while (this.microtaskQueue.length > 0 && loopCount < 500) {
         loopCount++;
         const micro = this.microtaskQueue.shift();
         this.callStack.push({ name: 'Promise.then()', state: 'running' });
         this.recordSnapshot(micro.callback.node || { loc: { start: { line: 1 } } }, 'Promise callback', micro.callback.env);
         this.evaluateCall(micro.callback, [micro.arg], micro.callback.env, 'Promise.then()');
         this.callStack.pop();
         this.recordSnapshot({ loc: { start: { line: null } } }, 'Global', this.globalEnv);
      }

      // 3. Move Web APIs to Macrotask Queue (simulate time advancing to empty WebAPIs)
      if (this.webAPIs.length > 0 && this.macrotaskQueue.length === 0 && this.microtaskQueue.length === 0) {
         this.currentTime += 1;
         const readyApis = this.webAPIs.filter(api => this.currentTime >= api.triggerTime);
         this.webAPIs = this.webAPIs.filter(api => this.currentTime < api.triggerTime);
         
         readyApis.forEach(api => {
           if (api.isFetch) {
             this.microtaskQueue.push({
               type: 'Microtask (fetch)',
               name: 'fetch callback',
               callback: api.callback,
               env: this.globalEnv
             });
           } else {
             this.macrotaskQueue.push({
               type: 'Macrotask (setTimeout)',
               name: 'setTimeout callback',
               callback: api.callback,
               env: this.globalEnv
             });
           }
         });
         
         // Record state when WEB API moves to Queue
         if (readyApis.length > 0) {
            this.recordSnapshot({ loc: { start: { line: null } } }, 'Event Loop Callback', this.globalEnv);
         }
      }
    }
    
    // Only pop main if we just finished the script task, otherwise keep the stack empty.
    if (this.callStack.length > 0 && this.callStack[this.callStack.length - 1].name === 'main()') {
      this.callStack.pop();
    }
    
    this.recordSnapshot({ loc: { start: { line: null } } }, 'Idle', this.globalEnv);

    return this.snapshots;
  }

  evaluate(node, env, contextName) {
    if (!node) return null;
    
    // Only record statements and declarations
    if (node.type.includes('Statement') || node.type.includes('Declaration') || node.type === 'CallExpression') {
       if (node.type !== 'BlockStatement' && node.type !== 'Program') {
         this.recordSnapshot(node, contextName, env);
       }
    }

    switch (node.type) {
      case 'Program':
      case 'BlockStatement':
        let lastValue = undefined;
        for (const stmt of node.body) {
          lastValue = this.evaluate(stmt, env, contextName);
        }
        return lastValue;
        
      case 'VariableDeclaration':
        for (const decl of node.declarations) {
          const val = decl.init ? this.evaluate(decl.init, env, contextName) : undefined;
          env.set(decl.id.name, val);
        }
        return;
        
      case 'ExpressionStatement':
        return this.evaluate(node.expression, env, contextName);
        
      case 'CallExpression':
        const callee = this.evaluate(node.callee, env, contextName);
        const args = node.arguments.map(arg => this.evaluate(arg, env, contextName));
        
        if (typeof callee === 'function') {
           return callee(...args);
        } else if (callee && callee.type === 'Function') {
           this.callStack.push({ name: callee.name || 'anonymous()', state: 'running' });
           this.recordSnapshot(node, callee.name || 'anonymous()');
           const res = this.evaluateCall(callee, args, env, callee.name || 'anonymous()');
           this.callStack.pop();
           this.recordSnapshot(node, contextName);
           return res;
        } else if (callee && callee.log) {
           return callee.log(...args); // Console
        }
        return;
        
      case 'MemberExpression':
        const obj = this.evaluate(node.object, env, contextName);
        const propName = node.property.name;
        if (obj && obj[propName]) return obj[propName];
        if (obj === this.globalEnv.get('console')) return this.globalEnv.get('console')[propName];
        return obj;
        
      case 'Identifier':
        return env.has(node.name) ? env.get(node.name) : undefined;
        
      case 'Literal':
        return { type: typeof node.value, value: node.value };
        
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
         return {
           type: 'Function',
           name: node.id ? node.id.name : null,
           params: node.params,
           body: node.body,
           env: env,
           node: node
         };
         
      case 'FunctionDeclaration':
         const fn = {
           type: 'Function',
           name: node.id.name,
           params: node.params,
           body: node.body,
           env: env,
           node: node
         };
         env.set(node.id.name, fn);
         return fn;
         
      default:
        return undefined;
    }
  }
  
  evaluateCall(fnDef, args, parentEnv, contextName) {
     const callEnv = new Environment(fnDef.env);
     fnDef.params.forEach((param, i) => {
       callEnv.set(param.name, args[i]);
     });
     
     if (fnDef.body.type === 'BlockStatement') {
       return this.evaluate(fnDef.body, callEnv, contextName);
     } else {
       return this.evaluate(fnDef.body, callEnv, contextName); // Arrow func implicit return
     }
  }
}
