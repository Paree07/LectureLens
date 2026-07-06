import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def generate_flashcards(notes):

    prompt = f"""
You are an expert teacher.

Based on the notes below, generate EXACTLY 10 flashcards.

Return ONLY valid JSON.

Format:

{{
  "flashcards": [
    {{
      "question": "...",
      "answer": "..."
    }}
  ]
}}

Rules:
- Exactly 10 flashcards.
- Keep answers short (1-3 lines).
- No markdown.
- No explanations.
- Return only JSON.

Notes:

{notes}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2
    )

    result = response.choices[0].message.content.strip()

    if result.startswith("```json"):
        result = result.replace("```json", "").replace("```", "").strip()

    elif result.startswith("```"):
        result = result.replace("```", "").strip()

    return json.loads(result)