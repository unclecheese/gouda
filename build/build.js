({
	baseUrl: "../",
	name: "build/almond",
	out: "../dist/gouda-dist.js",
	packages: ['src'],
	include: ['src/main'],
	wrap: {
		startFile: "start.frag",
		endFile: "end.frag"
	}

})