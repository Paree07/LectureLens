import os
import shutil
import tempfile

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.transcript_service import transcribe_uploaded_file

router = APIRouter()


@router.post("/video/upload")
async def upload_video(
    file: UploadFile = File(...),
    language: str = Form("English"),
):
    temp_file_path = None

    try:
        # Check filename
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file selected."
            )

        # Get file extension
        _, extension = os.path.splitext(file.filename)

        if not extension:
            extension = ".mp4"

        # Supported file types
        allowed_extensions = {
            ".mp4",
            ".mov",
            ".avi",
            ".mkv",
            ".webm",
            ".mp3",
            ".wav",
            ".m4a",
            ".aac",
        }

        if extension.lower() not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported file type. "
                    "Please upload video or audio."
                ),
            )

        # Create temporary file
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension,
        ) as temp_file:
            temp_file_path = temp_file.name

            # Copy uploaded file
            shutil.copyfileobj(
                file.file,
                temp_file,
            )

        # Transcribe uploaded file
        transcript = transcribe_uploaded_file(
            temp_file_path,
            language,
        )

        if not transcript:
            raise HTTPException(
                status_code=500,
                detail="Could not generate transcript from uploaded file.",
            )

        return {
            "success": True,
            "message": "File uploaded and transcribed successfully.",
            "filename": file.filename,
            "language": language,
            "transcript": transcript,
        }

    except HTTPException:
        raise

    except Exception as e:
        print(
            "Upload Error:",
            type(e).__name__,
            str(e),
        )

        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}",
        )

    finally:
        # Close uploaded file
        try:
            await file.close()
        except Exception:
            pass

        # Delete temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as cleanup_error:
                print(
                    "Temporary file cleanup error:",
                    str(cleanup_error),
                )