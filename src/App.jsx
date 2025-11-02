import React, { useRef, useState, useEffect } from "react";

/*
Mobile-first Photo Contest App
Flow:
1) Upload & edit image in canvas (drag / pinch / zoom)
2) Confirm image -> go to form
3) Submit: text->Google Form, imageBase64->Apps Script Webhook (saves to Drive)
*/

// --- CONFIG (CẬP NHẬT THEO CỦA BẠN) ---
const GOOGLE_FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSc4JMeqXNyZi9xzrCjJtIcWtgEumz2QU34Jo-CxNbvny7b6qA/formResponse";
const ENTRY_NAME = "entry.450327785";
const ENTRY_SCHOOL = "entry.1715000447";
const ENTRY_CLASS = "entry.2121292925";
const ENTRY_DEPT = "entry.544016220";
const APPS_SCRIPT_WEBHOOK = "https://script.google.com/macros/s/AKfycbx-xotKaLaSKqHpFkbojZa7DqpJ4H_kTBbJfSH0gTEJIR7t_9G07Ksn9PQfpu7BrssM/exec";
// --- END CONFIG ---

export default function App() {
  const canvasRef = useRef(null);
  const imgRef = useRef(new Image());
  const frameRef = useRef(new Image());
  const fileRef = useRef(null);

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [className, setClassName] = useState("");
  const [dept, setDept] = useState("");
  const [filename, setFilename] = useState("");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);

  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const CANVAS_SIZE = 1000;

  useEffect(() => {
    frameRef.current.src = "/frame.png"; // nếu có frame
    frameRef.current.crossOrigin = "anonymous";
    frameRef.current.onload = () => setFrameLoaded(true);
  }, []);

  useEffect(() => draw(), [imgLoaded, frameLoaded, scale, pos]);

  function handleFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFilename(f.name || "photo.png");
    const reader = new FileReader();
    reader.onload = (ev) => {
      imgRef.current = new Image();
      imgRef.current.crossOrigin = "anonymous";
      imgRef.current.src = ev.target.result;
      imgRef.current.onload = () => {
        setScale(1);
        setPos({ x: 0, y: 0 });
        setImgLoaded(true);
      };
    };
    reader.readAsDataURL(f);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onDown(e) {
      dragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!dragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
    function onUp(e) {
      dragging.current = false;
      try {
        canvas.releasePointerCapture && canvas.releasePointerCapture(e.pointerId);
      } catch {}
    }
    function onWheel(e) {
      e.preventDefault();
      const delta = -e.deltaY / 500;
      setScale((s) => Math.min(Math.max(0.3, s + delta), 5));
    }

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    let lastDist = null;
    const canvas = canvasRef.current;
    if (!canvas) return;

    function dist(t1, t2) {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function onTouchStart(e) {
      if (e.touches && e.touches.length === 2) lastDist = dist(e.touches[0], e.touches[1]);
    }
    function onTouchMove(e) {
      if (e.touches && e.touches.length === 2 && lastDist) {
        const d = dist(e.touches[0], e.touches[1]);
        const diff = (d - lastDist) / 200;
        lastDist = d;
        setScale((s) => Math.min(Math.max(0.3, s + diff), 5));
      }
    }
    function onTouchEnd(e) {
      if (!e.touches || e.touches.length < 2) lastDist = null;
    }

    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchmove", onTouchMove);
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = CANVAS_SIZE,
      H = CANVAS_SIZE;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);

    if (imgLoaded && imgRef.current) {
      const img = imgRef.current;
      const imgRatio = img.width / img.height;
      let baseW = W,
        baseH = H;
      if (imgRatio > 1) {
        baseH = H;
        baseW = imgRatio * baseH;
      } else {
        baseW = W;
        baseH = baseW / imgRatio;
      }
      const drawX = (W - baseW) / 2 + pos.x;
      const drawY = (H - baseH) / 2 + pos.y;
      ctx.save();
      ctx.translate(drawX + baseW / 2, drawY + baseH / 2);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Chọn ảnh để bắt đầu", W / 2, H / 2);
    }

    if (frameLoaded && frameRef.current) {
      try {
        ctx.drawImage(frameRef.current, 0, 0, W, H);
      } catch {}
    } else {
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#fff";
      ctx.strokeRect(0, 0, W, H);
    }
  }

  function confirmImage() {
    if (!imgLoaded) return alert("Vui lòng chọn ảnh.");
    const dataUrl = canvasRef.current.toDataURL("image/png");
    window._exportedImage = dataUrl;
    setStep(2);
    window.scrollTo(0, 0);
  }

  async function postWithRetry(url, payload, retries = 3, delay = 500) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (data.status === "ok") return data;
        throw new Error(data.message || "Upload lỗi");
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  async function submitAll(e) {
    e.preventDefault();
    const exported = window._exportedImage;
    if (!exported) return alert("Ảnh chưa xác nhận.");

    try {
      // 1️⃣ Gửi Google Form
      const formBody = new URLSearchParams();
      formBody.append(ENTRY_NAME, name);
      formBody.append(ENTRY_SCHOOL, school);
      formBody.append(ENTRY_CLASS, className);
      formBody.append(ENTRY_DEPT, dept);
      await fetch(GOOGLE_FORM_ACTION, { method: "POST", body: formBody, mode: "no-cors" });

      // 2️⃣ Gửi Apps Script Webhook
      const payload = { name, school, className, dept, filename: filename || "photo.png", imageBase64: exported };
      const result = await postWithRetry(APPS_SCRIPT_WEBHOOK, payload);
      alert("Gửi thành công! Link ảnh: " + result.driveUrl);
      setStep(1);
      setImgLoaded(false);
    } catch (err) {
      console.error(err);
      alert("Gửi thất bại: " + err.message);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 16 }}>
      {step === 1 && (
        <>
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ width: "100%", border: "1px solid #ccc" }} />
          <input type="file" accept="image/*" onChange={handleFile} />
          <button onClick={confirmImage}>Xác nhận ảnh</button>
        </>
      )}
      {step === 2 && (
        <form onSubmit={submitAll}>
          <input placeholder="Họ và tên" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Trường" value={school} onChange={(e) => setSchool(e.target.value)} required />
          <input placeholder="Lớp" value={className} onChange={(e) => setClassName(e.target.value)} required />
          <input placeholder="Khoa/Ngành" value={dept} onChange={(e) => setDept(e.target.value)} required />
          <button type="submit">Gửi</button>
        </form>
      )}
    </div>
  );
}
