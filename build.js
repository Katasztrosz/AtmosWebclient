({
    name: 'atmos',
    baseUrl: 'js',
    optimize: 'uglify2',
    uglify2: {
        mangle: true
    },
    preserveLicenseComments: false,
    paths: {
        requireLib: 'libraries/require'
    },
    mainConfigFile: 'js/atmos.js',
    out: 'atmos.min.js',
    removeCombined: true,
    findNestedDependencies: true,
    include: ["requireLib"],
    onBuildRead: function (moduleName, path, contents) {
        // return contents;
        return contents.replace(/console.log(.*);/g, '');
    }
})
