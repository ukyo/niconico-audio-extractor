var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Mp4;
(function (Mp4) {
    (function (Composer) {
        var BaseComposer = (function (_super) {
            __extends(BaseComposer, _super);
            function BaseComposer() {
                _super.apply(this, arguments);

            }
            BaseComposer.prototype.compose = function () {
                return this.data;
            };
            return BaseComposer;
        })(Mp4.BitWriter);
        Composer.BaseComposer = BaseComposer;        
    })(Mp4.Composer || (Mp4.Composer = {}));
    var Composer = Mp4.Composer;
})(Mp4 || (Mp4 = {}));
//@ sourceMappingURL=composer.js.map
