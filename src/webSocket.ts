import http from 'http';
import * as net from 'net';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
import Broker from './broker';

/**
 * TODO - allow connections to make subscribe requests
 *      - have an optional AuthZ arg used to check if client is allowed to subscribe to channels
 */
export function connect(broker: Broker) {
  return (ws: WebSocket, _request: http.IncomingMessage, channel: string): void => {
    const clientId = uuidv4();
    broker.subscribe(clientId, channel, ws);

    ws.on('close', () => {
      broker.unsubscribeAll(clientId);
    });
  }
}

export function upgrade(wss: WebSocket.Server, authenticate: (request: http.IncomingMessage) => string) {
  return async (request: http.IncomingMessage, socket: net.Socket, head: Buffer): Promise<void> => {
    try {
      const channel = authenticate(request);
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, channel);
      });
    } catch (err) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
  }
}