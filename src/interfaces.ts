export interface IMedia {
  type: string;
  data: Uint8Array;
  name?: string;
}

export interface IDownloadParams {
  pageUrl: string;
  pageTitle: string;
  xhrSuccess(movie: Uint8Array): Uint8Array;
  xhrFail(err: ErrorEvent): ErrorEvent;
  xhrProgress(ev: ProgressEvent): ProgressEvent;
}

export interface ITabInfo {
  url: string;
  title: string;
}
