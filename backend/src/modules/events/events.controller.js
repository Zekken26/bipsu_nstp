import { attachEventClient } from './events.service.js';

export function streamEvents(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  res.write('event: ready\\ndata: {"ok":true}\\n\\n');
  attachEventClient(res);
}
