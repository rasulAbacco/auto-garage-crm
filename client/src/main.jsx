// client/src/main.jsx
// ⚠️ Keep your existing imports / providers — the only required change is:
//    await initAuthStorage() BEFORE rendering, so the saved session is back
//    in localStorage before any route or component reads the token.
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { initAuthStorage } from "./utils/authStorage";

async function bootstrap() {
  await initAuthStorage();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}

bootstrap();
