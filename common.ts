import { File, Observable } from '@nativescript/core';

export abstract class NativescriptDownloaderCommon extends Observable {
    constructor() {
        super();
      }
      public abstract download(options: any): any;
      
}
