# 🎓 LectureLens — AI-Powered Live Video Notes Assistant

LectureLens is an AI-powered learning assistant designed to help students learn more effectively from video lectures and educational recordings.

Users can paste a YouTube lecture URL or upload supported media, while LectureLens processes the content, extracts transcripts, generates structured AI-powered notes, and enables contextual AI interaction — helping students focus more on understanding and less on constantly writing notes.

---

## 🌐 Live Demo

🚀 **Live Website:**  
https://lecture-lens-frontend-kxzq-8y7yx3zj0-paree07s-projects.vercel.app/

🔗 **Backend API:**  
https://lecturelens-production-5dec.up.railway.app

📚 **Interactive API Docs:**  
https://lecturelens-production-5dec.up.railway.app/docs

---

## ✨ Features

- 🎥 Process YouTube lecture videos
- 📤 Upload lecture or meeting recordings
- 📄 Extract lecture transcripts
- 🤖 Generate AI-powered notes
- 📝 Create structured academic notes
- 💬 Ask questions using AI Chat
- 🧠 Generate AI-powered quizzes
- 🃏 Create revision flashcards
- 🌍 Support multilingual lecture content
- ⚡ Fast frontend–backend API integration
- 🎯 Clean and student-friendly interface
- 📱 Responsive frontend design
- ☁️ Fully deployed frontend and backend
- 🔄 Multi-stage transcript fallback system

---

## 🧠 How LectureLens Works

~~~text
User pastes a YouTube URL
        │
        ▼
LectureLens Frontend
        │
        ├── Loads YouTube Video
        ├── Fetches Video Metadata
        └── Requests Transcript
                │
                ▼
        Transcript Pipeline
                │
                ├── Supadata API
                │       │
                │       └── Success → Transcript
                │
                ├── YouTube Transcript API
                │       │
                │       └── Success → Transcript
                │
                └── yt-dlp + Faster Whisper
                        │
                        └── Audio Transcription
                                │
                                ▼
                            Transcript
                                │
                                ▼
                    AI-Powered Processing
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
           AI Notes         AI Chat         Study Tools
                                                │
                                         ┌──────┴──────┐
                                         ▼             ▼
                                      Quizzes      Flashcards
~~~

LectureLens fetches the transcript and reuses the available transcript for AI processing, reducing unnecessary duplicate transcript requests.

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- TSX
- Material UI
- Radix UI
- Lucide React
- Tailwind CSS
- Responsive UI Design

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- Requests

### AI & Transcript Services

- Groq API
- Supadata API
- YouTube Transcript API
- yt-dlp
- Faster Whisper

### Deployment

- Vercel — Frontend
- Railway — Backend
- GitHub — Version Control and Deployment Integration

---

## 🏗️ Project Structure

~~~text
LectureLens/
│
├── AI-Live-Video-Notes-Assistant/
│   │
│   ├── backend/
│   │   │
│   │   ├── app/
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── video_routes.py
│   │   │   │   ├── youtube_routes.py
│   │   │   │   ├── notes_routes.py
│   │   │   │   ├── quiz_routes.py
│   │   │   │   ├── flashcard_routes.py
│   │   │   │   └── chat_routes.py
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── transcript_service.py
│   │   │   │   └── ai_service.py
│   │   │   │
│   │   │   ├── utils/
│   │   │   └── main.py
│   │   │
│   │   ├── requirements.txt
│   │   └── railway.toml
│   │
│   ├── assets/
│   ├── docs/
│   └── frontend/
│
├── LectureLens Frontend/
│   │
│   ├── src/
│   │   ├── app/
│   │   │   └── App.tsx
│   │   │
│   │   ├── services/
│   │   │   └── api.ts
│   │   │
│   │   ├── styles/
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
│
└── README.md
~~~

---

## 🚀 Running the Project Locally

### 1. Clone the Repository

~~~bash
git clone <your-repository-url>
cd LectureLens
~~~

---

### 2. Run the Backend

Move into the backend directory:

~~~bash
cd AI-Live-Video-Notes-Assistant/backend
~~~

Create a Python virtual environment:

~~~bash
python -m venv venv
~~~

Activate the virtual environment on Windows:

~~~bash
venv\Scripts\activate
~~~

Activate on macOS or Linux:

~~~bash
source venv/bin/activate
~~~

Install backend dependencies:

~~~bash
pip install -r requirements.txt
~~~

Create a `.env` file inside the backend directory:

~~~env
GROQ_API_KEY=your_groq_api_key
SUPADATA_API_KEY=your_supadata_api_key
~~~

Start the FastAPI backend:

~~~bash
uvicorn app.main:app --reload
~~~

The local backend will normally be available at:

~~~text
http://127.0.0.1:8000
~~~

Interactive API documentation:

~~~text
http://127.0.0.1:8000/docs
~~~

---

### 3. Run the Frontend

Open another terminal and move into the frontend directory:

~~~bash
cd "LectureLens Frontend"
~~~

Install frontend dependencies:

~~~bash
npm install
~~~

Start the Vite development server:

~~~bash
npm run dev
~~~

The local frontend will normally run at:

~~~text
http://localhost:5173
~~~

If port `5173` is already in use, Vite may automatically use another port such as:

~~~text
http://localhost:5174
~~~

---

## 🔐 Environment Variables

The backend requires the following environment variables:

~~~env
GROQ_API_KEY=your_groq_api_key
SUPADATA_API_KEY=your_supadata_api_key
~~~

