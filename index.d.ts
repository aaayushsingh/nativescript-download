import { File } from "@nativescript/core";
import { NativescriptDownloaderCommon } from './common';

export declare class NativescriptDownloader extends NativescriptDownloaderCommon {
    constructor();
    onProgress(callBack: onProgressCallback): null;
    download(options: downloadOptions): Promise<File>
}

export declare type ProgressCallback = (progress: number) => void;
