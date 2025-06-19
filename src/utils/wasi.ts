type SetOutputFunction = (updater: (prev: string) => string) => void;

export function createWasiImports(setOutput: SetOutputFunction) {
  let instance: WebAssembly.Instance;
  
  return {
    wasi_snapshot_preview1: {
      fd_write: (fd: number, iovs: number, iovsLen: number, nwritten: number) => {
        if (fd === 1 || fd === 2) { // stdout or stderr
          const memory = (instance.exports.memory as WebAssembly.Memory);
          const buffer = new Uint8Array(memory.buffer);
          
          let totalWritten = 0;
          for (let i = 0; i < iovsLen; i++) {
            const iovPtr = iovs + i * 8;
            const strPtr = new DataView(memory.buffer).getUint32(iovPtr, true);
            const strLen = new DataView(memory.buffer).getUint32(iovPtr + 4, true);
            
            const str = new TextDecoder().decode(buffer.slice(strPtr, strPtr + strLen));
            setOutput(prev => prev + str);
            totalWritten += strLen;
          }
          
          // nwrittenにtotalWrittenを書き込み
          new DataView(memory.buffer).setUint32(nwritten, totalWritten, true);
          return 0;
        }
        return -1;
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
      fd_read: () => 8, // EBADF: Bad file descriptor
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