import { Observable } from '@nativescript/core';
export declare abstract class NativescriptDownloaderCommon extends Observable {
    constructor();
    abstract download(options: any): any;
}
