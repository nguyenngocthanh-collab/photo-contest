import React, { useRef, useState, useEffect } from "react";

const APPS_SCRIPT_WEBHOOK = "https://script.google.com/macros/s/AKfycbyjQqYY9T21WcEFdVojNFsVDX2Cj1qpE42obbnr71Du1smL6B5HMssS4AzXSgmsRsAh/exec"; // Thay WEB_APP_ID

export default function App() {
  const canvasRef = useRef(null);
  const imgRef = useRef(new Image());
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [className, setClassName] = useState("");
  const [dept, setDept] = useState("");

  const [imgLoaded, setImgLoaded] = useState(false);
  const [filename, setFilename] = useState("");
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const CANVAS_SIZE = 1000;
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Upload ảnh
  function handleFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFilename(f.name || "photo.png");
    const reader = new FileReader();
    reader.onload = (ev) => {
      imgRef.current = new Image();
      imgRef.current.crossOrigin = "anonymous";
      imgRef.current.src = ev.target.result;
      imgRef.current.onload = () => setImgLoaded(true);
    };
    reader.readAsDataURL(f);
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (imgLoaded && imgRef.current) {
      const img = imgRef.current;
      const imgRatio = img.width / img.height;
      let baseW = CANVAS_SIZE,
        baseH = CANVAS_SIZE;
      if (imgRatio > 1) {
        baseH = CANVAS_SIZE;
        baseW = imgRatio * baseH;
      } else {
        baseW = CANVAS_SIZE;
        baseH = baseW / imgRatio;
      }
      const drawX = (CANVAS_SIZE - baseW) / 2 + pos.x;
      const drawY = (CANVAS_SIZE - baseH) / 2 + pos.y;
      ctx.save();
      ctx.translate(drawX + baseW / 2, drawY + baseH / 2);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Chọn ảnh để bắt đầu", CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    }
  }

  useEffect(() => draw(), [imgLoaded, pos, scale]);

  function confirmImage() {
    if (!imgLoaded) return alert("Vui lòng chọn ảnh.");
    const dataUrl = canvasRef.current.toDataURL("image/png");
    window._exportedImage = dataUrl;
    setStep(2);
    window.scrollTo(0, 0);
  }

  async function submitAll(e) {
    e.preventDefault();
    const exported = window._exportedImage;
    if (!exported) return alert("Ảnh chưa xác nhận.");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("school", school);
      formData.append("className", className);
      formData.append("dept", dept);
      formData.append("filename", filename);
      formData.append("file", exported);

      await fetch(APPS_SCRIPT_WEBHOOK, {
        method: "POST",
        body: formData
      });

      alert("Gửi thành công!");
      setStep(1);
      setName("");
      setSchool("");
      setClassName("");
      setDept("");
      setImgLoaded(false);
    } catch (err) {
      alert("Gửi thất bại: " + err.message);
    }
  }

  return (
    <div>
      {step === 1 && (
        <div>
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />
          <input type="file" accept="image/*" onChange={handleFile} />
          <button onClick={confirmImage}>Xác nhận ảnh</button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={submitAll}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Họ tên" required />
          <input value={school} onChange={e => setSchool(e.target.value)} placeholder="Trường" required />
          <input value={className} onChange={e => setClassName(e.target.value)} placeholder="Lớp" required />
          <input value={dept} onChange={e => setDept(e.target.value)} placeholder="Khoa/Ngành" required />
          <button type="submit">Gửi</button>
        </form>
      )}
    </div>
  );
}
