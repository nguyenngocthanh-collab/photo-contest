import React, { useRef, useState, useEffect } from "react";

/*
PhotoContestApp.jsx
- Mobile-first upload + drag/zoom + overlay frame + post to Google Form
- Replace the GOOGLE_FORM_ACTION and ENTRY_* variables with your Google Form values.
*/

const GOOGLE_FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSc4JMeqXNyZi9xzrCjJtIcWtgEumz2QU34Jo-CxNbvny7b6qA/formResponse"; // <-- REPLACE
const ENTRY_NAME = "entry.450327785";    // <-- REPLACE
const ENTRY_SCHOOL = "entry.1715000447";  // <-- REPLACE
const ENTRY_CLASS = "entry.2121292925";   // <-- REPLACE
const ENTRY_DEPT = "entry.1738212755";    // <-- REPLACE

export default function PhotoContestApp() {
  const canvasRef = useRef(null);
  const imgRef = useRef(new Image());
  const frameRef = useRef(new Image());
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1); // 1 = edit image, 2 = fill info, 3 = thank you
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [className, setClassName] = useState("");
  const [dept, setDept] = useState("");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [filename, setFilename] = useState("");

  // transformation state
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // internal canvas size for good export
  const CANVAS_SIZE = 1000;

  useEffect(() => {
    frameRef.current.src = "/frame.png"; // put your frame into /public/frame.png
    frameRef.current.crossOrigin = "anonymous";
    frameRef.current.onload = () => setFrameLoaded(true);
  }, []);

  useEffect(() => {
    draw();
  }, [imgLoaded, frameLoaded, scale, pos]);

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

  // pointer events for drag
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onPointerDown(e) {
      dragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e) {
      if (!dragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
    function onPointerUp(e) { dragging.current = false; try{canvas.releasePointerCapture && canvas.releasePointerCapture(e.pointerId);}catch(_){} }
    function onWheel(e){ e.preventDefault(); const delta = -e.deltaY/500; setScale(s => Math.min(Math.max(0.2, s + delta), 5)); }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  // touch pinch zoom
  useEffect(() => {
    let lastDist = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    function dist(t1, t2){ const dx = t1.clientX - t2.clientX; const dy = t1.clientY - t2.clientY; return Math.sqrt(dx*dx+dy*dy); }
    function onTouchStart(e){ if(e.touches && e.touches.length===2) lastDist = dist(e.touches[0], e.touches[1]); }
    function onTouchMove(e){ if(e.touches && e.touches.length===2 && lastDist){ const d = dist(e.touches[0], e.touches[1]); const diff = (d - lastDist)/200; lastDist = d; setScale(s => Math.min(Math.max(0.2, s + diff), 5)); } }
    function onTouchEnd(e){ if(!e.touches || e.touches.length<2) lastDist = null; }
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
    const W = CANVAS_SIZE, H = CANVAS_SIZE;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,W,H);

    if (imgLoaded && imgRef.current) {
      const img = imgRef.current;
      const imgRatio = img.width / img.height;
      const canvasRatio = W / H;
      let baseW = W, baseH = H;
      if (imgRatio > canvasRatio) { baseH = H; baseW = imgRatio * baseH; }
      else { baseW = W; baseH = baseW / imgRatio; }
      const drawX = (W - baseW)/2 + pos.x;
      const drawY = (H - baseH)/2 + pos.y;
      ctx.save();
      ctx.translate(drawX + baseW/2, drawY + baseH/2);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -baseW/2, -baseH/2, baseW, baseH);
      ctx.restore();
    } else {
      // placeholder
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "36px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Chọn ảnh để bắt đầu", W/2, H/2);
    }

    if (frameLoaded) {
      try {
        ctx.drawImage(frameRef.current, 0, 0, W, H);
      } catch (err) { /* ignore */ }
    } else {
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#fff";
      ctx.strokeRect(0,0,W,H);
    }
  }

  // export and move to next step (fill info)
  function confirmImage() {
    // ensure image present
    if (!imgLoaded) { alert("Vui lòng chọn ảnh trước khi xác nhận."); return; }
    // export canvas to dataURL and store in hidden field to submit later
    const dataUrl = canvasRef.current.toDataURL("image/png");
    // store in a hidden input element (we will submit later)
    // simpler: attach to state via hidden anchor or keep dataUrl in memory
    window._exportedImage = dataUrl; // small hack; will be attached when submitting form
    setStep(2);
    // scroll to top (mobile)
    window.scrollTo(0,0);
  }

  // submit to Google Form using a POST to formResponse endpoint
  async function submitToGoogleForm(e) {
    e.preventDefault();
    // get exported image
    const dataUrl = window._exportedImage;
    if (!dataUrl) return alert("Không tìm thấy ảnh đã xác nhận.");

    // Google Forms doesn't accept base64 images via form POST directly.
    // Workaround: we will open a new tab with a prefilled form (easier) OR
    // we can send the image as a string to a simple Apps Script webhook to save image to Drive.
    //
    // To keep it simple (no server): we submit the form fields to Google Form (text)
    // and also upload the image to your Google Drive via a separate Apps Script webhook.
    //
    // Implementation here: we will:
    //  1) POST the text fields to the Google Form endpoint (so name/school/class/dept saved).
    //  2) POST the base64 image to an Apps Script webhook if you set one (optional).
    //
    // For now, we'll do step 1 (saving text). If you want step 2, I will provide Apps Script code.
    try {
      // post text fields to Google Form (formResponse)
      const formBody = new URLSearchParams();
      formBody.append(ENTRY_NAME, name);
      formBody.append(ENTRY_SCHOOL, school);
      formBody.append(ENTRY_CLASS, className);
      formBody.append(ENTRY_DEPT, dept);

      await fetch(GOOGLE_FORM_ACTION, {
        method: "POST",
        body: formBody,
        mode: "no-cors" // Google Form doesn't allow CORS; use no-cors
      });

      // optional: if you prepared an Apps Script webhook to receive the base64 image,
      // send it there. If you want it, I'll give you the Apps Script code and URL to set.
      // Example (uncomment and set YOUR_APPS_SCRIPT_WEBHOOK):
      // await fetch(YOUR_APPS_SCRIPT_WEBHOOK, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ name, school, className, dept, filename, imageBase64: dataUrl })
      // });

      setStep(3);
      window.scrollTo(0,0);
    } catch (err) {
      console.error(err);
      alert("Gửi thất bại. Vui lòng thử lại.");
    }
  }

  // small helper UI sizes
  function canvasStylePixels() {
    // fit width to viewport minus padding
    const px = Math.min(window.innerWidth - 32, 520);
    return { width: px + "px", height: px + "px" };
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sinh nhật đội — Gửi ảnh chúc mừng</h1>

        {step === 1 && (
          <>
            <p style={styles.sub}>Tải ảnh, kéo/zoom sao cho vừa khung → Xác nhận</p>

            <div style={{ marginBottom: 12 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFile}
              />
              <button style={styles.button} onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                Chọn ảnh / Chụp
              </button>
            </div>

            <div style={styles.canvasWrap}>
              <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{...canvasStylePixels(), touchAction: "none"}} />
            </div>

            <div style={styles.row}>
              <button style={styles.btnSecondary} onClick={() => setScale(s => Math.min(5, s + 0.1))}>Zoom +</button>
              <button style={styles.btnSecondary} onClick={() => setScale(s => Math.max(0.2, s - 0.1))}>Zoom −</button>
              <button style={styles.btnPrimary} onClick={confirmImage}>Xác nhận</button>
            </div>
            <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
              Kéo ảnh bằng tay, chụp từ camera hoặc chọn từ thư viện.
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={styles.sectionTitle}>Thông tin thí sinh</h2>
            <form onSubmit={submitToGoogleForm}>
              <label style={styles.label}>Họ và tên</label>
              <input style={styles.input} value={name} onChange={(e)=>setName(e.target.value)} required />

              <label style={styles.label}>Trường</label>
              <input style={styles.input} value={school} onChange={(e)=>setSchool(e.target.value)} required />

              <label style={styles.label}>Lớp</label>
              <input style={styles.input} value={className} onChange={(e)=>setClassName(e.target.value)} />

              <label style={styles.label}>Khoa / Bộ môn</label>
              <input style={styles.input} value={dept} onChange={(e)=>setDept(e.target.value)} />

              <div style={{display:"flex", gap:8, marginTop:12}}>
                <button type="button" style={styles.btnSecondary} onClick={()=>setStep(1)}>Quay lại chỉnh ảnh</button>
                <button type="submit" style={styles.button}>Gửi</button>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={styles.sectionTitle}>Cảm ơn bạn!</h2>
            <p>Ảnh và thông tin của bạn đã được gửi. Kết quả sẽ được công bố sớm.</p>
          </>
        )}

        <div style={{ marginTop: 12, fontSize: 12, color: "#999" }}>
          © Ban tổ chức — Vui lòng chỉ gửi ảnh bạn có quyền sử dụng
        </div>
      </div>
    </div>
  );
}

