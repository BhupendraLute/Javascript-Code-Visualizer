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
          internalThen: (cb) => {
             this.microtaskQueue.push({
               type: 'Microtask (await resume)',
               name: 'async resume',
               continuation: () => cb(val),
               env: this.globalEnv
             });
          },
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
        internalThen: (cb) => {
          const id = this.nextTimerId++;
          this.webAPIs.push({
            id,
            name: 'fetch()',
            triggerTime: this.currentTime + 10,
            isFetch: true,
            continuation: () => cb({ status: 200, json: () => ({ message: 'Success' }) })
          });
        },
        then: (cb) => {
          const id = this.nextTimerId++;
          this.webAPIs.push({
            id,
            name: 'fetch()',
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

  pumpGenerator(iterator, env, contextName, onComplete, valueToInject) {
      let result;
      try {
          result = iterator.next(valueToInject); 
      } catch(e) {
          console.error('Interpreter Error:', e);
          if (onComplete) onComplete();
          return;
      }
      
      if (result.done) {
          if (onComplete) onComplete();
          return result.value;
      }
      
      const val = result.value;
      if (val && val.suspend) {
          // Pop the current top-level context from the stack when suspending
          this.callStack.pop();
          this.recordSnapshot({ loc: { start: { line: null } } }, `Suspended: ${contextName}`, env);
          
          if (val.promise && val.promise.internalThen) {
              val.promise.internalThen((resolvedValue) => {
                  this.microtaskQueue.push({
                      type: 'Microtask (await resume)',
                      name: `Resume: ${contextName}`,
                      continuation: () => {
                          // Push it back on resume
                          this.callStack.push({ name: contextName, state: 'running' });
                          this.recordSnapshot({ loc: { start: { line: null } } }, `Resumed ${contextName}`, env);
                          this.pumpGenerator(iterator, env, contextName, onComplete, resolvedValue);
                      },
                      env: env
                  });
              });
          } else {
             // Not a mock promise, just resume immediately
             setTimeout(() => {
                 this.callStack.push({ name: contextName, state: 'running' });
                 this.recordSnapshot({ loc: { start: { line: null } } }, `Resuming ${contextName}`, env);
                 this.pumpGenerator(iterator, env, contextName, onComplete, val.promise);
             }, 0);
          }
      }
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
          const iter = this.evaluate(task.node, task.env, 'main()');
          this.pumpGenerator(iter, task.env, 'main()', () => {
              if (this.callStack.length > 0 && this.callStack[this.callStack.length - 1].name === 'main()') {
                  this.callStack.pop();
                  this.recordSnapshot({ loc: { start: { line: null } } }, 'Script Finished', this.globalEnv);
              }
          });
        } else if (task.type === 'Macrotask (setTimeout)' || task.type === 'Macrotask (DOM Event)') {
          this.callStack.push({ name: task.name || 'callback', state: 'running' });
          this.recordSnapshot(task.callback.node || { loc: { start: { line: 1 } } }, task.name, task.env);
          const iter = this.evaluateCall(task.callback, [], task.env, task.name);
          this.pumpGenerator(iter, task.env, task.name, () => {
             this.callStack.pop();
             this.recordSnapshot({ loc: { start: { line: null } } }, 'Global', this.globalEnv);
          });
        }
      }

      // 2. Process Microtasks
      while (this.microtaskQueue.length > 0 && loopCount < 500) {
         loopCount++;
         const micro = this.microtaskQueue.shift();
         this.callStack.push({ name: micro.name || 'Promise.then()', state: 'running' });
         
         if (micro.continuation) {
            this.recordSnapshot({ loc: { start: { line: null } } }, micro.name || 'Resuming async', micro.env || this.globalEnv);
            micro.continuation();
            // Note: pumpGenerator handles its own callStack pop/record in suspension or onComplete
         } else {
            this.recordSnapshot(micro.callback.node || { loc: { start: { line: 1 } } }, 'Promise callback', micro.callback.env);
            const iter = this.evaluateCall(micro.callback, [micro.arg], micro.callback.env, 'Promise.then()');
            this.pumpGenerator(iter, micro.callback.env, 'Promise.then()', () => {
               this.callStack.pop();
               this.recordSnapshot({ loc: { start: { line: null } } }, 'Global', this.globalEnv);
            });
         }
      }

      // 3. Move Web APIs to Macrotask Queue (simulate time advancing to empty WebAPIs)
      if (this.webAPIs.length > 0 && this.macrotaskQueue.length === 0 && this.microtaskQueue.length === 0) {
         this.currentTime += 1;
         const readyApis = this.webAPIs.filter(api => this.currentTime >= api.triggerTime);
         this.webAPIs = this.webAPIs.filter(api => this.currentTime < api.triggerTime);
         
         readyApis.forEach(api => {
           if (api.isFetch) {
             if (api.continuation) {
                this.microtaskQueue.push({
                   type: 'Microtask (fetch resume)',
                   name: 'async fetch resume',
                   continuation: api.continuation,
                   env: this.globalEnv
                });
             } else {
                this.microtaskQueue.push({
                  type: 'Microtask (fetch)',
                  name: 'fetch callback',
                  callback: api.callback,
                  env: this.globalEnv
                });
             }
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
    this.recordSnapshot({ loc: { start: { line: null } } }, 'Idle', this.globalEnv);

    return this.snapshots;
  }

  *evaluate(node, env, contextName) {
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
          lastValue = yield* this.evaluate(stmt, env, contextName);
        }
        return lastValue;
        
      case 'VariableDeclaration':
        for (const decl of node.declarations) {
          const val = decl.init ? yield* this.evaluate(decl.init, env, contextName) : undefined;
          env.set(decl.id.name, val);
        }
        return;
        
      case 'ExpressionStatement':
        return yield* this.evaluate(node.expression, env, contextName);
        
      case 'AwaitExpression':
        const p = yield* this.evaluate(node.argument, env, contextName);
        return yield { suspend: true, promise: p };
        
      case 'CallExpression':
        const callee = yield* this.evaluate(node.callee, env, contextName);
        const args = [];
        for (const arg of node.arguments) {
            args.push(yield* this.evaluate(arg, env, contextName));
        }
        
        if (typeof callee === 'function') {
           return callee(...args);
        } else if (callee && callee.type === 'Function') {
           const funcName = callee.name || 'anonymous()';
           
           if (callee.node && callee.node.async) {
               this.callStack.push({ name: funcName, state: 'running' });
               this.recordSnapshot(node, funcName, env);
               const iterator = this.evaluateCall(callee, args, env, funcName);
               
               this.pumpGenerator(iterator, env, funcName, () => {
                   if (this.callStack.length > 0 && this.callStack[this.callStack.length - 1].name === funcName) {
                       this.callStack.pop();
                       this.recordSnapshot({ loc: { start: { line: null } } }, `Finished ${funcName}`, env);
                   }
               });
               
               return this.globalEnv.get('Promise').resolve({});
           } else {
               this.callStack.push({ name: funcName, state: 'running' });
               this.recordSnapshot(node, funcName, env);
               
               const iterator = this.evaluateCall(callee, args, env, funcName);
               let res = iterator.next();
               while (!res.done) {
                   if (res.value && res.value.suspend) {
                       this.callStack.pop();
                       const injectedValue = yield res.value;
                       this.callStack.push({ name: funcName, state: 'running' });
                       res = iterator.next(injectedValue);
                   } else {
                       res = iterator.next();
                   }
               }
               
               this.callStack.pop();
               this.recordSnapshot(node, contextName, env);
               return res.value;
           }
        } else if (callee && callee.log) {
           return callee.log(...args); // Console
        }
        return;
        
      case 'MemberExpression':
        const obj = yield* this.evaluate(node.object, env, contextName);
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
  
  *evaluateCall(fnDef, args, parentEnv, contextName) {
     const callEnv = new Environment(fnDef.env);
     fnDef.params.forEach((param, i) => {
       callEnv.set(param.name, args[i]);
     });
     
     if (fnDef.body.type === 'BlockStatement') {
       return yield* this.evaluate(fnDef.body, callEnv, contextName);
     } else {
       return yield* this.evaluate(fnDef.body, callEnv, contextName); // Arrow func implicit return
     }
  }
}
