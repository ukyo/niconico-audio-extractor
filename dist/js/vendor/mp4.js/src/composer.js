var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Mp4;
(function (Mp4) {
    (function (Builder) {
        var BaseBuilder = (function (_super) {
            __extends(BaseBuilder, _super);
            function BaseBuilder() {
                _super.apply(this, arguments);
            }
            BaseBuilder.prototype.build = function () {
                return this.data;
            };
            return BaseBuilder;
        })(Mp4.BitWriter);
        Builder.BaseBuilder = BaseBuilder;
    })(Mp4.Builder || (Mp4.Builder = {}));
    var Builder = Mp4.Builder;
})(Mp4 || (Mp4 = {}));
//# sourceMappingURL=composer.js.map
