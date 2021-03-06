import { NativescriptDownloaderCommon } from './common';


import { path, knownFolders } from '@nativescript/core';
const main_queue = dispatch_get_current_queue();
declare const AFURLSessionManager, NSURLSessionConfiguration, NSURLRequest;

export enum StatusCode {
    PENDING = 'pending',
    PAUSED = 'paused',
    DOWNLOADING = 'downloading',
    COMPLETED = 'completed',
    ERROR = 'error'
  }

  export function generateId(): string {
    return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

export class NativescriptDownloader extends NativescriptDownloaderCommon {
    tasksReader = new NativePropertyReader();
    constructor() {
      super();
      this.downloads = new Map();
      this.downloadsData = new Map();
      NativescriptDownloader.timeout = 6000;
    }
    private static timeout = 60;
  
    downloads;
     downloadsData;
     downloadPath;
    
    public static init() {}
  
    public static setTimeout(timeout: number) {
        NativescriptDownloader.timeout = timeout;
    }
  
    public download(options: any): any {
      if (options && !options.url) throw new Error('Url missing');
      const id = generateId();
      // TODO
    //   NSURLSessionConfiguration.backgroundSessionConfigurationWithIdentifier("NSDownloader");
      const configuration = NSURLSessionConfiguration.defaultSessionConfiguration;
      configuration.timeoutIntervalForRequest = NativescriptDownloader.timeout;
      configuration.timeoutIntervalForResource = NativescriptDownloader.timeout;
      const download = AFURLSessionManager.alloc().initWithSessionConfiguration(
        configuration
      );
      let url;
      let query;
      if (options.query) {
        if (typeof options.query === 'object') {
          const keysArray = Object.keys(options.query);
          query = '';
          for (let key of keysArray) {
            query += key + '=' + options.query[key] + '&';
          }
        } else if (typeof options.query === 'string') {
          query = options.query;
        }
        url = encodeURI(options.url + query);
      } else {
        url = options.url;
      }
  
      const request = NSMutableURLRequest.requestWithURL(
        NSURL.URLWithString(url)
      );
      let downloadPath = '';
      if (options.path && options.fileName) {
        downloadPath = path.join(options.path, options.fileName);
        this.downloadPath = downloadPath;
      } 
    //   else if (!options.path && options.fileName) {
    //     downloadPath = path.join(knownFolders.temp().path, options.fileName);
    //   } else if (options.path && !options.fileName) {
    //     downloadPath = path.join(options.path, `${generateId()}`);
    //   } else {
    //     downloadPath = path.join(knownFolders.temp().path, `${generateId()}`);
    //   }
  
      if (options.headers) {
        for (const header in options.headers) {
          request.setValueForHTTPHeaderField(
            options.headers[header] + '',
            header
          );
        }
      }
  
      const ref = new WeakRef(this);
      let lastRefreshTime = 0;
      let lastBytesWritten = 0;
  
      const task = download.downloadTaskWithRequestProgressDestinationCompletionHandler(
        request,
        progress => {
          dispatch_async(main_queue, () => {
            const owner = ref.get();
            // const state = this.tasksReader.readProp(task, "state", interop.types.int32);
            if (true) {
              const current = Math.floor(
                Math.round(progress.fractionCompleted * 100)
              );
              if (owner.downloadsData.has(id)) {
                const data = owner.downloadsData.get(id);
                if (data) {
                  if (data.status && data.status !== StatusCode.DOWNLOADING) {
                    owner.downloadsData.set(
                      id,
                      Object.assign({}, data, {
                        status: StatusCode.DOWNLOADING
                      })
                    );
                  }
                }
                const callback = data.callback;
                let speed;
                const currentBytes = task.countOfBytesReceived;
                const totalBytes = progress.totalUnitCount;
                let currentTime = Date.now();
                let minTime = 100;
  
                if (
                  currentTime - lastRefreshTime >= minTime ||
                  currentBytes === totalBytes
                ) {
                  let intervalTime = currentTime - lastRefreshTime;
                  if (intervalTime === 0) {
                    intervalTime += 1;
                  }
                  const updateBytes = currentBytes - lastBytesWritten;
                  speed = Math.floor(Math.round(updateBytes / intervalTime));
  
                  if (callback && typeof callback === 'function') {
                    callback({
                      value: current,
                      speed: speed,
                      currentSize: currentBytes,
                      totalSize: progress.totalUnitCount
                    });
                  }
  
                  lastRefreshTime = Date.now();
                  lastBytesWritten = currentBytes;
                }
              }
            }
            //  else if (state === NSURLSessionTaskState.Suspended) {
            //   const data = owner.downloadsData.get(id);
            //   if (data) {
            //     owner.downloadsData.set(
            //       id,
            //       Object.assign({}, data, {
            //         status: StatusCode.PAUSED
            //       })
            //     );
            //   }
            // }
          });
        },
        (targetPath, response) => {
          const owner = ref.get();
          return NSURL.fileURLWithPath(downloadPath);
        },
        (response, filePath, error) => {
          const owner = ref.get();
          if (error) {
            if (owner.downloadsData.has(id)) {
              const data = owner.downloadsData.get(id);
              const reject = data.reject;
              reject({
                status: StatusCode.ERROR,
                message: error.localizedDescription,
                path: filePath
              });
            }
          } else {
            // const state = this.tasksReader.readProp(task, "state", interop.types.int32);
            if (
            //   state === NSURLSessionTaskState.Completed &&
              !task.error
            ) {
              if (owner.downloadsData.has(id)) {
                const data = owner.downloadsData.get(id);
                const resolve = data.resolve;
                resolve({
                  status: StatusCode.COMPLETED,
                  message: null,
                  path: this.downloadPath
                });
              }
            }
          }
        }
      );
      this.downloads.set(id, task);
      this.downloadsData.set(id, {
        status: StatusCode.PENDING,
        path: path
      });
      return this.start(id, options.progress);
    }
  
    public start(id: string, progress?: Function): Promise<any> {
      return new Promise((resolve, reject) => {
        if (id && this.downloads.has(id)) {

          const data = this.downloadsData.get(id);
          this.downloadsData.set(
            id,
            Object.assign({}, data, {
              reject: reject,
              resolve: resolve,
              callback: progress
            })
          );

          const task = this.downloads.get(id);
          if (task) {
            task.resume();
          }
        } else {
          reject({ message: 'Download ID not found.' });
        }
      });
    }
  
    // public getStatus(id: string): StatusCode {
    //   if (id && this.downloads.has(id)) {
    //     const download = this.downloadsData.get(id);
    //     return download.status;
    //   }
    //   return StatusCode.PENDING;
    // }
  
    // public pause(id: string) {
    //   if (id && this.downloads.has(id)) {
    //     const task = this.downloads.get(id);
    //     if (task) {
    //       task.suspend();
    //       const data = this.downloadsData.get(id);
    //       if (data) {
    //         this.downloadsData.set(
    //           id,
    //           Object.assign({}, data, {
    //             status: StatusCode.PAUSED
    //           })
    //         );
    //       }
    //     }
    //   }
    // }
  
    // public resume(id: string): void {
    //   if (id && this.downloads.has(id)) {
    //     const task = this.downloads.get(id);
    //     if (task) {
    //       task.resume();
    //     }
    //   }
    // }
  
    // public cancel(id: string): void {
    //   if (id && this.downloads.has(id)) {
    //     const task = this.downloads.get(id);
    //     if (task) {
    //       task.cancel();
    //     }
    //   }
    // }
  
    // public getPath(id: string): string {
    //   if (id && this.downloadsData.has(id)) {
    //     const data = this.downloadsData.get(id);
    //     if (data) {
    //       return data.path;
    //     }
    //     return null;
    //   }
    //   return null;
    // }
  }
  
  
  
  class NativePropertyReader {
    private _invocationCache = new Map<string, NSInvocation>();
  
    private getInvocationObject(object: NSObject, selector: string): NSInvocation {
        let invocation = this._invocationCache.get(selector);
        if (!invocation) {
            const sig = object.methodSignatureForSelector(selector);
            invocation = NSInvocation.invocationWithMethodSignature(sig);
            invocation.selector = selector;
  
            this._invocationCache[selector] = invocation;
        }
  
        return invocation;
    }
  
    public readProp<T>(object: NSObject, prop: string, type: interop.Type<T>): T {
        const invocation = this.getInvocationObject(object, prop);
        invocation.invokeWithTarget(object);
  
        const ret = new interop.Reference<T>(type, new interop.Pointer());
        invocation.getReturnValue(ret);
  
        return ret.value;
    }
}