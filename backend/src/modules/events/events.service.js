const clients = new Map();

export function attachEventClient(res, user) {
  clients.set(res, user);
  res.on('close', () => clients.delete(res));
}

export function publishUserEvent(userId, type, payload) {
  const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const [client, user] of clients) {
    if (user.id === userId) client.write(data);
  }
}
