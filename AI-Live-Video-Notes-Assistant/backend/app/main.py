from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.video_routes import router as video_router
from app.api.youtube_routes import router as youtube_router
from app.api.notes_routes import router as notes_router
from app.api.quiz_routes import router as quiz_router
from app.api.flashcard_routes import router as flashcard_router
from app.api.chat_routes import router as chat_router


app = FastAPI(
    title="LectureLens Backend",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    video_router,
    prefix="/api",
    tags=["Video Upload"]
)

app.include_router(
    youtube_router,
    prefix="/api",
    tags=["YouTube"]
)

app.include_router(
    notes_router,
    prefix="/api",
    tags=["AI Notes"]
)

app.include_router(
    quiz_router,
    prefix="/api",
    tags=["AI Quiz"]
)

app.include_router(
    flashcard_router,
    prefix="/api",
    tags=["AI Flashcards"]
)

app.include_router(
    chat_router,
    prefix="/api",
    tags=["AI Chat"]
)


@app.get("/")
def home():
    return {
        "success": True,
        "message": "LectureLens Backend Running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "LectureLens API"
    }