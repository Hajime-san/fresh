vite 8
% deno task demo
Task demo vite demo
error: Uncaught (in promise) SyntaxError: The requested module 'node:util' does not provide an export named 'parseEnv' at file:///Users/hajime_masutani/repository/fresh/node_modules/.deno/vite@8.0.0-beta.14/node_modules/vite/dist/node/chunks/fetchableEnvironments.js:11:46
	const { createServer } = await import("./chunks/fetchableEnvironments.js").then((n) => n.x);
	                         ^
    at async CAC.<anonymous> (file:///Users/hajime_masutani/repository/fresh/node_modules/.deno/vite@8.0.0-beta.14/node_modules/vite/dist/node/cli.js:570:27)
    
    
    
Denoバージョン2.7.0以下を想定して、node:utilのparseEnvのマッピングを差し替えることを検討する。
https://main.vite.dev/config/
https://github.com/denoland/deno/releases/tag/v2.7.0
https://jsr.io/@std/dotenv/doc/parse/~/parse
