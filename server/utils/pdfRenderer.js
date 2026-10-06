// server/utils/pdfRenderer.js
// Shared Puppeteer HTML -> PDF renderer.
//
// Why: "--single-process" / "--no-zygote" are needed on small Linux hosts
// (Render), but on Windows/macOS they make Chrome crash during printToPDF
// with "Protocol error (Page.printToPDF): Target closed".
// So those flags are only used on Linux, and if a render still crashes we
// retry once with a normal (multi-process) Chrome.

import puppeteer from "puppeteer";

const BASE_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
];

// set PUPPETEER_SINGLE_PROCESS=true/false in .env to force it either way
const useSingleProcess = () => {
  const env = String(process.env.PUPPETEER_SINGLE_PROCESS || "").toLowerCase();
  if (env === "true") return true;
  if (env === "false") return false;
  return process.platform === "linux";
};

const launch = (singleProcess) =>
  puppeteer.launch({
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: singleProcess
      ? [...BASE_ARGS, "--no-zygote", "--single-process"]
      : BASE_ARGS,
  });

async function renderOnce(html, pdfOptions, singleProcess) {
  const browser = await launch(singleProcess);
  try {
    const page = await browser.newPage();

    // HTML is fully inline, so waiting for "load" is enough;
    // networkidle0 can hang/flake when there are no network requests
    await page.setContent(html, { waitUntil: "load", timeout: 30000 });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
      ...pdfOptions,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => {});
  }
}

export async function renderHtmlToPdf(html, pdfOptions = {}) {
  const singleProcess = useSingleProcess();

  try {
    return await renderOnce(html, pdfOptions, singleProcess);
  } catch (err) {
    const crashed = /Target closed|Session closed|Protocol error|crash/i.test(
      err.message || "",
    );
    if (!singleProcess || !crashed) throw err;

    console.warn(
      "⚠️ PDF render crashed in single-process mode, retrying normally:",
      err.message,
    );
    return renderOnce(html, pdfOptions, false);
  }
}