import { ok } from 'node:assert';
import { join } from 'node:path';
import { getHooks as getBaseHooks } from '@diplodoc/cli/lib/program';
import { setExt, isExternalHref } from '@diplodoc/cli/lib/utils';
import { getBuildHooks, getEntryHooks } from '@diplodoc/cli';
export class Extension {
    apply(program) {
        getBaseHooks(program).Config.tap('Breadcrumbs', (config) => {
            if (!config.breadcrumbs) {
                return config;
            }
            ok((config.breadcrumbs === true || "object" === typeof config.breadcrumbs), 'breadcrumbs must be object or true');
            const options = Object.assign({}, { tocAsRoot: true, appendLabeled: false }, config.breadcrumbs);
            ok("boolean" === typeof options.tocAsRoot, 'breadcrumbs.tocAsRoot must be boolean type');
            ok("boolean" === typeof options.appendLabeled, 'breadcrumbs.appendLabeled must be boolean type');
            config.breadcrumbs = options;
            return config;
        });
        getBuildHooks(program).BeforeRun.for('html').tap('Breadcrumbs', (run) => {
            if (!program.config.breadcrumbs) {
                return;
            }
            const tocService = run.toc;
            const breadcrumbCacheMap = new Map();
            getEntryHooks(run.entry).State.tap('Breadcrumbs', (state) => {
                const toc = tocService.for(state.router.pathname);
                if (!toc.items || toc.items.length === 0) {
                    return state;
                }
                const breadcrumbsMap = getBreadcrumbsMap(toc, program.config.breadcrumbs, breadcrumbCacheMap);
                const rootPath = join(state.router.pathname, state.router.base);
                const pathname = state.router.pathname.replace(rootPath, '');
                if (!breadcrumbsMap.has(pathname)) {
                    return state;
                }
                state.data.breadcrumbs = breadcrumbsMap.get(pathname)
                    .map(item => item.url && !isExternalHref(item.url)
                    ? { ...item, url: join(rootPath, item.url) + '.html' }
                    : item);
                return state;
            });
        });
    }
}
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
            breadcrumbItem.url = setExt(item.href, '');
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
