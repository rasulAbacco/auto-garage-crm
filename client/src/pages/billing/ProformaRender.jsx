// client/src/pages/billing/ProformaRender.jsx
// Bare page the server (puppeteer) opens to turn a proforma into a PDF. No app chrome.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Invoice from "./Invoice";

const API = import.meta.env.VITE_API_BASE_URL;

export default function ProformaRender() {
  const { token } = useParams();
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/invoice/render/${token}`)
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !data)
          throw new Error(data?.message || "Invoice not found");
        setDraft(data);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  if (error)
    return (
      <div
        style={{
          padding: 24,
          fontSize: 14,
          fontFamily: "sans-serif",
          color: "#DC2626",
        }}
      >
        {error}
      </div>
    );
  if (!draft) return null; // puppeteer waits for the sheet

  return (
    <div style={{ background: "#ffffff", padding: 0 }} data-render-ready="true">
      <Invoice previewData={draft} />
    </div>
  );
}
