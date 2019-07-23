module.exports = {
    outputDir: '../../_site',
    chainWebpack: (config) => {
        config.resolve.symlinks(false)
    }
}