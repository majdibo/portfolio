const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Register the "component" helper
Handlebars.registerHelper('component', function(name, options) {
    const componentPath = path.join(__dirname, 'components', `${name}.html`);
    if (fs.existsSync(componentPath)) {
        const componentContent = fs.readFileSync(componentPath, 'utf-8');
        const template = Handlebars.compile(componentContent);
        return new Handlebars.SafeString(template(this));
    } else {
        throw new Error(`Missing component: ${name}`);
    }
});

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
        const template = Handlebars.compile(layout || content);
        const renderedLayout = template(dataItem);

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
        fs.writeFileSync(dynamicOutputPath, renderedLayout);

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
