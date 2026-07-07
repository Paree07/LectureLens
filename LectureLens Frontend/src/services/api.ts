const API_BASE_URL = "https://lecturelens-production-5dec.up.railway.app";

async function parseResponse(response: Response) {
  let data: any;

  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned invalid response (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}`
    );
  }

  // Important:
  // Backend kabhi HTTP 200 ke saath success:false bhej raha hai
  if (data?.success === false) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}


// ==============================
// BACKEND HEALTH CHECK
// ==============================
export async function checkBackend() {
  const response = await fetch(`${API_BASE_URL}/health`);

  return parseResponse(response);
}


// ==============================
// YOUTUBE METADATA
// ==============================
export async function getYouTubeMetadata(url: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/youtube/metadata`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    }
  );

  return parseResponse(response);
}


// ==============================
// YOUTUBE TRANSCRIPT
// ==============================
export async function getYouTubeTranscript(url: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/youtube/transcript`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    }
  );

  return parseResponse(response);
}


// ==============================
// AI NOTES
// ==============================
export async function generateAINotes(url: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/ai/notes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    }
  );

  const data = await parseResponse(response);

  console.log("AI Notes API Response:", data);

  return data;
}