// simple inline styles to avoid Tailwind setup
const styles = {
  page: { minHeight: "100vh", display:"flex", alignItems:"center", justifyContent:"center", padding: 16, background: "linear-gradient(180deg,#f7fbff,#e8f7ff)" },
  card: { width: "100%", maxWidth: 540, background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 6px 18px rgba(12, 40, 80, 0.08)" },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: "#0b2540" },
  sub: { color: "#526475", marginTop: 6 },
  button: { width: "100%", padding: 12, background: "#0ea5a4", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600 },
  btnPrimary: { padding: 10, background:"#0ea5a4", color:"#fff", border:"none", borderRadius:8, flex:1 },
  btnSecondary: { padding: 10, background:"#f3f4f6", color:"#111827", border:"none", borderRadius:8, flex:1 },
  canvasWrap: { marginTop: 10, borderRadius: 12, overflow: "hidden", background: "#fafafa", display:"flex", justifyContent:"center", alignItems:"center" },
  row: { display:"flex", gap:8, marginTop:12 },
  sectionTitle: { fontSize:16, marginTop:12, marginBottom:8 },
  label: { display:"block", marginTop:8, marginBottom:6, color:"#334155" },
  input: { width:"100%", padding:10, borderRadius:8, border: "1px solid #e2e8f0" }
};

