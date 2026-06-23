from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import midi

app = FastAPI(title="LibrePiano API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(midi.router)


@app.get("/health")
def health():
    return {"status": "ok"}
