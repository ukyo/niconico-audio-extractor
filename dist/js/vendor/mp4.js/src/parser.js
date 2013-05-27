var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Mp4;
(function (Mp4) {
    (function (Parser) {
        var BaseParser = (function (_super) {
            __extends(BaseParser, _super);
            function BaseParser() {
                _super.apply(this, arguments);

            }
            BaseParser.prototype.parse = function () {
                throw new Error('not implemented error.');
            };
            return BaseParser;
        })(Mp4.BitReader);
        Parser.BaseParser = BaseParser;        
    })(Mp4.Parser || (Mp4.Parser = {}));
    var Parser = Mp4.Parser;
})(Mp4 || (Mp4 = {}));
//@ sourceMappingURL=parser.js.map
