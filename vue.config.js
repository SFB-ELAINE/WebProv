module.exports = {
    publicPath: '/WebProv/',
    outputDir: '../../docs',
    chainWebpack: (config) => {
        config.resolve.symlinks(false)
    }
}