const logger = require("./logger");
const path = require("path");
const fs = require("fs");
const Handlebars = require("handlebars");
const {readRecursively} = require("./helpers");

 class LayoutManager {
    constructor(layoutDir) {
        this.layoutDir = layoutDir;
        logger.info(`LayoutManager initialized with layout directory: ${layoutDir}`);
    }

    registerLayouts() {
        logger.info(`Registering layouts from directory: ${this.layoutDir}`);
        const registerLayout = (file => {
            if (file.endsWith('.html')) {
                const relativePath = path.relative(this.layoutDir, file);
                const name = "layout/" + relativePath.replace(path.sep, '/').replace('.html', '');
                const content = fs.readFileSync(file, 'utf-8');
                Handlebars.registerPartial(name, content);
                logger.debug(`Registered layout: ${name}`);
            }
        });

        readRecursively(this.layoutDir, registerLayout);
    }
}

module.exports = {LayoutManager};
