import { File } from '@nativescript/core';
import { NativescriptDownloaderCommon } from './common';
export class NativescriptDownloader extends NativescriptDownloaderCommon {
	constructor() {
		super();
		if (global.TNS_WEBPACK) {
			// eslint-disable-next-line
			const WorkerScript = require('nativescript-worker-loader!./android-worker.js');
			this.worker = new WorkerScript();
		} else {
			this.worker = new Worker('./android-worker.js');
		}
	}
	setProgressCallback(callback) {
		this.progressCallback = callback;
	}
	start() {
		return new Promise((resolve) => {
			resolve({});
		});
	}
	download(options) {
		return new Promise((resolve, reject) => {
			const { url, progress, destinationFilePath } = options;
			// we check if options is a string
			// since in older versions of this plugin,
			// destinationFilePath was the second parameter.
			// so we check if options is possibly destinationFilePath {String}
			this.promiseResolve = resolve;
			this.promiseReject = reject;
			this.worker.postMessage({
				url,
				options: options,
				destinationFilePath: destinationFilePath,
			});
			this.worker.onmessage = (msg) => {
				if (msg.data.progress) {
					if (progress) {
						const newProgress = msg.data.progress;
						let value = newProgress;
						if (Array.isArray(newProgress)) {
							value = newProgress[0];
						}
						progress(Number(value) * 100);
					}
				} else if (msg.data.filePath) {
					this.promiseResolve(File.fromPath(msg.data.filePath));
				} else {
					this.promiseReject(msg.data.error);
				}
			};
			this.worker.onerror = (err) => {
				console.log(`An unhandled error occurred in worker: ${err.filename}, line: ${err.lineno} :`);
				this.promiseReject(err.message);
			};
		});
	}
}
//# sourceMappingURL=index.android.js.map
