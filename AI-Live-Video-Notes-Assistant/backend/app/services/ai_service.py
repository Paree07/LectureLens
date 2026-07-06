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

    # Remove ```json
    text = re.sub(
        r"^```json\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    # Remove opening ```
    text = re.sub(
        r"^```\s*",
        "",
        text
    )

    # Remove closing ```
    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    # Find JSON object
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError(
            "No valid JSON object found in AI response"
        )

    json_text = text[start:end + 1]

    return json.loads(json_text)


# ===================================
# REDUCE LONG TRANSCRIPTS
# ===================================

def reduce_transcript(
    transcript: str,
    max_chars: int = 12000
):
    """
    Reduces very long transcripts so the request
    stays under token limits.

    Keeps:
    - beginning
    - middle
    - ending
    """

    if not transcript:
        return ""

    transcript = transcript.strip()

    # If transcript is already short
    if len(transcript) <= max_chars:
        print(
            f"Transcript is within safe limit: "
            f"{len(transcript)} characters"
        )

        return transcript

    print(
        f"Long transcript detected: "
        f"{len(transcript)} characters"
    )

    # Divide allowed size into 3 parts
    part_size = max_chars // 3

    # Beginning
    beginning = transcript[:part_size]

    # Middle
    middle_start = max(
        0,
        (len(transcript) // 2)
        - (part_size // 2)
    )

    middle = transcript[
        middle_start:
        middle_start + part_size
    ]

    # Ending
    ending = transcript[-part_size:]

    reduced = f"""
LECTURE BEGINNING:

{beginning}


LECTURE MIDDLE:

{middle}


LECTURE END:

{ending}
"""

    print(
        f"Transcript reduced to: "
        f"{len(reduced)} characters"
    )

    return reduced


# ===================================
# GENERATE AI NOTES
# ===================================

def generate_notes(transcript: str):

    if not transcript:
        raise ValueError(
            "Transcript is empty"
        )

    # -----------------------------------
    # Reduce long transcript
    # -----------------------------------

    safe_transcript = reduce_transcript(
        transcript,
        max_chars=12000
    )


    # -----------------------------------
    # AI PROMPT
    # -----------------------------------

    prompt = f"""
You are an expert multilingual lecture assistant
and academic study-notes generator.

The lecture transcript may be written or spoken in:

- English
- Hindi
- Hinglish
- Mixed Hindi-English
- Any other language

You must understand the meaning of the transcript
regardless of its original language.


LANGUAGE RULES:

1. ALWAYS generate the final notes in ENGLISH.

2. If the transcript is Hindi:
   understand the Hindi content and convert
   the meaning into clear natural English notes.

3. If the transcript is Hinglish:
   understand both Hindi and English parts
   and write unified English notes.

4. If the transcript is already English:
   generate polished English study notes.

5. Do NOT perform literal word-by-word translation.

6. Write natural, meaningful academic English.

7. Preserve technical terms correctly.

8. Do NOT output Hindi text.

9. Do NOT output Devanagari characters.

10. Every field must be written in English:
    - summary
    - key concepts
    - definitions
    - exam tips


IMPORTANT JSON RULES:

Return ONLY one valid JSON object.

Do not return markdown.

Do not return ```json.

Do not write explanations before JSON.

Do not write explanations after JSON.

Use double quotes for:
- keys
- string values

Do not use trailing commas.


USE EXACTLY THIS JSON STRUCTURE:

{{
  "summary": "A concise English summary of the lecture",

  "key_concepts": [
    "English key concept 1",
    "English key concept 2",
    "English key concept 3",
    "English key concept 4",
    "English key concept 5"
  ],

  "definitions": [
    {{
      "term": "Important term in English",
      "meaning": "Clear English explanation"
    }}
  ],

  "exam_tips": [
    "Practical exam tip in English",
    "Another exam tip in English"
  ]
}}


CONTENT RULES:

- Summary must be concise but meaningful.

- Summary must explain the main lecture topic.

- Give 5 to 8 key concepts.

- All key concepts must be in English.

- Give 3 to 6 useful definitions
  when possible.

- Definition terms must be in English.

- Definition meanings must be in English.

- Give 2 to 5 practical exam tips.

- Exam tips must be in English.

- Do not invent facts that are not supported
  by the transcript.

- Correct obvious speech-to-text mistakes
  when the intended meaning is clear.

- Preserve programming terms,
  technical terms, framework names,
  library names and product names.

- Keep the output concise.

- The final response must be valid JSON.

- FINAL OUTPUT LANGUAGE MUST ALWAYS BE ENGLISH.


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
                        "study assistant. "
                        "You understand English, Hindi, "
                        "Hinglish and other languages. "
                        "Regardless of the transcript language, "
                        "always generate all final notes "
                        "in clear natural English. "
                        "Never output Hindi or Devanagari text. "
                        "Always return strict valid JSON only."
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

            max_tokens=1200
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
        # FINAL VALIDATION
        # -----------------------------------

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


        # -----------------------------------
        # TYPE VALIDATION
        # -----------------------------------

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