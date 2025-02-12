const path = require('path');

module.exports = {
    entry: './src/client/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx|js|jsx)$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
        alias: {
            '@trpc/react-query': require.resolve('@trpc/react-query'),
        }
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'src/public'),
        },
        compress: true,
        port: 3000,
        proxy: {
            '/api': 'http://localhost:3001',
        },
    },
};
