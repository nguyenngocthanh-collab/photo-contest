// /api/upload.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const data = req.body;

    // gửi request lên Google Apps Script
    const response = await fetch("https://script.google.com/macros/s/AKfycbwpYZX3eghohJ67EnbqAtdfqfaPbMnQf7nSVNqgknr6rjR83HiL3REkUkblxRDkKBTs/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const text = await response.text();
    res.status(200).send(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed", error: err.toString() });
  }
}
