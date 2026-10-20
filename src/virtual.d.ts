// the clubs' event edits as they stood at build time (editsSnapshot in vite.config.ts)
declare module 'virtual:event-edits' {
  const rows: import('./data/eventEdits').EventEdit[];
  export default rows;
}
