module.exports = {
    data: {
        pageMetadata: {

            css: [
                {
                    path: "https://fonts.cdnfonts.com/css/jetbrains-mono",
                    location: 'head',
                    inline: false
                }
                ],

            js: [
                {
                    path: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
                    name: 'highlight-js',
                    location: 'head',
                    inline: false
                },
                {
                    location: 'body',
                    inline: true,
                    content: `hljs.highlightAll({});`
                }
            ]
        }
    }
}

