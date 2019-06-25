require('dotenv').config()

const path = require('path')
const webpack = require('webpack')

const withTypescript = require('@zeit/next-typescript')
const withOffline = require('next-offline')
const WebpackPwaManifest = require('webpack-pwa-manifest')


module.exports = withOffline(withTypescript({
    generateSw: true,
    workboxOpts: {
        swDest: 'static/service-worker.js',
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['.next/static/*', '.next/static/commons/*'],
        modifyUrlPrefix: { '.next': '/_next' },
        runtimeCaching: [
            {
                urlPattern: '/',
                handler: 'networkFirst',
                options: {
                    cacheName: 'html-cache',
                }
            },
            {
                urlPattern: /.*\.(?:png|jpg|jpeg|svg|gif)/,
                handler: 'cacheFirst',
                options: {
                    cacheName: 'image-cache',
                    cacheableResponse: {
                        statuses: [0, 200],
                    }
                }
            },
        ],
    },

    webpack: (config) => {

        /**
         * Fix for missing 'fs' module not found
         * https://github.com/webpack-contrib/css-loader/issues/447
         */
        config.node = {
            fs: 'empty'
        }

        /**
         * Aliases
         */
        config.resolve.alias = {
            ...config.resolve.alias,
            '@app/components': path.join(__dirname, 'components'),
            '@app/containers': path.join(__dirname, 'containers'),
            '@app/lib': path.join(__dirname, 'lib'),
            '@app/hocs': path.join(__dirname, 'hocs'),
        }

        /** 
         * Environment variables exposed to the UI 
         */
        config.plugins.push(new webpack.EnvironmentPlugin([
            'MAGENTO_BACKEND_URL',
        ]))

        /**
         * PWA Manifest
         * https://www.npmjs.com/package/webpack-pwa-manifest
         */
        config.plugins.push(new WebpackPwaManifest({
            // inject: false,
            fingerprints: false,
            filename: 'static/manifest.webmanifest',
            name: 'Luma',
            short_name: 'Luma',
            description: 'With more than 230 stores spanning 43 states and growing, Luma is a nationally recognized active wear manufacturer and retailer. We’re passionate about active lifestyles – and it goes way beyond apparel.',
            background_color: '#ffffff',
            orientation: 'portrait',
            display: "standalone",
            start_url: '.',
            publicPath: '../',
            icons: [
                {
                    src: path.resolve('./static/images/app-icon.png'),
                    sizes: [96, 128, 192, 256, 384, 512], // multiple sizes
                    destination: path.join('static', 'icons'),
                },
                {
                    src: path.resolve('./static/images/app-icon-ios.png'),
                    sizes: [120, 152, 167, 180],
                    destination: path.join('static', 'icons'),
                    ios: true
                },
            ],
        }))

        /** 
         * SVG Inline
         */
        config.module.rules.push({
            test: /\.svg$/,
            use: 'react-svg-loader',
        });

        return config
    }
}))