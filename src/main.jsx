import "./styles.css"; // <--- sửa từ style.css hoặc /src/styles.css
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")).render(<App />);
