/**
 * Фича: Удаляет расширения .html и index.html из ссылок
 *
 * Так же добавляется перехватчик клика на ссылки `.dc-doc-layout__center a` для обработчика из `app.js`, который
 * подмешивает обратно расширения `.html`
 *
 * Пример использования:
 *
 * .yfm >
 *      resources:
 *          script:
 *              - _assets/script/feature-base.js
 *              - _assets/script/feature-clean-links.js
 *              ...
 *  toc.yaml >
 *      features:
 *        cleanLinks: true
 *        # или
 *        cleanLinks:
 *          ext: boolean # удаляет расширение html
 *          index: boolean # удаляет index.html и index из ссылок
 */
function injectCleanLinks() {
    const diplodocDataRef = window.__DATA__
    const diplodocTocDataRef = diplodocDataRef.data.toc

    if (!diplodocTocDataRef.features || !diplodocTocDataRef.features.cleanLinks) {
        return
    }

    const options = Object.assign({}, {ext: true, index: true}, diplodocTocDataRef.features.cleanLinks)

    if (options.ext && options.index) {
        diplodocDataRef.router.pathname = diplodocDataRef.router.pathname.replace('/index', '')
    }

    diplodocTocDataRef.href = cleanLink(diplodocTocDataRef.href, options)


    function recursiveCleanLinks(items) {
        for (const item of items) {
            item.href = cleanLink(item.href, options)

            if (Array.isArray(item.items)) {
                recursiveCleanLinks(item.items)
            }
        }
    }

    recursiveCleanLinks(diplodocTocDataRef.items)

    document.addEventListener("click", (event => {
        const href = event.target.href
        const origin = window.location.origin

        if (event.target.matches(".dc-doc-layout__center a") && href.startsWith(origin)) {
            event.preventDefault()
            event.stopPropagation()

            window.location.href = cleanLink(href, options)
        }
    }), true)
}

const cleanAllExp = /(\/index)?\.html$/
const cleanExtExp = /\.html$/

function cleanLink(url, options) {
    if (options.ext && options.index) {
        return url.replace(cleanAllExp, '')
    }

    if (options.ext) {
        return url.replace(cleanExtExp, '')
    }

    return url
}

window.FEATURE_RUNNER.set('cleanLinks', injectCleanLinks)
