module.exports = {
    outputDir: 'dist',
    chainWebpack: (config) => {
        config.resolve.symlinks(false)
    }
}