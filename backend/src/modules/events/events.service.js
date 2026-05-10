const clients = new Set();

export function attachEventClient(res) {
  clients.add(res);
  res.on('close', () => clients.delete(res));
}

export function publishEvent(type, payload) {
  const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    client.write(data);
  }
}
