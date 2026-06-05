// Type shim for next-auth v4 subpath imports.
// v4's package.json has an `exports` field that maps subpaths to `.js`
// files, but TypeScript's "bundler" resolver sometimes can't find the
// matching `.d.ts`. This file re-exports the public types so `import type`
// from the subpath works in the rest of the codebase.

declare module 'next-auth/providers/credentials' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Provider: (config: any) => any;
  export default Provider;
}

declare module 'next-auth/providers/google' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Provider: (config: { clientId: string; clientSecret: string }) => any;
  export default Provider;
}

declare module 'next-auth/providers/github' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Provider: (config: { clientId: string; clientSecret: string }) => any;
  export default Provider;
}
