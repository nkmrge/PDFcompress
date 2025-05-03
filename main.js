// Ghostscript WASM ラッパを CDN から取得
import { createGhostscript } from "https://unpkg.com/@jspawn/ghostscript-wasm@0.4.5/dist/ghostscript.esm.js";

(async () => {                   // ← ここがポイント：即時 async 関数
  const gs   = await createGhostscript();   // 初期化
  const file = document.getElementById('file');
  const btn  = document.getElementById('compress');
  const bar  = document.getElementById('prog');

  // ファイル選択でボタン有効化
  file.addEventListener('change', () => {
    btn.disabled = !file.files.length;
  });

  btn.addEventListener('click', async () => {
    const f = file.files[0];
    if (!f) return;

    // ① 入力 PDF を仮想 FS へ
    const input = new Uint8Array(await f.arrayBuffer());
    gs.FS.writeFile('in.pdf', input);

    // ② Ghostscript 実行
    await gs.run([
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      "-dPDFSETTINGS=/ebook",   // 画質プリセット
      "-dNOPAUSE", "-dBATCH", "-dSAFER", "-q",
      "-sOutputFile=out.pdf",
      "in.pdf"
    ], p => bar.value = p);     // 0–100

    // ③ DL
    const out = gs.FS.readFile('out.pdf');
    const url = URL.createObjectURL(new Blob([out], { type:"application/pdf" }));
    const a   = Object.assign(document.createElement('a'), {
      href:url,
      download:f.name.replace(/\.pdf$/i,'_small.pdf')
    });
    a.click();
    URL.revokeObjectURL(url);

    // 後始末
    bar.value = 0;
    btn.disabled = true;
    gs.FS.unlink('in.pdf');
    gs.FS.unlink('out.pdf');
  });
})();
