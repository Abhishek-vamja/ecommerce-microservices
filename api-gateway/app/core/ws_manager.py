import json
from typing import Dict, List, Set
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        self.order_connections: Dict[str, Set[WebSocket]] = {}
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        self.global_connections: Set[WebSocket] = set()

    async def connect_order(self, websocket: WebSocket, order_id: str):
        await websocket.accept()
        if order_id not in self.order_connections:
            self.order_connections[order_id] = set()
        self.order_connections[order_id].add(websocket)

    def disconnect_order(self, websocket: WebSocket, order_id: str):
        if order_id in self.order_connections:
            self.order_connections[order_id].discard(websocket)
            if not self.order_connections[order_id]:
                del self.order_connections[order_id]

    async def connect_user(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

    def disconnect_user(self, websocket: WebSocket, user_id: str):
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def connect_global(self, websocket: WebSocket):
        await websocket.accept()
        self.global_connections.add(websocket)

    def disconnect_global(self, websocket: WebSocket):
        self.global_connections.discard(websocket)

    async def broadcast_order_event(self, order_id: str, message: dict):
        payload = json.dumps(message)
        dead_connections = set()
        
        if order_id in self.order_connections:
            for ws in list(self.order_connections[order_id]):
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_connections.add(ws)
            for dead in dead_connections:
                self.order_connections[order_id].discard(dead)

        dead_globals = set()
        for ws in list(self.global_connections):
            try:
                await ws.send_text(payload)
            except Exception:
                dead_globals.add(ws)
        for dead in dead_globals:
            self.global_connections.discard(dead)

    async def broadcast_user_event(self, user_id: str, message: dict):
        payload = json.dumps(message)
        dead_connections = set()
        
        if user_id in self.user_connections:
            for ws in list(self.user_connections[user_id]):
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_connections.add(ws)
            for dead in dead_connections:
                self.user_connections[user_id].discard(dead)

ws_manager = WebSocketManager()
