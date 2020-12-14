import { NativescriptDownloaderCommon } from './common';
export declare enum StatusCode {
    PENDING = "pending",
    PAUSED = "paused",
    DOWNLOADING = "downloading",
    COMPLETED = "completed",
    ERROR = "error"
}
export declare function generateId(): string;
export declare class NativescriptDownloader extends NativescriptDownloaderCommon {
    tasksReader: NativePropertyReader;
    constructor();
    private static timeout;
    downloads: any;
    downloadsData: any;
    static init(): void;
    static setTimeout(timeout: number): void;
    download(options: any): any;
    start(id: string, progress?: Function): Promise<any>;
}
declare class NativePropertyReader {
    private _invocationCache;
    private getInvocationObject;
    readProp<T>(object: NSObject, prop: string, type: interop.Type<T>): T;
}
export {};
