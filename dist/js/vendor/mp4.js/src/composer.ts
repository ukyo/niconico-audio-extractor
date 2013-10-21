/// <reference path="mp4.ts" />

module Mp4.Builder {

  export class BaseBuilder extends BitWriter {
    build(): Uint8Array {
      return this.data;
    }
  }

}