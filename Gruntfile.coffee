module.exports = (grunt) ->
  grunt.initConfig
    typescript:
      base:
        src: ['dist/js/src/*.ts']
        options:
          target: 'es5'
          sourceMap: true

    copy:
      base:
        files: [
          {
            src: ['vendor/q/q.min.js', 'vendor/zlib.js/bin/inflate.min.js', 'vendor/mp4.js/src/*.ts', 'src/*.ts']
            dest: 'dist/js/'
          }
        ]

    clean: ['dist/js/*']

    watch:
      base:
        files: ['src/*']
        tasks: ['default']

  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-typescript'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.registerTask 'default', ['clean', 'copy', 'typescript']