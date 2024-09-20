
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
// Copy assets from source to destination


function copyAssets(srcDir, destDir) {
    ensureDirectoryExists(destDir);

    const filesAndDirs = fs.readdirSync(srcDir);
    for (const item of filesAndDirs) {
        const srcPath = path.join(srcDir, item);
        const destPath = path.join(destDir, item);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            copyAssets(srcPath, destPath); // Recursively copy directories
        } else if (!item.endsWith('route.js')) { // Avoid copying route.js
            fs.cpSync(srcPath, destPath);
            logger.debug(`Copied asset: ${srcPath} to ${destPath}`);
        }
    }
}

// Utility to delete a directory recursively
function deleteRecursively(dir) {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file) => {
            const currentPath = path.join(dir, file);
            if (fs.lstatSync(currentPath).isDirectory()) {
                deleteRecursively(currentPath);
            } else {
                fs.unlinkSync(currentPath);
            }
        });
        fs.rmdirSync(dir);
    }
}


function readRecursively(dir, resolve) {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            readRecursively(filePath, resolve)
        } else {
            resolve(filePath);
        }
    });

    return results;
}


// Utility function to ensure the directory exists
function ensureDirectoryExists(filePath) {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {recursive: true});
        logger.debug(`Directory created: ${dirPath}`);
    }
}

module.exports = {
    copyAssets,
    deleteRecursively,
    readRecursively,
    ensureDirectoryExists
}
