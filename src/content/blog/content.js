

module.exports = {
    articles: function() {

        const fs = require('fs');
        const path = require('path');

        const articles = [];
        const blogPath = path.join(__dirname, './[article]');
        const folders = fs.readdirSync(blogPath);

        folders.forEach(folder => {
            const articlePath = path.join(blogPath, folder);
            const stat = fs.statSync(articlePath);

            if (stat.isDirectory()) {
                const contentJsonPath = path.join(articlePath, 'content.json');
                const content = {};

                if (fs.existsSync(contentJsonPath)) {
                    const contentJson = require(contentJsonPath);
                    Object.assign(content, contentJson);
                }

                const files = fs.readdirSync(articlePath);
                const contentFile = files.find(file => path.extname(file) === '.html');

                if (contentFile) {
                    const htmlContent = fs.readFileSync(path.join(articlePath, contentFile), 'utf8');
                    const firstParagraphMatch = htmlContent.match(/<p>(.*?)<\/p>/);
                    const heroImgMatch = htmlContent.match(/<section[^>]*class\s*=\s*["'][^"']*hero[^"']*["'][^>]*>\s*<img\s*src\s*=\s*["']([^"']+)["'][^>]*>/s);

                    if (!content.description && firstParagraphMatch) {
                        content.description = firstParagraphMatch[1];
                    }

                    if (!content.img && heroImgMatch) {
                        content.img = `/blog/${folder}/${heroImgMatch[1]}`;
                    }
                }

                articles.push({
                    title: content.title || folder,
                    link: `/blog/${folder}`,
                    description: content.description || '',
                    img: content.img || null,
                    tags: content.tags || [],
                    readingTime: content.readingTime || '5',
                    featured: content.featured || false
                });
            }
        });

        return articles;
    }
}
