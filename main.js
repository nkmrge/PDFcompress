// main.js
// Ghostscript WASM ラッパを CDN から取得（約 8 MB ほど先読み）
import { createGhostscript } from "https://unpkg.com/@jspawn/ghostscript-wasm@0.4.5/dist/ghostscript.esm.js";

const gs = await createGhostscript();          // 初期化（非同期）
const fileInput = document.getElementById('file');
const btn       = document.getElementById('compress');
const bar       = document.getElementById('prog');

// ファイル選択でボタン有効化
fileInput.addEventListener('change', () => {
  btn.disabled = !fileInput.files.length;
});

btn.onclick = async () => {
  const f   = fileInput.files[0];
  if (!f) return;

  // ① PDF を Uint8Array に読み込んで仮想 FS に書き込み
  const inBuf = new Uint8Array(await f.arrayBuffer());
  gs.FS.writeFile('in.pdf', inBuf);

  // ② Ghostscript 実行
  //    -dPDFSETTINGS=/ebook を /screen, /printer 等に替えると品質を変更可能
  await gs.run([
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.4",
    "-dPDFSETTINGS=/ebook",
    "-dNOPAUSE", "-dBATCH", "-dSAFER", "-q",
    "-sOutputFile=out.pdf",
    "in.pdf"
  ], progress => bar.value = progress);   // progress は 0–100

  // ③ 出力ファイルを取得してダウンロード
  const outBuf = gs.FS.readFile('out.pdf');
  const blob   = new Blob([outBuf], { type: "application/pdf" });
  const url    = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = f.name.replace(/\.pdf$/i, '_small.pdf');
  a.click();

  URL.revokeObjectURL(url);
  bar.value = 0;
  btn.disabled = true;

  // ④ 後始末
  gs.FS.unlink('in.pdf');
  gs.FS.unlink('out.pdf');
};
