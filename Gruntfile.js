module.exports = function(grunt) {
	
	function getPlatform(){
		switch(process.platform){
			case 'win32': return 'win64'; // change to 'win' for both 32 and 64
			case 'linux': return 'linux64';
			case 'darwin': return 'osx64';
			default: throw Error("unknown platform "+process.platform);
		}
	}

  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    exec: {
      version: {
        command: 'node ./util/version.js'
      },
      clear: {
        command: 'rm -Rf bower_components node_modules'
      },
      osx64: {
        command: '../byteballbuilds/build-osx.sh osx64'
      },
      osx32: {
        command: '../byteballbuilds/build-osx.sh osx32'
      }
    },
    watch: {
      options: {
        dateFormat: function(time) {
          grunt.log.writeln('The watch finished in ' + time + 'ms at ' + (new Date()).toString());
          grunt.log.writeln('Waiting for more changes...');
        },
      },
      css: {
        files: ['src/css/*.css'],
        tasks: ['concat:css']
      },
      main: {
        files: [
          'src/js/init.js',
          'src/js/app.js',
          'src/js/directives/*.js',
          'src/js/filters/*.js',
          'src/js/routes.js',
          'src/js/services/*.js',
          'src/js/models/*.js',
          'src/js/controllers/*.js'
        ],
        tasks: ['concat:js']
      }
    },
    concat: {
      options: {
        sourceMap: false,
        sourceMapStyle: 'link' // embed, link, inline
      },
      js: {
        src: [
            'controllers/js/controllers/create.js',
            'angular-bitcore-wallet-client/index.js',
        ],
        dest: 'public/js/bng.js'
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      prod: {
        files: {
          'public/byteball.js': ['public/byteball.js'],
          'public/angular.js': ['public/angular.js']
        }
      },
	  partialClient: {
        files: {
          'public/partialClient.js': ['public/partialClient.js']
        }
      }
    },
    nggettext_extract: {
      pot: {
        files: {
          'i18n/po/template.pot': [
            'public/index.html', 
            'public/views/*.html', 
            'public/views/**/*.html',
            'src/js/routes.js',
            'src/js/services/*.js',
            'src/js/controllers/*.js'
          ]
        }
      },
    },
    nggettext_compile: {
      all: {
        options: {
		  format: "json",
          module: 'copayApp'
        },
		files: [
			{
				expand: true,
				dot: true,
				cwd: "i18n/po",
				dest: "public/languages",
				src: ["*.po"],
				ext: ".json"
			}
		]
      },
    },
    copy: {
      icons: {
        expand: true,
        flatten: true,
        src: 'bower_components/foundation-icon-fonts/foundation-icons.*',
        dest: 'public/icons/'
      },
      modules: {
        expand: true,
        flatten: true,
        options: {timestamp: true, mode: true},
        src: ['src/js/fileStorage.js'],
        dest: 'public/'
      },
      osx: {
        expand: true,
        flatten: true,
        options: {timestamp: true, mode: true},
        src: ['webkitbuilds/build-osx.sh', 'webkitbuilds/Background.png'],
        dest: '../byteballbuilds/'
      },
      linux: {
		options: {timestamp: true, mode: true},
        files: [
          {expand: true, cwd: './webkitbuilds/', src: ['byteball.desktop', '../public/img/icons/icon-white-outline.ico', '../public/img/icons/icon-white-256.png'], dest: '../byteballbuilds/Byteball/linux32/', flatten: true, filter: 'isFile', options: {timestamp: true, mode: true} },
          {expand: true, cwd: './webkitbuilds/', src: ['byteball.desktop', '../public/img/icons/icon-white-outline.ico', '../public/img/icons/icon-white-256.png'], dest: '../byteballbuilds/Byteball/linux64/', flatten: true, filter: 'isFile', options: {timestamp: true, mode: true} },
        ],
      }
    },
    karma: {
      unit: {
        configFile: 'test/karma.conf.js'
      },
      prod: {
        configFile: 'test/karma.conf.js',
        singleRun: true
      }
    },
    coveralls: {
      options: {
        debug: false,
        coverageDir: 'coverage/report-lcov',
        dryRun: true,
        force: true,
        recursive: false
      }
    },
    nwjs: {
      options: {
          //platforms: ['win','osx64','linux'],
          //platforms: ['osx64'],
          platforms: [getPlatform()],
          appName: 'Byteball',
          buildDir: '../byteballbuilds',
          version: '0.14.7',
          zip: false,
          macIcns: './public/img/icons/icon-white-outline.icns',
          winIco: './public/img/icons/icon-white-outline.ico',
          exeIco: './public/img/icons/icon-white-outline.ico',
          macPlist: {CFBundleURLTypes: [{CFBundleURLName: 'Byteball action', CFBundleURLSchemes: ['byteball']}], /*CFBundleIconFile: 'nw.icns',*/ LSHasLocalizedDisplayName: 0}
      },
      src: ['./package.json', './public/**/*', './angular-bitcore-wallet-client/**/*']
    },
    compress: {
      linux32: {
        options: {
          archive: '../byteballbuilds/byteball-linux32.zip'
        },
        expand: true,
        cwd: '../byteballbuilds/Byteball/linux32/',
        src: ['**/*'],
        dest: 'byteball-linux32/'
      },
      linux64: {
        options: {
          archive: '../byteballbuilds/byteball-linux64.zip'
        },
        expand: true,
        cwd: '../byteballbuilds/Byteball/linux64/',
        src: ['**/*'],
        dest: 'byteball-linux64/'
      }
    },
    browserify: {
        dist:{
            options:{
                exclude: ['sqlite3', 'nw.gui', 'mysql', 'ws', 'regedit']
            },
            src: 'public/byteball.js',
            dest: 'public/byteball.js'
        },
	    partialClient:{
		    options:{
			    exclude: ['sqlite3', 'nw.gui', 'mysql', 'ws', 'regedit']
		    },
		    src: 'src/js/partialClient.js',
		    dest: 'public/partialClient.js'
        }
    },
    // .deb proved to be very slow to produce and install: lintian spends a lot of time verifying a .bin file
    debian_package: {
        linux64: {
            files: [
                {expand: true, cwd: '../byteballbuilds/byteball-test/linux64/', src: ['**/*'], dest: '/opt/byteball-test/'},
                //{expand: true, cwd: '../byteballbuilds/byteball-test/linux64', src: ['byteball.desktop'], dest: '/usr/share/applications/byteball-test.desktop'}
            ],
            options: {
                maintainer: {
                    name: 'Byteball',
                    email: 'byteball@byteball.org'
                },
                long_description: 'Smart payments made simple',
                target_architecture: 'amd64'
            }
        }
    },
    innosetup_compiler: {
        win64: {
            options: {
                gui: false,
                verbose: false
            },
            script: 'webkitbuilds/setup-win64.iss'
        },
        win32: {
            options: {
                gui: false,
                verbose: false
            },
            script: 'webkitbuilds/setup-win32.iss'
        }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-angular-gettext');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-karma-coveralls');
  grunt.loadNpmTasks('grunt-nw-builder');
  grunt.loadNpmTasks('grunt-contrib-compress');
  //grunt.loadNpmTasks('grunt-debian-package');
  grunt.loadNpmTasks('innosetup-compiler');

  grunt.registerTask('default', ['nggettext_compile', 'exec:version', 'concat', 'copy:icons', 'copy:modules']);
  grunt.registerTask('cordova', ['default', 'browserify']);
  grunt.registerTask('cordova-prod', ['cordova', 'uglify']);
  //grunt.registerTask('prod', ['default', 'uglify']);
  grunt.registerTask('translate', ['nggettext_extract']);
  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('test-coveralls', ['karma:prod', 'coveralls']);
  //grunt.registerTask('desktop', ['prod', 'nwjs', 'copy:linux', 'compress:linux32', 'compress:linux64', 'copy:osx', 'exec:osx32', 'exec:osx64']);
  grunt.registerTask('desktop', ['default', 'nwjs']);
  grunt.registerTask('dmg', ['copy:osx', 'exec:osx64']);
  grunt.registerTask('linux64', ['copy:linux', 'compress:linux64']);
  grunt.registerTask('linux32', ['copy:linux', 'compress:linux32']);
  grunt.registerTask('deb', ['debian_package:linux64']);
  grunt.registerTask('inno64', ['innosetup_compiler:win64']);
  grunt.registerTask('inno32', ['innosetup_compiler:win32']);
  grunt.registerTask('partial', ['browserify:partialClient', 'uglify:partialClient']);
  grunt.registerTask('partial-fast', ['browserify:partialClient']);
};
