//tiny requestFileSystem Wrapper
//author @ukyo
//apache license

//refer: http://d.hatena.ne.jp/shirokurostone/20111014/1318593601
var fs = (function(window){

var fs = {},
  BlobBuilder = window.WebKitBlobBuilder || window.MozBlobuilder || window.MSBlobBuilder,
  requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem,
  defaultWriteOptions = {
    type: window.TEMPORARY,
    size: 1024*1024,
    name: null,
    flags: {create: true, exclusive: true},
    data: null,
    success: function(fileEntry, e){},
    error: function(e){}
  },
  defaultReadOptions = {
    type: window.TEMPORARY,
    size: 1024*1024,
    name: null,
    flags: null,
    success: function(result, e){},
    error: function(e){},
    readType: 'text',
    encoding: 'UTF-8'
  },
  defaultRemoveOptions = {
    type: window.TEMPORARY,
    size: 1024*1024,
    name: null,
    flags: {create: false},
    success: function(e){},
    error: function(e){}
  },
  readAs = {
    arraybuffer: 'ArrayBuffer',
    binarystring: 'BinaryString',
    text: 'Text',
    dataurl: 'DataURL'
  };

/**
 * Example:
 * var BlobBuilder = window.WebKitBlobBuilder || window.MozBlobBuilder;
 * var bb = new BlobBuilder();
 * bb.append('sample text');
 * fs.create({
 *   size: 5*1024*1024,
 *   name: 'text.txt',
 *   success: function(fileEntry){
 *     alert(fileEntry.toURL());
 *   },
 *   error: function(e){
 *     alert(e.toString());
 *   },
 *   blob: bb.getBlob('text/plain')
 * });
 */
fs.create = function(options){
  options = overrideOptions(options, defaultWriteOptions);
  requestFileSystem(options.type, options.size, function(fileSystem){
    fileSystem.root.getFile(options.name, options.flags, function(fileEntry){
      fileEntry.createWriter(function(fileWriter){
	fileWriter.onwrite = function(e){
	  options.success(fileEntry, e);
	};
	
	fileWriter.onerror = options.error;
	
	if(options.data.constructor == String){
	  var bb = new BlobBuilder();
	  bb.append(options.data);
	  options.data = bb.getBlob('text/plain');
	}
	fileWriter.write(options.data);
      }, options.error);
    }, options.error);
  }, options.error);
};

/**
 * Example:
 * fs.read({
 *   size: 5*1024*1024,
 *   name: 'text.txt',
 *   success: function(result){
 *     alert(result);
 *   },
 *   error: function(e){
 *     alert(e.toString());
 *   }
 * });
 */
fs.read = function(options){
  options = overrideOptions(options, defaultReadOptions);
  requestFileSystem(options.type, options.size, function(fileSystem){
    fileSystem.root.getFile(options.name, options.flags, function(fileEntry){
      fileEntry.file(function(file){
	var fileReader = new FileReader();
  
	fileReader.onloadend = function(e){
	  options.success(fileReader.result, e);
	};
	
	fileReader.onerror = options.error;
	
	var args = [file];
	if(options.readType) args.push(options.encoding);
	
	fileReader['readAs' + readAs[options.readType.toLowerCase()]].apply(fileReader, args);
      }, options.error);
    }, options.error);
  }, options.error);
};

fs.update = function(options){
  options = overrideOptions(options, defaultWriteOptions);
  var removeOptions = {
    name: options.name,
    type: options.type,
    size: options.size,
    success: function(){fs.create(options)},
    error: function(e){
      if(e.code === FileError.NOT_FOUND_ERR)
	fs.create(options);
      else options.error(e);
    }
  };
  removeOptions = overrideOptions(removeOptions, defaultRemoveOptions);
  fs.remove(removeOptions);
};

fs.remove = function(options){
  options = overrideOptions(options, defaultRemoveOptions);
  requestFileSystem(options.type, options.size, function(fileSystem){
    fileSystem.root.getFile(options.name, options.flags, function(fileEntry){
      fileEntry.remove(options.success, options.error);
    }, options.error);
  }, options.error);
};

function overrideOptions(options, defaultOptions){
  var ret = {};
  for(o in defaultOptions){
    if(typeof options[o] === 'undefined'){
      ret[o] = defaultOptions[o];
    } else {
      ret[o] = options[o];
    }
  }
  return ret;
}

return fs;

})(this);