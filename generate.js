const fs = require('fs');
const path = require('path');

// Constants for directories
const BASE_DIR = './routes';
const OUTPUT_DIR = './output';
const COMPONENTS_DIR = './components';
const LAYOUTS_DIR = './layouts';

// Utility to read a directory recursively
function readDirRecursively(dir) {
    const files = fs.readdirSync(dir);
    let results = [];
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            results = results.concat(readDirRecursively(fullPath));
        } else {
            results.push(fullPath);
        }
    });
    return results;
}

// Utility to split and resolve route parts
function resolveRouteParts(route) {
    return route.split('/').filter(part => part !== "index.html");
}

// Utility to get nested value from an object using dot notation
function getNestedValue(obj, key) {
    return key.split('.').reduce((o, i) => (o ? o[i] : ''), obj);
}

// Utility to evaluate conditions
function evaluateCondition(dataItem, condition) {
    try {
        return new Function('data', `with(data) { return ${condition}; }`)(dataItem);
    } catch (e) {
        console.error('Error evaluating condition:', condition, e);
        return false;
    }
}

// Utility to inject components into layout recursively
function injectComponents(layout, dataItem, pageMetaData = { css: [], js: [] }) {
    const placeholderRegex = /{{\s*([\w.]+)\s*}}/g;
    layout = layout.replace(placeholderRegex, (match, key) => getNestedValue(dataItem, key) || "{{" + key + "}}");

    const componentRegex = /{{\s*component ([\w-/]+)(.*?)\s*}}/g;
    let match;
    while ((match = componentRegex.exec(layout)) !== null) {
        const componentName = match[1];
        const componentAttributes = match[2].trim();
        const componentDirPath = path.join(COMPONENTS_DIR, componentName);
        const componentHtmlPath = path.join(COMPONENTS_DIR, `${componentName}.html`);
        let componentPath, componentCssPath, componentJsPath;

        if (fs.existsSync(componentDirPath) && fs.statSync(componentDirPath).isDirectory()) {
            componentPath = path.join(componentDirPath, 'component.html');
            componentCssPath = path.join(componentDirPath, 'component.css');
            componentJsPath = path.join(componentDirPath, 'component.js');
        } else if (fs.existsSync(componentHtmlPath)) {
            componentPath = componentHtmlPath;
            componentCssPath = path.join(COMPONENTS_DIR, `${componentName}.css`);
            componentJsPath = path.join(COMPONENTS_DIR, `${componentName}.js`);
        } else {
            layout = layout.replace(match[0], '');
            continue;
        }

        if (fs.existsSync(componentPath)) {
            let componentContent = fs.readFileSync(componentPath, 'utf-8');
            const attributeRegex = /{{\s*attribute (\w+)\s*}}/g;
            let attrMatch;
            while ((attrMatch = attributeRegex.exec(componentContent)) !== null) {
                const attrName = attrMatch[1];
                const attrValue = new RegExp(`\\b${attrName}="([^"]*)"`, 'i').exec(componentAttributes);
                if (attrValue && attrValue[1]) {
                    componentContent = componentContent.replace(attrMatch[0], attrValue[1]);
                } else if (dataItem[attrName]) {
                    componentContent = componentContent.replace(attrMatch[0], dataItem[attrName]);
                } else {
                    componentContent = componentContent.replace(attrMatch[0], '');
                }
            }
            const result= injectComponents(componentContent, dataItem, pageMetaData); // Recursive injection
            layout = layout.replace(match[0], result.layout);
            pageMetaData = {
                css: [...new Set([...pageMetaData.css, ...result.pageMetaData.css])],
                js: [...new Set([...pageMetaData.js, ...result.pageMetaData.js])]
            };

            // Collect CSS
            if (fs.existsSync(componentCssPath)) {
                const cssOutputPath = path.join(OUTPUT_DIR, 'assets', 'components', componentName, 'component.css');
                fs.mkdirSync(path.dirname(cssOutputPath), { recursive: true });
                fs.copyFileSync(componentCssPath, cssOutputPath);
                pageMetaData.css.push(`assets/components/${componentName}/component.css`);
            }

            // Collect JavaScript
            if (fs.existsSync(componentJsPath)) {
                const jsOutputPath = path.join(OUTPUT_DIR, 'assets', 'components', componentName, 'component.js');
                fs.mkdirSync(path.dirname(jsOutputPath), { recursive: true });
                fs.copyFileSync(componentJsPath, jsOutputPath);
                pageMetaData.js.push(`assets/components/${componentName}/component.js`);
            }
        } else {
            layout = layout.replace(match[0], '');
        }
    }
    return { layout, pageMetaData };
}
// Utility to handle looping in HTML
function handleLooping(layout, dataItem) {
    const loopRegex = /{{#each (\w+)}}([\s\S]*?){{\/each}}/g;
    return layout.replace(loopRegex, (match, p1, p2) => {
        if (Array.isArray(dataItem[p1])) {
            return dataItem[p1].map(item => {
                let loopContent = p2;
                const placeholderRegex = /{{\s*([\w.]+)\s*}}/g;
                loopContent = loopContent.replace(placeholderRegex, (match, key) => getNestedValue(item, key) || `{{${key}}}`);
                return loopContent;
            }).join('');
        }
        return '';
    });
}

// Utility to handle conditional rendering in HTML
function handleConditionals(layout, dataItem) {
    const ifRegex = /{{#if (.*?)}}([\s\S]*?){{\/if}}/g;
    return layout.replace(ifRegex, (match, condition, content) => {
        return evaluateCondition(dataItem, condition) ? content : '';
    });
}


// Function to generate routes
function generateRoutes(routesDir, outputDir) {
    const routes = readDirRecursively(routesDir).filter(file => file.includes('index.html'));
    const routeResources = routes.map(route => {
        const relativePath = path.relative(routesDir, route);
        return {
            routePath: route,
            relativePath: relativePath,
            outputPath: path.join(outputDir, relativePath),
            routeParts: resolveRouteParts(relativePath)
        };
    });

    routeResources.forEach(resource => {
        generatePage(resource);
    });
}


// Function to generate a single page
function generatePage(resource) {
    const { routePath, outputPath, routeParts } = resource;
    const routeDir = path.dirname(routePath);
    const routeJsPath = path.join(routeDir, 'route.js');
    const routeAssetsDir = path.join(routeDir, 'assets');

    let content = fs.readFileSync(routePath, 'utf-8');

    let data;
    if (fs.existsSync(routeJsPath)) {
        const routeScriptContent = fs.readFileSync(routeJsPath, 'utf-8');
        const routeScript = eval(`(${routeScriptContent})`);
        const result = routeScript.getData(...routeParts);
        data = Array.isArray(result) ? result : [result];
    } else {
        data = getDataFromContent(...routeParts);
    }

    const layoutRegex = /{{\s*layout (\w+)\s*}}/g;
    let layout;
    const layoutMatch = layoutRegex.exec(content);
    if (layoutMatch) {
        content = content.replace(layoutMatch[0], '');
        layout = fs.readFileSync(path.join(LAYOUTS_DIR, `${layoutMatch[1]}.html`), 'utf-8');
    } else if (fs.existsSync(path.join(routeDir, 'layout.html'))) {
        layout = fs.readFileSync(path.join(routeDir, 'layout.html'), 'utf-8');
    }

    data.forEach(dataItem => {
        const contentRegex = /{{\s*content\s*}}/g;
        let renderedLayout = layout !== undefined ? layout.replace(contentRegex, content) : content;
        renderedLayout = handleLooping(renderedLayout, dataItem);
        renderedLayout = handleConditionals(renderedLayout, dataItem);
        const { layout: finalLayout, pageMetaData } = injectComponents(renderedLayout, dataItem);

        // Handle nested layouts
        let finalRenderedLayout = handleNestedLayouts(finalLayout, dataItem);

        // Replace remaining placeholders with dataItem values
        const placeholderRegex = /{{\s*([\w.]+)\s*}}/g;
        finalRenderedLayout = finalRenderedLayout.replace(placeholderRegex, (match, key) => getNestedValue(dataItem, key) || '');

        // Include collected CSS and JS
        pageMetaData.css.forEach(cssPath => {
            finalRenderedLayout = finalRenderedLayout.replace('</head>', `<link rel="stylesheet" href="${cssPath}">
</head>`);
        });
        pageMetaData.js.forEach(jsPath => {
            finalRenderedLayout = finalRenderedLayout.replace('</body>', `<script src="${jsPath}"></script>
</body>`);
        });

        // Create a new output path based on dynamic route parameters
        let dynamicOutputPath = outputPath;
        routeParts.forEach(part => {
            const partName = part.replace('[', '').replace(']', '');

            if (dataItem[partName]) {
                dynamicOutputPath = dynamicOutputPath.replace(`${part}`, dataItem[partName]);
            }
        });

        // Ensure output directory exists
        fs.mkdirSync(path.dirname(dynamicOutputPath), { recursive: true });
        fs.writeFileSync(dynamicOutputPath, finalRenderedLayout);

        // Copy associated assets folder
        if (dataItem.assets) {
            copyDirectory(dataItem.assets, path.join(path.dirname(dynamicOutputPath), 'assets'));
        }

        // Copy route-specific assets folder
        if (fs.existsSync(routeAssetsDir)) {
            copyDirectory(routeAssetsDir, path.join(path.dirname(dynamicOutputPath), 'assets'));
        }
    });
}

// Utility to handle nested layouts
function handleNestedLayouts(layout, dataItem) {
    const layoutRegex = /{{\s*layout (\w+)\s*}}/g;
    let match;
    while ((match = layoutRegex.exec(layout)) !== null) {
        const layoutName = match[1];
        const layoutPath = path.join('layouts', `${layoutName}.html`);
        if (fs.existsSync(layoutPath)) {
            let nestedLayout = fs.readFileSync(layoutPath, 'utf-8');
            nestedLayout = injectComponents(nestedLayout, dataItem);
            nestedLayout = handleLooping(nestedLayout, dataItem);
            layout = layout.replace(match[0], nestedLayout);
        } else {
            layout = layout.replace(match[0], '');
        }
    }
    return layout;
}

function getDataFromContent(...params) {
    const baseDir = path.join(__dirname, 'content');
    let dataItems = [];

    function buildDataItems(currentDir, remainingParams, item = {}) {
        if (remainingParams.length === 0) return;

        const [currentParam, ...nextParams] = remainingParams;

        if (currentParam.startsWith('[') && currentParam.endsWith(']')) {
            let currentPath = currentDir + "/" + currentParam;
            const subDirs = fs.readdirSync(currentPath).filter(subDir =>
                fs.statSync(path.join(currentPath, subDir)).isDirectory()
            );

            subDirs.forEach(subDir => {
                const subDirPath = path.join(currentPath, subDir);
                const contentJsonPath = path.join(subDirPath, 'content.json');
                const contentHtmlPath = path.join(subDirPath, 'content.html');
                const contentJsPath = path.join(subDirPath, 'content.js');
                const assetsDirPath = path.join(subDirPath, 'assets');

                // Clone item to avoid reference
                let newItem = {...item};

                newItem[currentParam.slice(1, -1)] = subDir;

                if (nextParams.length === 0) {
                    const contentJson = fs.existsSync(contentJsonPath) ? JSON.parse(fs.readFileSync(contentJsonPath, 'utf-8')) : {};
                    const contentHtml = fs.existsSync(contentHtmlPath) ? fs.readFileSync(contentHtmlPath, 'utf-8') : contentJson["content"];
                    newItem = {...newItem, ...contentJson, content: contentHtml};

                    if (fs.existsSync(contentJsPath)) {
                        const contentJs = require(contentJsPath);
                        for (const [key, func] of Object.entries(contentJs)) {
                            if (typeof func === 'function') {
                                newItem[key] = func(newItem);
                            }
                        }
                    }

                    if (fs.existsSync(assetsDirPath)) {
                        newItem.assets = assetsDirPath;
                    }

                    dataItems.push(newItem);
                } else {
                    buildDataItems(subDirPath, nextParams, newItem);
                }
            });
        } else {
            const literalDirPath = path.join(currentDir, currentParam);
            const contentJsonPath = path.join(literalDirPath, 'content.json');
            const contentHtmlPath = path.join(literalDirPath, 'content.html');
            const contentJsPath = path.join(literalDirPath, 'content.js');
            const assetsDirPath = path.join(literalDirPath, 'assets');

            if (nextParams.length === 0) {
                const contentJson = fs.existsSync(contentJsonPath) ? JSON.parse(fs.readFileSync(contentJsonPath, 'utf-8')) : {};
                const contentHtml = fs.existsSync(contentHtmlPath) ? fs.readFileSync(contentHtmlPath, 'utf-8') : contentJson["content"];
                let newItem = {...item, ...contentJson, content: contentHtml};

                if (fs.existsSync(contentJsPath)) {
                    const contentJs = require(contentJsPath);
                    for (const [key, func] of Object.entries(contentJs)) {
                        if (typeof func === 'function') {
                            newItem[key] = func(newItem);
                        }
                    }
                }

                if (fs.existsSync(assetsDirPath)) {
                    newItem.assets = assetsDirPath;
                }

                dataItems.push(newItem);
            } else {
                buildDataItems(literalDirPath, nextParams, item);
            }
        }
    }

    buildDataItems(baseDir, params);

    return dataItems;
}

// Utility to copy a directory recursively
function copyDirectory(srcDir, destDir) {
    const files = readDirRecursively(srcDir);
    files.forEach(file => {
        const relativePath = path.relative(srcDir, file);
        const destPath = path.join(destDir, relativePath);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(file, destPath);
    });
}

// Utility to delete a directory recursively
function deleteDirectoryRecursively(dir) {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file) => {
            const currentPath = path.join(dir, file);
            if (fs.lstatSync(currentPath).isDirectory()) {
                deleteDirectoryRecursively(currentPath);
            } else {
                fs.unlinkSync(currentPath);
            }
        });
        fs.rmdirSync(dir);
    }
}

// Run generator
deleteDirectoryRecursively(OUTPUT_DIR);
generateRoutes(BASE_DIR, OUTPUT_DIR);
