import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import midi

app = FastAPI(title="LibrePiano API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In Produktion läuft alles hinter nginx auf demselben Host
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(midi.router)


@app.on_event("startup")
async def startup():
    loop = asyncio.get_event_loop()
    midi.midi_service.start_midi_reader(loop)


@app.get("/health")
def health():
    return {"status": "ok"}
