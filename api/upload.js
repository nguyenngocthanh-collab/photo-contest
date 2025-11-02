export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const APPS_SCRIPT_WEBHOOK = "https://script.google.com/macros/s/AKfycbyjQqYY9T21WcEFdVojNFsVDX2Cj1qpE42obbnr71Du1smL6B5HMssS4AzXSgmsRsAh/exec";

  try {
    const response = await fetch(APPS_SCRIPT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    // Nếu Apps Script trả text, parse JSON sẽ fail → fallback
    let data;
    try {
      data = await response.json();
    } catch {
      data = { message: await response.text() };
    }

    res.status(200).json({ status: "ok", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.toString() });
  }
}
