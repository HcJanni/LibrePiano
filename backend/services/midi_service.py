import asyncio
from fastapi import WebSocket


class MidiService:
    """
    Verwaltet WebSocket-Verbindungen und verteilt MIDI-Events an alle Clients.
    Auf dem Raspberry Pi wird hier zusätzlich rtmidi eingebunden.
    """

    def __init__(self):
        self.clients: list[WebSocket] = []

    def add_client(self, ws: WebSocket):
        self.clients.append(ws)

    def remove_client(self, ws: WebSocket):
        self.clients.remove(ws)

    async def broadcast_note(self, note: int, velocity: int, on: bool):
        event = {
            "type": "note_on" if on else "note_off",
            "note": note,
            "velocity": velocity,
        }
        dead = []
        for client in self.clients:
            try:
                await client.send_json(event)
            except Exception:
                dead.append(client)
        for client in dead:
            self.clients.remove(client)

    async def handle_client_message(self, data: dict):
        # Vorerst: Client kann selbst simulierte Notes schicken
        note = data.get("note")
        velocity = data.get("velocity", 100)
        on = data.get("on", True)
        if note is not None:
            await self.broadcast_note(note, velocity, on)
