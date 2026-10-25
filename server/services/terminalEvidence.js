// Only shortcut names, never typed text/passwords. Evidence comes from input
// actually forwarded to the server PTY, not from a verification request body.
const records = new Map();
const keys = new Map([['\x1b[A','up'],['\x1bOA','up'],['\t','tab'],['\x03','ctrl-c'],['\x0c','ctrl-l'],['\x1a','ctrl-z']]);
export function recordTerminalInput(labId, data) {
  const key = keys.get(data);
  if (!key) return;
  let record = records.get(labId);
  if (!record || Date.now()-record.updated > 86400000) record = {keys:new Set(),updated:0};
  record.keys.add(key); record.updated=Date.now(); records.set(labId,record);
  if(records.size>256)records.delete(records.keys().next().value);
}
export function terminalKeys(labId) {
  const record=records.get(labId);
  return record && Date.now()-record.updated<=86400000 ? [...record.keys] : [];
}
export function clearTerminalEvidence(labId) {records.delete(labId);}
