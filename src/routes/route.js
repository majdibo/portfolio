module.exports = {
    getData: async function (parentContext, router) {
        const blog = await router.resolveContentFiles(`${router.contentDir}/blog`, parentContext);

        const articles = blog.articles;

        const featuredArticle = articles.filter(article => article.featured)[0];

        const moreArticles = articles.filter(article => article !== featuredArticle).slice(0, 3);

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
