/// <reference path="mp4.ts" />

module Mp4.Composer {

  export class BaseComposer extends BitWriter {
    compose(): Uint8Array {
      return this.data;
    }
  }

}