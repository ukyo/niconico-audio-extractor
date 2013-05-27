/// <reference path="mp4.ts" />

module Mp4 {
  
  export class Finder {
    constructor(public tree: any) { }

    findOne(type: string): IBox {
      var box: IBox;
      var find = tree => {
        if (box) return;
        switch (typeof tree) {
          case 'number':
          case 'string':
          case 'boolean': return;
        }
        if (tree.type === type) {
          return box = tree;
        }
        if (tree.buffer) return;
        Object.keys(tree).forEach(key => {
          var prop = tree[key];
          if (prop == null) return;
          if (Array.isArray(prop)) {
            prop.some(find);
          } else if (prop.type) {
            find(prop);
          }
        });
      };
      find(this.tree);
      return box;
    }

    findAll(type: string): IBox[] {
      var boxes: IBox[] = [];
      var find = tree => {
        switch (typeof tree) {
          case 'number':
          case 'string':
          case 'boolean': return;
        }
        if (tree.type === type) boxes.push(tree);
        if (tree.buffer) return;
        Object.keys(tree).forEach(key => {
          var prop = tree[key];
          if (prop == null) return;
          if (Array.isArray(prop)) {
            prop.forEach(find);
          } else {
            find(prop);
          }
        });
      };
      find(this.tree);
      return boxes;
    }
  }



}