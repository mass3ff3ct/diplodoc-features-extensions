import { ok } from 'node:assert';
import { getHooks as getBaseHooks } from '@diplodoc/cli/lib/program';
import { getHooks as getTocHooks } from '@diplodoc/cli/lib/toc';
import { getBuildHooks, getEntryHooks, getSearchHooks } from '@diplodoc/cli';
import { isExternalHref, setExt } from '@diplodoc/cli/lib/utils';
import { join } from "node:path";
const cleanExtExp = /\.html/;
const cleanIndexExp = /\/index/;
const htmlLinkExp = /href="(.*?)"/;
export class Extension {
    apply(program) {
        getBaseHooks(program).Config.tap('CleanLinks', (config) => {
            if (!config.cleanLinks) {
                return config;
            }
            ok((config.cleanLinks === true || "object" === typeof config.cleanLinks), 'cleanLinks must be object or true');
            const options = Object.assign({}, { ext: true, index: true }, config.cleanLinks);
            ok("boolean" === typeof options.ext, 'breadcrumbs.tocAsRoot must be boolean type');
            ok("boolean" === typeof options.index, 'breadcrumbs.appendLabeled must be boolean type');
            config.cleanLinks = options;
            return config;
        });
        getBuildHooks(program).BeforeRun.for('html').tap('CleanLinks', (run) => {
            if (!program.config.cleanLinks) {
                return;
            }
            const options = program.config.cleanLinks;
            getTocHooks(run.toc).Dump.tapPromise('CleanLinks', async (vfile) => {
                await run.toc.walkItems([vfile.data], async (item) => {
                    if (item.href && !isExternalHref(item.href)) {
                        item.href = cleanLink(item.href, program.config.cleanLinks);
                    }
                    return item;
                });
            });
            getEntryHooks(run.entry).State.tap('CleanLinks', (state) => {
                if (state.data.html) {
                    state.data.html = cleanHtmlLinks(state.data.html, options);
                }
                if (state.data.breadcrumbs) {
                    state.data.breadcrumbs.forEach(breadcrumbItem => {
                        if (breadcrumbItem.url) {
                            breadcrumbItem.url = cleanLink(breadcrumbItem.url, options);
                        }
                    });
                }
                state.router.pathname = cleanLink(state.router.pathname, options);
                return state;
            });
            getEntryHooks(run.entry).Page.tap('CleanLinks', (template) => {
                const initOptions = {
                    route: setExt(template.path, '')
                };
                template.addScript('/_extensions/clean-links-extension.js', {
                    position: 'leading',
                    attrs: {
                        defer: void 0
                    }
                });
                template.addScript(`window.cleanLinksExtensionInit(${JSON.stringify(initOptions)})`, {
                    position: 'state',
                    inline: true,
                });
                return template;
            });
            getSearchHooks(run.search).Provider.for('local').tap('CleanLinks', (provider) => {
                if ("indexer" in provider) {
                    const indexer = provider.indexer;
                    const ownAddMethod = indexer.add;
                    indexer.add = async (lang, url, data) => ownAddMethod.call(indexer, lang, cleanLink(url, options), data);
                }
                return provider;
            });
        });
        getBuildHooks(program).AfterRun.for('html').tapPromise('CleanLinks', async (run) => {
            if (!program.config.cleanLinks) {
                return;
            }
            const extensionFilePath = join(__dirname, 'resources', 'clean-links-extension.js');
            try {
                await run.copy(extensionFilePath, join(run.output, '_extensions', 'clean-links-extension.js'));
            }
            catch (error) {
                run.logger.warn(`Unable copy the clean-links extension script ${extensionFilePath}.`, error);
            }
        });
    }
}
function cleanHtmlLinks(html, options) {
    return html.replace(htmlLinkExp, (match, href) => match.replace(href, cleanLink(href, options)));
}
function cleanLink(url, options) {
    if (options.ext) {
        url = url.replace(cleanExtExp, '');
    }
    if (options.index) {
        url = url.replace(cleanIndexExp, '');
    }
    return url;
}
