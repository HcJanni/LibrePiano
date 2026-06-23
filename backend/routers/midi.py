from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.midi_service import MidiService

router = APIRouter(prefix="/midi", tags=["midi"])

midi_service = MidiService()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    midi_service.add_client(websocket)
    try:
        while True:
            # Warten auf Nachrichten vom Client (z.B. simulierte MIDI-Events)
            data = await websocket.receive_json()
            await midi_service.handle_client_message(data)
    except WebSocketDisconnect:
        midi_service.remove_client(websocket)


@router.post("/simulate")
async def simulate_note(note: int, velocity: int, on: bool):
    """Nur für Entwicklung: MIDI-Note per HTTP simulieren."""
    await midi_service.broadcast_note(note, velocity, on)
    return {"note": note, "velocity": velocity, "on": on}
