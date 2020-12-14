import { NativescriptDownloaderCommon } from './common';
export declare type ProgressCallback = (progress: number) => void;
export declare class NativescriptDownloader extends NativescriptDownloaderCommon {
    private promiseResolve;
    private promiseReject;
    private progressCallback;
    private worker;
    constructor();
    setProgressCallback(callback: ProgressCallback): void;
    start(): Promise<any>;
    download(options: any): any;
}
