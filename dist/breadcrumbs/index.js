"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Extension = void 0;
const node_assert_1 = require("node:assert");
const node_path_1 = require("node:path");
const program_1 = require("@diplodoc/cli/lib/program");
const utils_1 = require("@diplodoc/cli/lib/utils");
const cli_1 = require("@diplodoc/cli");
class Extension {
    apply(program) {
        (0, program_1.getHooks)(program).Config.tap('Breadcrumbs', (config) => {
            if (!config.breadcrumbs) {
                return config;
            }
            (0, node_assert_1.ok)((config.breadcrumbs === true || "object" === typeof config.breadcrumbs), 'breadcrumbs must be object or true');
            const options = Object.assign({}, { tocAsRoot: true, appendLabeled: false }, config.breadcrumbs);
            (0, node_assert_1.ok)("boolean" === typeof options.tocAsRoot, 'breadcrumbs.tocAsRoot must be boolean type');
            (0, node_assert_1.ok)("boolean" === typeof options.appendLabeled, 'breadcrumbs.appendLabeled must be boolean type');
            config.breadcrumbs = options;
            return config;
        });
        (0, cli_1.getBuildHooks)(program).BeforeRun.for('html').tap('Breadcrumbs', (run) => {
            if (!program.config.breadcrumbs) {
                return;
            }
            const tocService = run.toc;
            const breadcrumbCacheMap = new Map();
            (0, cli_1.getEntryHooks)(run.entry).State.tap('Breadcrumbs', (state) => {
                const toc = tocService.for(state.router.pathname);
                if (!toc.items || toc.items.length === 0) {
                    return state;
                }
                const breadcrumbsMap = getBreadcrumbsMap(toc, program.config.breadcrumbs, breadcrumbCacheMap);
                const rootPath = (0, node_path_1.join)(state.router.pathname, state.router.base);
                const pathname = state.router.pathname.replace(rootPath, '');
                if (!breadcrumbsMap.has(pathname)) {
                    return state;
                }
                state.data.breadcrumbs = breadcrumbsMap.get(pathname)
                    .map(item => item.url && !(0, utils_1.isExternalHref)(item.url)
                    ? { ...item, url: (0, node_path_1.join)(rootPath, item.url) + '.html' }
                    : item);
                return state;
            });
        });
    }
}
exports.Extension = Extension;
function getBreadcrumbsMap(toc, config, breadcrumbCacheMap) {
    if (!breadcrumbCacheMap.has(toc.path)) {
        breadcrumbCacheMap.set(toc.path, createBreadcrumbsMap(toc, config));
    }
    return breadcrumbCacheMap.get(toc.path);
}
function createBreadcrumbsMap(toc, options) {
    const breadcrumbsMap = new Map();
    function processItem(item, currentPath) {
        const breadcrumbItem = { name: item.name };
        if (item.href) {
            breadcrumbItem.url = (0, utils_1.setExt)(item.href, '');
        }
        if (breadcrumbItem.url) {
            breadcrumbsMap.set(breadcrumbItem.url, [...currentPath, breadcrumbItem]);
        }
        if (item.items?.length > 0) {
            const breadcrumbItems = !options.appendLabeled && item.labeled && !breadcrumbItem.url
                ? [...currentPath]
                : [...currentPath, breadcrumbItem];
            item.items.forEach(child => processItem(child, breadcrumbItems));
        }
    }
    const initialBreadcrumbItems = options.tocAsRoot && toc.title && toc.href
        ? [{ name: toc.title, url: toc.href }]
        : [];
    toc.items.forEach(item => processItem(item, initialBreadcrumbItems));
    return breadcrumbsMap;
}
