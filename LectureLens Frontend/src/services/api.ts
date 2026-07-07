const API_BASE_URL =
  "https://lecturelens-production-5dec.up.railway.app";


// ==========================================
// COMMON RESPONSE PARSER
// ==========================================

async function parseResponse(response: Response) {
  let data: any;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Server returned invalid response (${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  if (data?.success === false) {
    throw new Error(
      data?.message ||
        data?.error ||
        "Request failed"
    );
  }

  return data;
}


// ==========================================
// COMMON FETCH HELPER
// ==========================================

async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      }
    );

    return await parseResponse(response);

  } catch (error) {
    console.error(
      `API request failed: ${endpoint}`,
      error
    );

    throw error;
  }
}


// ==========================================
// BACKEND HEALTH CHECK
// ==========================================

export async function checkBackend() {
  return apiFetch(
    "/health",
    {
      method: "GET",
    }
  );
}


// ==========================================
// YOUTUBE METADATA
// ==========================================

export async function getYouTubeMetadata(
  url: string
) {
  return apiFetch(
    "/api/youtube/metadata",
    {
      method: "POST",

      body: JSON.stringify({
        url,
      }),
    }
  );
}


// ==========================================
// YOUTUBE TRANSCRIPT
// ==========================================

export async function getYouTubeTranscript(
  url: string
) {
  return apiFetch(
    "/api/youtube/transcript",
    {
      method: "POST",

      body: JSON.stringify({
        url,
      }),
    }
  );
}


// ==========================================
// AI NOTES
// ==========================================

export async function generateAINotes(
  url: string
) {
  const data = await apiFetch(
    "/api/ai/notes",
    {
      method: "POST",

      body: JSON.stringify({
        url,
      }),
    }
  );

  console.log(
    "AI Notes API Response:",
    data
  );

  return data;
}


// ==========================================
// AI CHAT
// ==========================================

export async function askAIChat(
  url: string,
  question: string
) {
  const data = await apiFetch(
    "/api/ai/chat",
    {
      method: "POST",

      body: JSON.stringify({
        url,
        question,
      }),
    }
  );

  console.log(
    "AI Chat API Response:",
    data
  );

  return data;
}


// ==========================================
// API BASE URL EXPORT
// ==========================================

export {
  API_BASE_URL
};