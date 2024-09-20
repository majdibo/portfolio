const  {copyAssets, ensureDirectoryExists} = require("./helpers");
const Handlebars = require("handlebars");
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

 class RouteManager {
    constructor(baseDir, contentDir, outputDir, componentManager) {
        this.baseDir = baseDir;
        this.contentDir = contentDir;
        this.outputDir = outputDir;
        this.componentManager = componentManager;
        logger.info(`Router initialized with base directory: ${baseDir} and content directory: ${contentDir}`);
    }

    // Recursively walk the directory tree, resolving routes, and copying assets
    async walkRouteTree(currentDir, context = {}) {
        logger.info(`Walking directory: ${currentDir}`);

        // Check for corresponding content directory
        const contentDir = currentDir.replace(this.baseDir, this.contentDir);

        // Process content files (content.html, content.js, content.json)
        if (fs.existsSync(contentDir)) {
            logger.info(`Processing content for: ${contentDir}`);
            context = await this.resolveContentFiles(contentDir, context);
        }

        // Check for index.html at this level
        const indexHtmlPath = path.join(currentDir, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
            logger.debug(`Found index.html at: ${indexHtmlPath}`);
            await this.resolveStaticRoute(currentDir, context);
        }

        // Walk through subdirectories
        const filesAndDirs = fs.readdirSync(currentDir);
        for (const item of filesAndDirs) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (item.startsWith("[") && item.endsWith("]")) {
                    // Handle dynamic routes
                    const dynamicRouteName = item.slice(1, -1);
                    logger.info(`Found dynamic route: ${dynamicRouteName}`);
                    const routeJsPath = path.join(currentDir, 'route.js');

                    if (fs.existsSync(routeJsPath)) {
                        logger.debug(`Found route.js for dynamic route: ${routeJsPath}`);
                        const routeScript = require(path.resolve(routeJsPath));
                        if (typeof routeScript[dynamicRouteName] === 'function') {
                            const items = routeScript[dynamicRouteName](context);
                            await this.resolveDynamicItems(items, dynamicRouteName, fullPath, context);
                        }
                    } else {
                        // No route.js file; use content folder to fetch items for iteration
                        const contentSubDir = path.join(this.contentDir, fullPath.replace(this.baseDir, ''));
                        if (fs.existsSync(contentSubDir)) {
                            logger.debug(`Fetching content items from: ${contentSubDir}`);
                            const contentItems = fs.readdirSync(contentSubDir)
                                .filter(file => fs.statSync(path.join(contentSubDir, file)).isDirectory());

                            if (contentItems.length > 0) {
                                await this.resolveDynamicItems(contentItems, dynamicRouteName, fullPath, context);
                            } else {
                                logger.warn(`No items found in content folder for dynamic route: ${dynamicRouteName}`);
                            }
                        }
                    }
                } else {
                    // Continue walking for static routes
                    if (this.isAssetDirectory(fullPath)) {
                        // Copy assets to output directory
                        const renderRoutePath = fullPath.replace(this.baseDir, '').replace(/\[.*?]/g, match => context[match.slice(1, -1)]);
                        copyAssets(fullPath, path.join(this.outputDir, renderRoutePath));
                    } else {
                        await this.walkRouteTree(fullPath, context);
                    }
                }
            }
        }

    }

    // Check if a directory is an asset directory (or contains asset files)
    isAssetDirectory(dir) {
        const assetDirs = ['assets', 'static', 'images', 'scripts', 'styles'];

        // Check if the directory is named like an asset directory
        const dirName = path.basename(dir).toLowerCase();
        return fs.existsSync(dir) && assetDirs.includes(dirName);
    }


    // Resolve content files (content.html, content.js, content.json)
    async resolveContentFiles(contentDir, parentContext) {
        let contentContext = {...parentContext};
        const pageMetadata = contentContext.pageMetadata ? contentContext.pageMetadata : {
            css: [],
            js: [],
            assetsPath: []
        };

        // Process content.html
        const contentHtmlPath = path.join(contentDir, 'content.html');
        if (fs.existsSync(contentHtmlPath)) {
            contentContext.content = fs.readFileSync(contentHtmlPath, 'utf-8');
        }

        // Process content.js
        const contentJsPath = path.join(contentDir, 'content.js');
        if (fs.existsSync(contentJsPath)) {
            const contentScript = require(path.resolve(contentJsPath));
            const functionNames = Object.keys(contentScript);
            for (const functionName of functionNames) {
                if (typeof contentScript[functionName] === 'function') {
                    contentContext[functionName] = await contentScript[functionName](contentContext);
                } else {
                    contentContext = {...contentContext, ...contentScript[functionName]};
                }
            }
        }

        // Process content.json
        const contentJsonPath = path.join(contentDir, 'content.json');
        if (fs.existsSync(contentJsonPath)) {
            const contentJson = JSON.parse(fs.readFileSync(contentJsonPath, 'utf-8'));
            contentContext = {...contentContext, ...contentJson};
        }

        // Process assets
        const contentAssetsPath = path.join(contentDir, 'assets');
        if (this.isAssetDirectory(contentAssetsPath)) {
            pageMetadata.assetsPath = [...pageMetadata.assetsPath, contentAssetsPath];
            const assetFiles = fs.readdirSync(contentAssetsPath);
            assetFiles.forEach(file => {
                const ext = path.extname(file);
                if (ext === '.css') {
                    pageMetadata.css.push(path.join("assets", file));
                } else if (ext === '.js') {
                    pageMetadata.js.push(path.join("assets", file));
                }
            });

            contentContext.pageMetadata = pageMetadata;
        }

        return contentContext;
    }

    // Handles resolving static routes by rendering index.html if present
    async resolveStaticRoute(routeDir, parentContext) {
        const indexHtmlPath = path.join(routeDir, 'index.html');
        const routeJsPath = path.join(routeDir, 'route.js');
        let routeContext = {...parentContext};

        if (fs.existsSync(routeJsPath)) {
            const routeScript = require(path.resolve(routeJsPath));
            const data = await routeScript.getData(routeContext, this);
            routeContext = {...routeContext, ...data};
        }

        if (fs.existsSync(indexHtmlPath)) {
            const content = fs.readFileSync(indexHtmlPath, 'utf-8');
            const template = Handlebars.compile(content);
            let renderedContent = template(routeContext);

            const usedComponents = []
            for (const name in Handlebars.partials) {
                const partial = Handlebars.partials[name]
                if (typeof partial === 'function') {
                    usedComponents.push(name)
                }
            }

            // get only used components from component manager metadata css and js, then add them to rendered content by including them in the head and body
            for (const component of usedComponents) {

                const componentCss = this.componentManager.metadata.css.find((componentCss) => {
                    return Object.keys(componentCss)[0] === component;
                });

                const componentJs = this.componentManager.metadata.js.find((componentJs) => {
                    return Object.keys(componentJs)[0] === component;
                });

                if (componentCss) {
                    renderedContent = renderedContent.replace('</head>', `<link rel="stylesheet" href="${componentCss[component]}">` + '\n</head>');
                }

                if (componentJs) {
                    renderedContent = renderedContent.replace('</body>', `<script src="${componentJs[component]}"></script>` + '\n</body>');
                }
            }

            const renderRoutePath = routeDir.replace(this.baseDir, '').replace(/\[.*?]/g, match => routeContext[match.slice(1, -1)]);
            this.writeToOutput(renderRoutePath, renderedContent, routeContext);

            const assetsPath = routeContext.pageMetadata?.assetsPath;

            if (assetsPath) {
                const destPath = path.join(this.outputDir, renderRoutePath, 'assets');
                assetsPath.forEach((assetsPath) => {
                    copyAssets(assetsPath, destPath);
                });
            }
        }

        return routeContext;
    }

    // Handle dynamic routes by looping through dynamic items
    async resolveDynamicItems(items, dynamicRouteName, currentDir, parentContext) {
        for (const item of items) {
            logger.info(`Resolving dynamic item: ${item}`);
            const contentSubDir = path.join(this.contentDir, currentDir.replace(this.baseDir, ''), item);


            const currentContext = {
                ...await this.resolveContentFiles(contentSubDir, parentContext),
                [dynamicRouteName]: item
            };

            await this.walkRouteTree(currentDir, currentContext);
        }
    }

    writeToOutput( routePath, content, context) {
         const pageMetadata = context.pageMetadata;

         const fullOutputPath = path.join(this.outputDir, routePath, 'index.html');
         ensureDirectoryExists(fullOutputPath);

         if (pageMetadata) {
             // Include CSS in the head
             const cssLinks = pageMetadata.css
                 .map(cssPath => {
                     return cssPath.replace(this.baseDir, '').replace(/\[.*?]/g, match => context[match.slice(1, -1)]);
                 })
                 .map(cssPath => `<link rel="stylesheet" href="${cssPath}">`).join('\n');
             content = content.replace('</head>', `${cssLinks}\n</head>`);

             // Include JS at the bottom of the body
             const jsScripts = pageMetadata.js
                 .map(jsPath => {
                     return jsPath.replace(this.baseDir, '').replace(/\[.*?]/g, match => context[match.slice(1, -1)]);
                 })
                 .map(jsPath => `<script src="${jsPath}"></script>`).join('\n');
             content = content.replace('</body>', `${jsScripts}\n</body>`);
         }

         fs.writeFileSync(fullOutputPath, content, 'utf-8');
         logger.debug(`Content written to: ${fullOutputPath}`);
     }
}

module.exports = {RouteManager};
