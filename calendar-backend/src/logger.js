function write(stream, level, event, fields = {}) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  stream.write(`${JSON.stringify(record)}\n`);
}

export function createLogger({ stdout = process.stdout, stderr = process.stderr } = {}) {
  return {
    info(event, fields) {
      write(stdout, 'info', event, fields);
    },
    warn(event, fields) {
      write(stderr, 'warn', event, fields);
    },
    error(event, fields) {
      write(stderr, 'error', event, fields);
    },
  };
}
