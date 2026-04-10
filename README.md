# JavaScript Code Visualizer

A stunning, interactive educational tool to help developers visualize the hidden mechanics of JavaScript's Concurrency Model and Event Loop. Step through code line-by-line and watch exactly how functions, macros, and micros interact entirely in the browser.

![Vite React Application](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue)
![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-2C2C32?style=for-the-badge&logo=visualstudiocode&logoColor=007ACC)

---

## ✨ Features

- **Custom JavaScript AST Interpreter**: Safely parses and evaluates code to track the underlying asynchronous JavaScript environment without locking the main thread.
- **Microtask & Macrotask Queue Separation**: Demystifies Event Loop queues by separating Promises (`Microtasks`) and setTimeout (`Macrotasks/Tasks`).
- **Interactive Time-Travel Control**: Pre-computes the timeline when you click `Run Code` so you can effortlessly step `Next` or `Prev` through execution states.
- **Premium Dark Aesthetics**: A tailored glassmorphism design powered by lightweight Vanilla CSS.
- **Monaco Code Editor**: Fully featured IDE experience with beautiful JetBrains Mono typography and native code validation features.
- **Micro-Animations**: Understand pushes and pops through fluid physics-based Framer Motion animations.

---

## 📖 User Manual

### How to Use the Visualizer

1. **Write Your Code**:
   Type or paste your JavaScript snippet into the editor on the left. The editor supports standard JavaScript ES6 syntax.
2. **Run the Code**:
   Click the **"Run Code"** button (Play icon). The engine will parse the code, simulate the event loop, and generate navigable snapshots.

3. **Step Through the Execution**:
    - Click **"Next"** to step forward by a single event loop cycle or function call.
    - Click **"Prev"** to step backward to see how contexts unwind.
    - Watch the animated **Call Stack** sequentially push and pop execution frames.
    - Watch native asynchronous callbacks land in the **Web APIs** section, drop into the **Task Queue**, and resolve back onto the Call Stack.

4. **Reset**:
   Click **"Reset"** to clear the visualizer states and write a new snippet.

### Supported Language Features Supported

Our specialized Event Loop engine is tailored for teaching concurrency. It supports a critical subset of JavaScript:

- **Synchronous Logic**: Variable declarations, basic assignments, Arrow/Normal functions, block statements.
- **Web APIs**: `setTimeout(callback, ms)`
- **Promises**: `Promise.resolve().then(callback)`
- **IO**: `console.log()` outputs perfectly to the in-app Console View window.

_(Note: Advanced object-oriented features, classes, and generic browser DOM APIs are not implemented in the AST engine)._

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/BhupendraLute/Javascript-Code-Visualizer.git
    cd Javascript-Code-Visualizer
    ```

2. Install the necessary NPM packages:
    ```bash
    npm install
    ```
    _This installs \`react\`, \`framer-motion\`, \`acorn\`, \`lucide-react\` and \`@monaco-editor/react\`._

### Running the Development Server

Start Vite's local development server:

```bash
npm run dev
```

Navigate your browser to \`http://localhost:5173\` (or the port specified in your terminal output) to begin writing snippets.

---

_Made with ❤️ using React and Vite._