### Environment Variable Purpose

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Generates AI-powered notes and intelligent responses |
| `SUPADATA_API_KEY` | Retrieves reliable YouTube transcripts |

> ⚠️ Never commit your real API keys or `.env` file to GitHub.

Recommended `.gitignore` entries:

~~~gitignore
.env
.env.*
venv/
.venv/
__pycache__/
*.pyc
node_modules/
dist/
~~~

---

## 🔌 API Endpoints

### Health Check

~~~http
GET /health
~~~

Checks whether the LectureLens backend is running.

---

### YouTube Metadata

~~~http
POST /api/youtube/metadata
~~~

Example request:

~~~json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
~~~

---

### YouTube Transcript

~~~http
POST /api/youtube/transcript
~~~

Example request:

~~~json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
~~~

Example successful response:

~~~json
{
  "success": true,
  "transcript": "Lecture transcript text...",
  "source": "supadata"
}
~~~

---

### Generate AI Notes

~~~http
POST /api/ai/notes
~~~

Example request:

~~~json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "transcript": "Already fetched lecture transcript..."
}
~~~

The frontend can send the already-fetched transcript to the AI Notes API, avoiding unnecessary duplicate transcript retrieval.

---

### AI Chat

~~~http
POST /api/ai/chat
~~~

Allows users to ask contextual questions related to lecture content.

---

### Quiz Generation

LectureLens includes backend support for generating AI-powered quizzes from lecture material.

---

### Flashcard Generation

LectureLens includes backend support for transforming lecture content into revision-friendly flashcards.

---

## 🔄 Transcript Fallback Strategy

LectureLens uses a multi-stage transcript retrieval system for improved reliability.

### 1. Supadata API

The preferred transcript source, especially for deployed cloud environments.

~~~text
YouTube URL
    │
    ▼
Supadata API
    │
    ├── Success → Return Transcript
    │
    └── Failure → Continue
~~~

### 2. YouTube Transcript API

If Supadata fails, LectureLens attempts to retrieve available YouTube captions.

~~~text
Supadata Failed
      │
      ▼
YouTube Transcript API
      │
      ├── Success → Return Transcript
      │
      └── Failure → Continue
~~~

### 3. yt-dlp + Faster Whisper

As a final fallback, LectureLens attempts to:

1. Download the available audio stream
2. Process the audio
3. Transcribe it using Faster Whisper
4. Remove temporary files

~~~text
YouTube Captions Failed
          │
          ▼
        yt-dlp
          │
          ▼
    Download Audio
          │
          ▼
   Faster Whisper
          │
          ▼
      Transcript
~~~

---

## 🌍 Language Support

LectureLens supports multilingual transcription workflows, including:

- English
- Hindi
- Hinglish
- Automatic language detection

Example Whisper language mapping:

~~~text
English  → en
Hindi    → hi
Hinglish → Automatic Detection
Auto     → Automatic Detection
~~~

---

## ☁️ Deployment Architecture

~~~text
                    User
                     │
                     ▼
        LectureLens Vercel Frontend
                     │
                     │ HTTPS API Requests
                     ▼
         Railway FastAPI Backend
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   Supadata       Groq AI      YouTube
      API            API       Services
        │            │            │
        ▼            ▼            ▼
 Transcript      AI Notes      Captions
 Retrieval       AI Chat       Metadata
                     │
                     ▼
               Study Tools
                     │
              ┌──────┴──────┐
              ▼             ▼
           Quizzes       Flashcards
~~~

---

## 🌐 CORS Configuration

The FastAPI backend allows requests from approved local and deployed frontend origins.

Example:

~~~python
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://lecture-lens-kappa.vercel.app",
    "https://lecture-lens-frontend-kxzq.vercel.app",
]
~~~

CORS origins must exactly match the browser origin.

Correct:

~~~text
https://lecture-lens-frontend-kxzq.vercel.app
~~~

Incorrect:

~~~text
https://lecture-lens-frontend-kxzq.vercel.app/
~~~

---

## 🏭 Production Build

To create a production frontend build:

~~~bash
npm run build
~~~

A successful Vite build generates:

~~~text
dist/
~~~

---

## ⚠️ Known Limitations

- YouTube may block requests from cloud or datacenter IP addresses
- yt-dlp may receive bot-verification challenges on hosted servers
- Some videos may have captions disabled
- Private or deleted videos cannot be processed
- Region-restricted videos may fail
- Very long transcripts may exceed AI model context limits
- Transcript quality depends on available captions and audio quality
- Browser privacy extensions may block YouTube telemetry requests and show `ERR_BLOCKED_BY_CLIENT` messages unrelated to the LectureLens backend

---

## 🔮 Future Improvements

- 🔐 User authentication
- 💾 Saved lecture history
- 📄 Advanced PDF export
- 🧠 Enhanced AI-generated quizzes
- 🃏 Interactive flashcard revision mode
- 🌍 Improved multilingual transcription
- 🔍 Search across saved notes
- 📊 Personalized learning dashboard
- ☁️ Cloud storage integration
- 🗄️ Database integration
- 📈 Learning progress analytics
- ✂️ Transcript chunking for very long lectures
- 🎯 Personalized AI study recommendations

---

## 👩‍💻 Author

**Paree07**

GitHub:  
https://github.com/Paree07

---

## ⭐ Support

If you find LectureLens useful, consider giving the repository a ⭐ on GitHub.

Contributions, suggestions, and feedback are welcome.

---

## 📄 License

This project is intended for educational and development purposes.
