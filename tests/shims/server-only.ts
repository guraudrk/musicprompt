// Vitest runs outside Next.js's bundler, where the real `server-only` package always throws
// (it only no-ops when Next's webpack/turbopack build recognizes a server context). This shim
// is aliased in vitest.config.ts so server-only modules stay unit-testable in plain Node.
export {};
