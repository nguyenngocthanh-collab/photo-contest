import React, { useRef, useState, useEffect } from "react";

/*
Mobile-first Photo Contest App
Flow:
1) Upload & edit image in canvas (drag / pinch / zoom)
2) Confirm image -> go to form
3) Submit: text->Google Form, imageBase64->Apps Script Webhook (saves to Drive)
*/

// --- CONFIG (THAY THEO CỦA BẠN) ---
const GOOGLE_FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSc4JMeqXNyZi9xzrCjJtIcWtgEumz2QU34Jo-CxNbvny7b6qA/formResponse";
const ENTRY_NAME = "entry.450327785";
const ENTRY_SCHOOL = "entry.1715000447";
const ENTRY_CLASS = "entry.2121292925";
const ENTRY_DEPT = "entry.544016220";

// Apps Script webhook (sau khi deploy) - nếu để "" thì ảnh không được lưu tự động.
const APPS_SCRIPT_WEBHOOK = "https://script.google.com/macros/s/AKfycbzjYNCmkYVbFKvunF4xSXb51BxLq2TWubZGzcySq2vlM2x4wCTByrvjT1WW0h4rEsCP/exec"; // ví dụ: "https://script.google.com/macros/s/AKfycbxxx/exec"

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

  const [imgLoaded, setImgLoaded] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [filename, setFilename] = useState("");

  // transform
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({x:0,y:0});
  const dragging = useRef(false);
  const lastPointer = useRef({x:0,y:0});
  const CANVAS_SIZE = 1000;

  useEffect(() => {
    // load frame from public/frame.png
    frameRef.current.src = "/frame.png";
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
        setPos({x:0,y:0});
        setImgLoaded(true);
      };
    };
    reader.readAsDataURL(f);
  }

  // pointer events (drag) + wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function onDown(e){ dragging.current = true; lastPointer.current = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); }
    function onMove(e){ if(!dragging.current) return; const dx = e.clientX - lastPointer.current.x; const dy = e.clientY - lastPointer.current.y; lastPointer.current = {x:e.clientX,y:e.clientY}; setPos(p=>({x:p.x+dx,y:p.y+dy})); }
    function onUp(e){ dragging.current=false; try{canvas.releasePointerCapture && canvas.releasePointerCapture(e.pointerId);}catch{} }
    function onWheel(e){ e.preventDefault(); const delta = -e.deltaY/500; setScale(s=>Math.min(Math.max(0.3, s+delta), 5)); }

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive:false });

    return ()=> {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  // pinch zoom for touch
  useEffect(()=> {
    let lastDist=null;
    const canvas = canvasRef.current;
    if(!canvas) return;
    function dist(t1,t2){ const dx=t1.clientX-t2.clientX; const dy=t1.clientY-t2.clientY; return Math.sqrt(dx*dx+dy*dy); }
    function onTouchStart(e){ if(e.touches && e.touches.length===2) lastDist = dist(e.touches[0], e.touches[1]); }
    function onTouchMove(e){ if(e.touches && e.touches.length===2 && lastDist){ const d = dist(e.touches[0], e.touches[1]); const diff = (d-lastDist)/200; lastDist = d; setScale(s=>Math.min(Math.max(0.3, s+diff),5)); } }
    function onTouchEnd(e){ if(!e.touches || e.touches.length<2) lastDist = null; }
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchmove", onTouchMove);
    canvas.addEventListener("touchend", onTouchEnd);
    return ()=> {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  function draw() {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = CANVAS_SIZE, H = CANVAS_SIZE;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,W,H);

    if(imgLoaded && imgRef.current) {
      const img = imgRef.current;
      const imgRatio = img.width / img.height;
      let baseW=W, baseH=H;
      if(imgRatio > 1) { baseH = H; baseW = imgRatio * baseH; } else { baseW = W; baseH = baseW / imgRatio; }
      const drawX = (W - baseW)/2 + pos.x;
      const drawY = (H - baseH)/2 + pos.y;
      ctx.save();
      ctx.translate(drawX + baseW/2, drawY + baseH/2);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -baseW/2, -baseH/2, baseW, baseH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Chọn ảnh để bắt đầu", W/2, H/2);
    }

    if(frameLoaded && frameRef.current) {
      try { ctx.drawImage(frameRef.current, 0, 0, W, H); } catch {}
    } else {
      ctx.lineWidth = 6; ctx.strokeStyle = "#fff"; ctx.strokeRect(0,0,W,H);
    }
  }

  function confirmImage() {
    if(!imgLoaded) { alert("Vui lòng chọn ảnh."); return; }
    const dataUrl = canvasRef.current.toDataURL("image/png");
    window._exportedImage = dataUrl;
    setStep(2);
    window.scrollTo(0,0);
  }

  async function submitAll(e) {
    e.preventDefault();
    const exported = window._exportedImage;
    if(!exported) return alert("Ảnh chưa xác nhận.");
    try {
      // 1) POST text fields to Google Form (no-cors)
      const formBody = new URLSearchParams();
      formBody.append(ENTRY_NAME, name);
      formBody.append(ENTRY_SCHOOL, school);
      formBody.append(ENTRY_CLASS, className);
      formBody.append(ENTRY_DEPT, dept);
      // include a note with filename optionally
      formBody.append("entry.9999999999", filename || "photo.png"); // optional extra field if you created
      await fetch(GOOGLE_FORM_ACTION, { method:"POST", body: formBody, mode: "no-cors" });

      // 2) POST base64 image + metadata to Apps Script webhook (if set)
     if (APPS_SCRIPT_WEBHOOK && APPS_SCRIPT_WEBHOOK.length > 10) {
  // 1️⃣ Upload ảnh tạm sang ImgBB (miễn phí)
  const formData = new FormData();
  formData.append("image", exported.split(",")[1]); // lấy phần base64
  const uploadRes = await fetch("https://api.imgbb.com/1/upload?key=YOUR_IMGBB_API_KEY", {
    method: "POST",
    body: formData,
  });
  const uploadJson = await uploadRes.json();
  const imageUrl = uploadJson.data?.url;

  // 2️⃣ Gửi metadata + URL ảnh tới Apps Script
  await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, school, className, dept, filename, imageUrl }),
  });
}


      setStep(3);
      window.scrollTo(0,0);
    } catch(err) {
      console.error(err);
      alert("Gửi thất bại, thử lại.");
    }
  }

  // canvas style sizing for mobile
  function canvasStyle() {
    const fullWidth = Math.min(window.innerWidth - 32, 520);
    return { width: fullWidth + "px", height: fullWidth + "px" };
  }

  return (
    <div className="container">
      <div className="card">
        <h3 className="title">🎉 Sinh nhật đội — Gửi ảnh chúc mừng</h3>
        <p className="sub">Upload ảnh → điều chỉnh sao cho vừa khung → xác nhận → điền thông tin → gửi</p>

        {step === 1 && (
          <>
            <div style={{marginBottom:10}}>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile} />
              <button className="button" onClick={()=> fileRef.current && fileRef.current.click()}>Chọn ảnh / Chụp</button>
            </div>

            <div className="canvas-wrap" style={{padding:12}}>
              <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={canvasStyle()} />
            </div>

            <div className="row" style={{marginTop:10}}>
              <button className="btn-plain" onClick={()=> setScale(s => Math.min(5, s+0.1))}>Zoom +</button>
              <button className="btn-plain" onClick={()=> setScale(s => Math.max(0.3, s-0.1))}>Zoom −</button>
              <button className="button" style={{flex:1}} onClick={confirmImage}>Xác nhận</button>
            </div>
            <div className="small">Kéo ảnh bằng tay, chụp từ camera hoặc chọn từ thư viện.</div>
          </>
        )}

        {step === 2 && (
          <>
            <h4 style={{marginTop:12}}>Thông tin thí sinh</h4>
            <form onSubmit={submitAll}>
              <label className="label">Họ và tên</label>
              <input className="input" value={name} onChange={e=>setName(e.target.value)} required />

              <label className="label">Trường</label>
              <input className="input" value={school} onChange={e=>setSchool(e.target.value)} required />

              <label className="label">Lớp</label>
              <input className="input" value={className} onChange={e=>setClassName(e.target.value)} />

              <label className="label">Khoa / Bộ môn</label>
              <input className="input" value={dept} onChange={e=>setDept(e.target.value)} />

              <div style={{display:"flex",gap:8, marginTop:8}}>
                <button type="button" className="btn-plain" onClick={()=> setStep(1)}>Quay lại chỉnh ảnh</button>
                <button type="submit" className="button" style={{flex:1}}>Gửi</button>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h4 style={{marginTop:12}}>🎉 Cảm ơn bạn đã tham gia!</h4>
            <p className="small">Ảnh và thông tin của bạn đã được ghi nhận. Kết quả sẽ sớm được công bố.</p>
          </>
        )}

        <div className="footer">© Ban tổ chức — Vui lòng chỉ gửi ảnh bạn có quyền sử dụng</div>
      </div>
    </div>
  );
}
