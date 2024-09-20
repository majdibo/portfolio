const {RouteManager} = require('./routeManager');
const {ComponentManager} = require('./componentManager');
const {LayoutManager} = require('./layoutManager');
const path = require('path');
const logger = require('./logger');
const {deleteRecursively} = require('./helpers');

const BASE_DIR = 'src';
const OUTPUT_DIR = 'build';


async function generateSite() {
    deleteRecursively(OUTPUT_DIR);
    logger.info('Starting site generation...');
    const basePath = path.resolve(BASE_DIR);
    const layoutManager = new LayoutManager(`${basePath}/layouts`);
    const componentManager = new ComponentManager(`${basePath}/components`, OUTPUT_DIR);
    const routeManager = new RouteManager(`${basePath}/routes`, `${basePath}/content`, OUTPUT_DIR, componentManager);

    layoutManager.registerLayouts();
    componentManager.registerComponents();

    // Start walking the tree from the root
    await routeManager.walkRouteTree(`${basePath}/routes`);

    logger.info('Site generation complete.');
}

// Run generator
generateSite();
