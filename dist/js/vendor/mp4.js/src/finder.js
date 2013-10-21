var Mp4;
(function (Mp4) {
    var Finder = (function () {
        function Finder(tree) {
            this.tree = tree;
        }
        Finder.prototype.findOne = function (type) {
            var box;
            var find = function (tree) {
                if (box)
                    return;
                switch (typeof tree) {
                    case 'number':
                    case 'string':
                    case 'boolean':
                        return;
                }
                if (tree.type === type) {
                    return box = tree;
                }
                if (tree.buffer)
                    return;
                Object.keys(tree).forEach(function (key) {
                    var prop = tree[key];
                    if (prop == null)
                        return;
                    if (Array.isArray(prop)) {
                        prop.some(find);
                    } else if (prop.type) {
                        find(prop);
                    }
                });
            };
            find(this.tree);
            return box;
        };

        Finder.prototype.findAll = function (type) {
            var boxes = [];
            var find = function (tree) {
                switch (typeof tree) {
                    case 'number':
                    case 'string':
                    case 'boolean':
                        return;
                }
                if (tree.type === type)
                    boxes.push(tree);
                if (tree.buffer)
                    return;
                Object.keys(tree).forEach(function (key) {
                    var prop = tree[key];
                    if (prop == null)
                        return;
                    if (Array.isArray(prop)) {
                        prop.forEach(find);
                    } else {
                        find(prop);
                    }
                });
            };
            find(this.tree);
            return boxes;
        };
        return Finder;
    })();
    Mp4.Finder = Finder;
})(Mp4 || (Mp4 = {}));
//# sourceMappingURL=finder.js.map
