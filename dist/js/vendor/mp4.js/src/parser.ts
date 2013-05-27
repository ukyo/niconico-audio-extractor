/// <reference path="mp4.ts" />

module Mp4.Parser {

  export interface IParser {
    parse(): any;
  }

  export class BaseParser extends BitReader implements IParser {
    parse(): any { throw new Error('not implemented error.'); }
  }

}