import asyncio
from fastapi import WebSocket

try:
    import rtmidi
    RTMIDI_AVAILABLE = True
except ImportError:
    RTMIDI_AVAILABLE = False


class MidiService:
    """
    Verwaltet WebSocket-Clients und MIDI-Events.
    Auf dem Raspberry Pi liest start_midi_reader() echte USB-MIDI-Daten.
    Auf dem Entwicklungsrechner läuft nur die Simulation.
    """

    def __init__(self):
        self.clients: list[WebSocket] = []
        self._loop: asyncio.AbstractEventLoop | None = None
        self._midi_in = None

    def start_midi_reader(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop
        if not RTMIDI_AVAILABLE:
            print("INFO: python-rtmidi nicht verfügbar — nur Simulation aktiv.")
            return

        try:
            midi_in = rtmidi.MidiIn()
            ports = midi_in.get_ports()
            if not ports:
                print("INFO: Kein MIDI-Gerät gefunden. Piano anschließen und neu starten.")
                return

            # Yamaha bevorzugen, sonst erstes verfügbares Gerät
            port_idx = next(
                (i for i, name in enumerate(ports) if "yamaha" in name.lower()),
                0,
            )
            midi_in.open_port(port_idx)
            midi_in.set_callback(self._on_midi_message)
            self._midi_in = midi_in
            print(f"MIDI verbunden: {ports[port_idx]}")
        except Exception as e:
            print(f"MIDI-Fehler: {e}")

    def _on_midi_message(self, event, _data=None):
        """Wird vom rtmidi-Thread aufgerufen — leitet Events in den asyncio-Loop."""
        msg, _ = event
        if len(msg) < 3:
            return
        status   = msg[0] & 0xF0
        note     = msg[1]
        velocity = msg[2]

        if status == 0x90:  # Note On (velocity 0 = Note Off)
            coro = self.broadcast_note(note, velocity, velocity > 0)
        elif status == 0x80:  # Note Off
            coro = self.broadcast_note(note, 0, False)
        elif status == 0xB0 and note == 64:  # Sustain-Pedal (CC 64)
            coro = self.broadcast_pedal(velocity >= 64)
        else:
            return

        if self._loop:
            asyncio.run_coroutine_threadsafe(coro, self._loop)

    def add_client(self, ws: WebSocket):
        self.clients.append(ws)

    def remove_client(self, ws: WebSocket):
        if ws in self.clients:
            self.clients.remove(ws)

    async def _send_all(self, event: dict):
        dead = []
        for client in self.clients:
            try:
                await client.send_json(event)
            except Exception:
                dead.append(client)
        for client in dead:
            self.clients.remove(client)

    async def broadcast_note(self, note: int, velocity: int, on: bool):
        await self._send_all({
            "type": "note_on" if on else "note_off",
            "note": note,
            "velocity": velocity,
        })

    async def broadcast_pedal(self, pressed: bool):
        await self._send_all({"type": "pedal", "pressed": pressed})

    async def handle_client_message(self, data: dict):
        note     = data.get("note")
        velocity = data.get("velocity", 100)
        on       = data.get("on", True)
        if note is not None:
            await self.broadcast_note(note, velocity, on)
