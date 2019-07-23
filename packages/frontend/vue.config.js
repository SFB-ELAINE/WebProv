module.exports = {
    publicPath: '/WebProv/',
    outputDir: '../../_site',
    chainWebpack: (config) => {
        config.resolve.symlinks(false)
    }
}