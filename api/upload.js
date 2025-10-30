// /api/upload.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const APPS_SCRIPT_WEBHOOK = "https://script.google.com/macros/s/AKfycbxZUGsdPfSq8ieDAkFUzWYSwqkj0ueSdFh7D-5evhvGs8OJUmckc7bqd7dNKJcyIJVQ/exec";

  try {
    const response = await fetch(APPS_SCRIPT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json().catch(() => ({})); // Apps Script có thể trả text
    res.status(200).json({ status: "ok", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.toString() });
  }
}
