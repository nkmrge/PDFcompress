// Ghostscript WASM ラッパを ローカルから取得
import createGs from "./gs.mjs";

(async () => {                   // ← ここがポイント：即時 async 関数
  const Module = await createGs();   // 初期化
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

    try {
      // ① 入力 PDF を仮想 FS へ
      const input = new Uint8Array(await f.arrayBuffer());
      Module.FS.writeFile('in.pdf', input);

      // ② Ghostscript 実行
      const args = [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/ebook",   // 画質プリセット
        "-dNOPAUSE", "-dBATCH", "-dSAFER", "-q",
        "-sOutputFile=out.pdf",
        "in.pdf"
      ];
      
      const updateProgress = (p) => {
        bar.value = p;
      };
      
      // Ghostscript実行
      await new Promise((resolve) => {
        Module.callMain(args);
        updateProgress(100);
        resolve();
      });

      // ③ DL
      const out = Module.FS.readFile('out.pdf');
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
      Module.FS.unlink('in.pdf');
      Module.FS.unlink('out.pdf');
    } catch (error) {
      console.error('PDF圧縮エラー:', error);
      alert('PDF圧縮中にエラーが発生しました。');
      bar.value = 0;
      btn.disabled = false;
    }
  });
})();
