'use strict';

module.exports = function gruntFile(grunt) {
  grunt.initConfig({
    env: {
      options: {},
      dev: {
        NODE_ENV: grunt.option('env') || 'test',
        ALLOW_CONFIG_MUTATIONS: true,
      },
    },
    exec: {
      'eslint-nofix': {
        command: 'npx eslint .',
        options: {
          maxBuffer: 500 * 1024,
        },
      },
      'eslint-autofix': {
        command: 'npx eslint . --fix',
        options: {
          maxBuffer: 500 * 1024,
        },
      },
    },
    mocha_istanbul: {
      coverage: {
        src: ['test/*.test.js'],
        options: {
          timeout: 10000,
          mask: '*.test.js',
          print: 'both',
        },
      },
    },
    istanbul_check_coverage: {
      default: {
        options: {
          coverageFolder: 'coverage*',
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-mocha-istanbul');

  grunt.registerTask('coverage', ['env:dev', 'exec:eslint-autofix', 'mocha_istanbul:coverage']);
};
