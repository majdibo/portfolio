const logger = require("./logger");
const path = require("path");
const fs = require("fs");
const Handlebars = require("handlebars");
const {copyAssets, readRecursively} = require("./helpers");

 class ComponentManager {

    mergeDirectories = ["organism", "molecule", "atom", "template"];

    metadata = {
        css: [],
        js: [],
        assets: []
    };

    constructor(componentDir, outputDir) {
        this.componentDir = componentDir;
        this.outputDir = outputDir;
        logger.info(`ComponentManager initialized with component directory: ${componentDir}`);
    }

    registerComponents() {



        const registerComponent = (file => {
            if (file.endsWith('.html')) {
                let componentName;
                if (path.basename(file) === 'component.html') {
                    const relativePath = path.relative(this.componentDir, path.dirname(file));
                    const folderPath = path.dirname(relativePath).replace(path.sep, '/');
                    componentName = `${folderPath}/${path.basename(path.dirname(file))}`;
                } else {
                    const relativePath = path.relative(this.componentDir, file);
                    const folderPath = path.dirname(relativePath).replace(path.sep, '/');
                    componentName = `${folderPath}/${path.basename(file, '.html')}`;
                }

                this.mergeDirectories.forEach((dir) => {
                    componentName = componentName.replace(`${dir}/`, '');
                });

                const content = fs.readFileSync(file, 'utf-8');
                Handlebars.registerPartial(componentName, content);

                // Register component CSS and JS
                const componentDir = path.dirname(file);
                const componentCssPath = path.join(componentDir, 'component.css');
                const componentJsPath = path.join(componentDir, 'component.js');
                const componentAssetsPath = path.join(componentDir, 'assets');


                // Collect CSS
                if (fs.existsSync(componentCssPath)) {
                    const cssOutputPath = path.join(this.outputDir, 'assets', 'components', componentName, 'component.css');
                    fs.mkdirSync(path.dirname(cssOutputPath), {recursive: true});
                    fs.copyFileSync(componentCssPath, cssOutputPath);
                    this.metadata.css.push({[componentName]: `/assets/components/${componentName}/component.css`});
                }

                // Collect JavaScript
                if (fs.existsSync(componentJsPath)) {
                    const jsOutputPath = path.join(this.outputDir, 'assets', 'components', componentName, 'component.js');
                    fs.mkdirSync(path.dirname(jsOutputPath), {recursive: true});
                    fs.copyFileSync(componentJsPath, jsOutputPath);
                    this.metadata.js.push({[componentName]: `/assets/components/${componentName}/component.js`});
                }

                // Collect Assets
                if (fs.existsSync(componentAssetsPath)) {
                    const assetsOutputPath = path.join(this.outputDir, 'assets', 'components', componentName, 'assets');
                    fs.mkdirSync(assetsOutputPath, {recursive: true});
                    copyAssets(componentAssetsPath, assetsOutputPath);
                    this.metadata.assets.push({[componentName]: `/assets/components/${componentName}/assets`});
                }
            }
        });

        readRecursively(this.componentDir, registerComponent);
    }
}

module.exports = {ComponentManager};
