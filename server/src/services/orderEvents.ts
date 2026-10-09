import { EventEmitter } from 'node:events';
import type { Order } from '@canteen/shared';

export type OrderEvent = { type: 'created' | 'updated'; order: Order };

/**
 * In-process pub/sub that feeds the Server-Sent Event streams.
 * Swap for Redis pub/sub if the API is ever scaled horizontally.
 */
class OrderEvents extends EventEmitter {
  publish(event: OrderEvent) {
    this.emit('order', event);
  }
  subscribe(listener: (event: OrderEvent) => void): () => void {
    this.on('order', listener);
    return () => this.off('order', listener);
  }
}

export const orderEvents = new OrderEvents();
orderEvents.setMaxListeners(0); // one listener per open browser tab
