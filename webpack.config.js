const path = require('path');

module.exports = {
    entry: './static/index.js', // Path to your entry file
    output: {
        path: path.resolve(__dirname, 'dist'), // Path to your desired output directory
        filename: 'bundle.js', // Output filename
    },
    watch: true
};
