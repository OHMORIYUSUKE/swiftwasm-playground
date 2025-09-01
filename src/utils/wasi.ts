type SetOutputFunction = (updater: (prev: string) => string) => void;

export function createWasiImports(setOutput: SetOutputFunction) {
  let instance: WebAssembly.Instance;
  
  return {
    wasi_snapshot_preview1: {
      // ファイルディスクリプタにデータを書き込む（標準出力・標準エラー出力のエミュレーション）
      fd_write: (fd: number, iovs: number, iovsLen: number, nwritten: number) => {
        // fd === 1: 標準出力(stdout), fd === 2: 標準エラー出力(stderr)
        if (fd === 1 || fd === 2) { 
          // WebAssemblyインスタンスのメモリを取得
          const memory = (instance.exports.memory as WebAssembly.Memory);
          const buffer = new Uint8Array(memory.buffer);
          
          let totalWritten = 0; // 実際に書き込まれたバイト数の合計
          
          // iovs（iovec配列）をループ処理
          // iovecは { データのポインタ, データの長さ } の構造体
          for (let i = 0; i < iovsLen; i++) {
            // 各iovecの位置を計算（8バイトずつ: ポインタ4バイト + 長さ4バイト）
            const iovPtr = iovs + i * 8;
            
            // DataViewを使ってメモリから値を読み取り
            const strPtr = new DataView(memory.buffer).getUint32(iovPtr, true);      // 文字列の開始アドレス
            const strLen = new DataView(memory.buffer).getUint32(iovPtr + 4, true);  // 文字列の長さ
            
            // メモリから文字列データを取得してデコード
            const str = new TextDecoder().decode(buffer.slice(strPtr, strPtr + strLen));
            
            // Reactのstate更新関数を使って出力を表示
            setOutput(prev => prev + str);
            
            // 書き込まれたバイト数を累積
            totalWritten += strLen;
          }
          
          // nwrittenポインタに実際に書き込まれたバイト数を書き込み
          // これにより、SwiftWasm側で書き込み結果を確認できる
          new DataView(memory.buffer).setBigUint64(nwritten, BigInt(totalWritten), true);
          return 0; // 成功を示す戻り値
        }
        
        // 標準出力・標準エラー出力以外のファイルディスクリプタの場合はエラー
        return -1; // エラーを示す戻り値
      },
      fd_close: () => 0,
      fd_seek: () => 0,
      proc_exit: (code: number) => {
        if (code !== 0) {
          setOutput(prev => prev + `\nプロセスが終了コード ${code} で終了しました\n`);
        }
      },
      environ_sizes_get: (environCount: number, environBufSize: number) => {
        const memory = (instance.exports.memory as WebAssembly.Memory);
        new DataView(memory.buffer).setUint32(environCount, 0, true);
        new DataView(memory.buffer).setUint32(environBufSize, 0, true);
        return 0;
      },
      environ_get: () => 0,
      args_sizes_get: (argCount: number, argBufSize: number) => {
        const memory = (instance.exports.memory as WebAssembly.Memory);
        new DataView(memory.buffer).setUint32(argCount, 0, true);
        new DataView(memory.buffer).setUint32(argBufSize, 0, true);
        return 0;
      },
      args_get: () => 0,
      clock_time_get: (id: number, precision: bigint, time: number) => {
        const memory = (instance.exports.memory as WebAssembly.Memory);
        const now = BigInt(Date.now() * 1000000); // ナノ秒に変換
        new DataView(memory.buffer).setBigUint64(time, now, true);
        return 0;
      },
      clock_res_get: (id: number, resolution: number) => {
        const memory = (instance.exports.memory as WebAssembly.Memory);
        // 1ミリ秒の解像度を設定（ナノ秒単位）
        new DataView(memory.buffer).setBigUint64(resolution, BigInt(1000000), true);
        return 0;
      },
      random_get: (buf: number, bufLen: number) => {
        const memory = (instance.exports.memory as WebAssembly.Memory);
        const buffer = new Uint8Array(memory.buffer, buf, bufLen);
        crypto.getRandomValues(buffer);
        return 0;
      },
      fd_fdstat_get: (fd: number, stat: number) => {
        // ファイルディスクリプタの統計情報を設定
        const memory = (instance.exports.memory as WebAssembly.Memory);
        const view = new DataView(memory.buffer);
        
        // fdstat構造体のフィールドを設定
        view.setUint8(stat, 0); // fs_filetype: unknown
        view.setUint16(stat + 2, 0, true); // fs_flags
        view.setBigUint64(stat + 8, BigInt(0), true); // fs_rights_base
        view.setBigUint64(stat + 16, BigInt(0), true); // fs_rights_inheriting
        
        return 0;
      },
      fd_prestat_get: () => 8, // EBADF: Bad file descriptor
      fd_prestat_dir_name: () => 8, // EBADF: Bad file descriptor
      path_open: () => 76, // ENOTCAPABLE: Insufficient rights
      fd_read: (fd: number, iovs: number, iovsLen: number, nread: number) => {
        if (fd === 0) { // stdin
          const memory = (instance.exports.memory as WebAssembly.Memory);
          const buffer = new Uint8Array(memory.buffer);
          
          // ブラウザのアラートで入力を取得
          const input = prompt("標準入力:");
          if (input === null) {
            // キャンセルされた場合
            new DataView(memory.buffer).setUint32(nread, 0, true);
            return 0;
          }
          
          // 改行文字を追加
          const inputWithNewline = input + '\n';
          const inputBytes = new TextEncoder().encode(inputWithNewline);
          
          let totalRead = 0;
          for (let i = 0; i < iovsLen; i++) {
            const iovPtr = iovs + i * 8;
            const bufPtr = new DataView(memory.buffer).getUint32(iovPtr, true);
            const bufLen = new DataView(memory.buffer).getUint32(iovPtr + 4, true);
            
            // 入力データをメモリにコピー
            const bytesToCopy = Math.min(bufLen, inputBytes.length - totalRead);
            if (bytesToCopy > 0) {
              buffer.set(inputBytes.slice(totalRead, totalRead + bytesToCopy), bufPtr);
              totalRead += bytesToCopy;
            }
            
            if (totalRead >= inputBytes.length) break;
          }
          
          // nreadにtotalReadを書き込み
          new DataView(memory.buffer).setUint32(nread, totalRead, true);
          return 0;
        }
        return 8; // EBADF: Bad file descriptor
      },
      fd_readdir: () => 8, // EBADF: Bad file descriptor
      fd_filestat_get: () => 8, // EBADF: Bad file descriptor
      path_filestat_get: () => 76, // ENOTCAPABLE: Insufficient rights
      poll_oneoff: () => 52, // ENOSYS: Function not implemented
      sched_yield: () => 0, // スケジューラにCPUを譲る
      fd_sync: () => 0, // ファイル同期（何もしない）
      fd_datasync: () => 0, // データ同期（何もしない）
      path_create_directory: () => 76, // ENOTCAPABLE: Insufficient rights
      path_remove_directory: () => 76, // ENOTCAPABLE: Insufficient rights
      path_unlink_file: () => 76, // ENOTCAPABLE: Insufficient rights
    },
    setInstance: (wasmInstance: WebAssembly.Instance) => {
      instance = wasmInstance;
    }
  };
} 