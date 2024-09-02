module.exports = {
    getData: function () {
        const blog = getDataFromContent("blog")[0];
        const articles = blog.articles;
        const featuredArticleTitle = "Why Event Driven Architecture is the Future of Dynamic and Adaptive Systems";

        const featuredArticle = articles.filter(article => article.title === featuredArticleTitle)[0];

       const moreArticles = articles.filter(article => article.title !== featuredArticleTitle).slice(0, 3);

        return {
            featuredArticle: {
                title: featuredArticle.title,
                link: `${featuredArticle.link}`,
                description: featuredArticle.description,
                img: featuredArticle.img,
                tags: featuredArticle.tags,
                readingTime: featuredArticle.readingTime
            },
            articles: [...moreArticles]
        }
    }
}
