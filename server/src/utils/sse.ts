import type { Request, Response } from 'express';

/**
 * Turns a response into a Server-Sent Events stream.
 * Returns a `send` function; `onClose` runs when the client disconnects.
 */
export function openSse(req: Request, res: Response, onClose: () => void) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  // Comment frames keep proxies from closing idle connections.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    onClose();
  });

  return (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
}
