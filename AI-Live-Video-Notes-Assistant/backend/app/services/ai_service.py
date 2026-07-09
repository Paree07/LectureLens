import os
import json
import re

from groq import Groq
from dotenv import load_dotenv


# ===================================
# LOAD ENVIRONMENT VARIABLES
# ===================================

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY not found. "
        "Please add GROQ_API_KEY to your .env file."
    )


# ===================================
# CREATE GROQ CLIENT
# ===================================

client = Groq(
    api_key=GROQ_API_KEY
)


# ===================================
# CLEAN AI JSON RESPONSE
# ===================================

def clean_json_response(text: str):
    """
    Safely extracts JSON from the AI response.
    """

    if not text:
        raise ValueError("AI returned empty response")

    text = text.strip()

    text = re.sub(
        r"^```json\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"^```\s*",
        "",
        text
    )

    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError(
            "No valid JSON object found in AI response"
        )

    json_text = text[start:end + 1]

    return json.loads(json_text)


# ===================================
# CLEAN TRANSCRIPT
# ===================================

def clean_transcript_text(transcript: str):
    """
    Removes unnecessary whitespace so fewer
    characters/tokens are sent to Groq.
    """

    if not transcript:
        return ""

    transcript = transcript.strip()

    # Replace repeated whitespace/newlines
    transcript = re.sub(
        r"\s+",
        " ",
        transcript
    )

    return transcript.strip()


# ===================================
# REDUCE LONG TRANSCRIPTS SAFELY
# ===================================

def reduce_transcript(
    transcript: str,
    max_chars: int = 6000
):
    """
    Keeps representative parts from across
    the entire lecture while staying safely
    below Groq request limits.

    For long transcripts, samples:
    - beginning
    - early-middle
    - middle
    - late-middle
    - ending
    """

    transcript = clean_transcript_text(
        transcript
    )

    if not transcript:
        return ""

    if len(transcript) <= max_chars:
        print(
            "Transcript is within safe limit:",
            len(transcript),
            "characters"
        )

        return transcript

    print(
        "Long transcript detected:",
        len(transcript),
        "characters"
    )

    # Use 5 samples from across the lecture
    sample_count = 5

    # Leave some room for section labels
    usable_chars = max_chars - 500

    part_size = usable_chars // sample_count

    transcript_length = len(transcript)

    positions = [
        0,
        transcript_length // 4,
        transcript_length // 2,
        (transcript_length * 3) // 4,
        max(0, transcript_length - part_size)
    ]

    labels = [
        "LECTURE BEGINNING",
        "LECTURE EARLY SECTION",
        "LECTURE MIDDLE",
        "LECTURE LATE SECTION",
        "LECTURE END"
    ]

    sections = []

    for label, start in zip(labels, positions):

        # Keep slice inside transcript bounds
        start = min(
            start,
            max(0, transcript_length - part_size)
        )

        section = transcript[
            start:
            start + part_size
        ]

        sections.append(
            f"{label}:\n{section}"
        )

    reduced = "\n\n".join(
        sections
    )

    # Absolute safety cap
    reduced = reduced[:max_chars]

    print(
        "Transcript reduced to:",
        len(reduced),
        "characters"
    )

    return reduced


# ===================================
# VALIDATE NOTES STRUCTURE
# ===================================

def validate_notes(notes):
    """
    Validates the final AI notes JSON.
    """

    if not isinstance(notes, dict):
        raise ValueError(
            "AI notes must be a JSON object"
        )

    required_keys = [
        "summary",
        "key_concepts",
        "definitions",
        "exam_tips"
    ]

    for key in required_keys:
        if key not in notes:
            raise ValueError(
                f"Missing required field: {key}"
            )

    if not isinstance(
        notes["summary"],
        str
    ):
        raise ValueError(
            "summary must be a string"
        )

    if not isinstance(
        notes["key_concepts"],
        list
    ):
        raise ValueError(
            "key_concepts must be a list"
        )

    if not isinstance(
        notes["definitions"],
        list
    ):
        raise ValueError(
            "definitions must be a list"
        )

    if not isinstance(
        notes["exam_tips"],
        list
    ):
        raise ValueError(
            "exam_tips must be a list"
        )

    return notes


# ===================================
# GENERATE AI NOTES
# ===================================

def generate_notes(transcript: str):

    if not transcript:
        raise ValueError(
            "Transcript is empty"
        )

    # -----------------------------------
    # REDUCE TRANSCRIPT
    # -----------------------------------

    safe_transcript = reduce_transcript(
        transcript,
        max_chars=6000
    )

    if not safe_transcript:
        raise ValueError(
            "Transcript became empty after cleaning"
        )


    # -----------------------------------
    # COMPACT AI PROMPT
    # -----------------------------------

    prompt = f"""
Create concise academic study notes from the lecture transcript below.

LANGUAGE:
- Understand English, Hindi, Hinglish, and mixed-language speech.
- ALWAYS write final notes in clear natural English.
- Do not output Hindi or Devanagari.
- Preserve technical terms and proper names.
- Correct obvious speech-to-text mistakes when meaning is clear.
- Do not invent unsupported facts.

OUTPUT:
Return ONLY one valid JSON object.
No markdown.
No code fences.
No text before or after JSON.

Use exactly this structure:

{{
  "summary": "Concise meaningful English summary",
  "key_concepts": [
    "Concept 1",
    "Concept 2",
    "Concept 3",
    "Concept 4",
    "Concept 5"
  ],
  "definitions": [
    {{
      "term": "Important term",
      "meaning": "Clear English explanation"
    }}
  ],
  "exam_tips": [
    "Practical exam tip 1",
    "Practical exam tip 2"
  ]
}}

RULES:
- Give 5 to 8 key concepts.
- Give 3 to 6 definitions when possible.
- Give 2 to 5 practical exam tips.
- Keep output concise.
- All fields must be in English.
- Base notes only on the provided transcript.

LECTURE TRANSCRIPT:

{safe_transcript}
"""


    # -----------------------------------
    # CALL GROQ
    # -----------------------------------

    try:

        print("=" * 50)
        print("Generating AI notes...")

        print(
            "Original transcript characters:",
            len(transcript)
        )

        print(
            "Transcript characters sent to AI:",
            len(safe_transcript)
        )

        print(
            "Using model:",
            "llama-3.1-8b-instant"
        )

        print("=" * 50)


        response = client.chat.completions.create(

            model="llama-3.1-8b-instant",

            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a multilingual academic "
                        "study assistant. Always produce "
                        "concise English study notes and "
                        "return strict valid JSON only."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],

            temperature=0.1,

            response_format={
                "type": "json_object"
            },

            max_tokens=900
        )


        # -----------------------------------
        # GET AI RESPONSE
        # -----------------------------------

        result = (
            response
            .choices[0]
            .message
            .content
        )

        if not result:
            raise ValueError(
                "AI returned an empty response"
            )


        # -----------------------------------
        # DEBUG OUTPUT
        # -----------------------------------

        print("RAW AI RESPONSE:")
        print(result)


        # -----------------------------------
        # CLEAN JSON
        # -----------------------------------

        notes = clean_json_response(
            result
        )


        # -----------------------------------
        # VALIDATE JSON
        # -----------------------------------

        notes = validate_notes(
            notes
        )


        print("=" * 50)
        print(
            "AI notes generated successfully"
        )
        print("=" * 50)


        return notes


    except Exception as e:

        print("=" * 50)

        print(
            "AI NOTES ERROR:",
            repr(e)
        )

        print("=" * 50)

        raise
