import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def generate_quiz(notes):

    prompt = f"""
You are an expert teacher.

Based on the notes below, generate EXACTLY 10 multiple-choice questions.

Return ONLY valid JSON.

Format:

{{
  "quiz": [
    {{
      "question": "...",
      "options": [
        "...",
        "...",
        "...",
        "..."
      ],
      "answer": "..."
    }}
  ]
}}

Rules:
- Exactly 10 questions.
- Exactly 4 options per question.
- One correct answer.
- Do NOT add explanations.
- Do NOT use markdown.
- Do NOT wrap the JSON inside ```json.
- Return only pure JSON.

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

    # Remove markdown if model accidentally returns it
    if result.startswith("```json"):
        result = result.replace("```json", "").replace("```", "").strip()

    elif result.startswith("```"):
        result = result.replace("```", "").strip()

    return json.loads(result)