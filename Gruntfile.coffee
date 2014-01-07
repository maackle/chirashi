module.exports = (grunt) ->


	# Project configuration.
	grunt.initConfig
		pkg: grunt.file.readJSON('package.json')

		config:
			src: 'src'
			dist: 'dist'
			examples: 'examples'

		connect:
			server:
				options:
					port: 3388
					base: '<%= config.examples %>'

		watch:
			coffee:
				files: ["<%= config.src %>/*.coffee"]
				tasks: ['coffee']

		coffee:
			options:
				join: true
			compile:
				files:
					"<%= config.dist %>/chirashi.js": [
						"<%= config.src %>/chirashi.coffee",
					]

	grunt.loadNpmTasks('grunt-contrib-coffee')
	grunt.loadNpmTasks('grunt-contrib-connect')
	grunt.loadNpmTasks('grunt-contrib-watch')
	grunt.loadNpmTasks('grunt-notify')

	#// Default task(s).
	grunt.registerTask 'dev', [
		'build'
		'connect'
		'watch'
	]

	grunt.registerTask 'build', [
		'coffee:compile'
	]