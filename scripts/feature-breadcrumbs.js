/**
 * Фича: Хлебные крошки
 *
 * Пример использования:
 *
 * .yfm >
 *      resources:
 *          script:
 *              - _assets/script/feature-base.js
 *              - _assets/script/feature-breadcrumbs.js
 *              ...
 *  toc.yaml >
 *      title: ...
 *      href: ...
 *      features:
 *        breadcrumbs: boolean
 *        # или
 *        breadcrumbs:
 *            tocAsRoot: boolean # если true, то корнем будет сам toc (title + href)
 */
function injectBreadcrumbs() {
    const diplodocDataRef = window.__DATA__
    const diplodocTocDataRef = diplodocDataRef.data.toc

    if (diplodocDataRef.data.leading) {
        return
    }

    if (!diplodocTocDataRef.items) {
        return
    }

    if (!diplodocTocDataRef.features || !diplodocTocDataRef.features.breadcrumbs) {
        return
    }

    const options = Object.assign({}, {tocAsRoot: true}, diplodocTocDataRef.features.breadcrumbs)
    const route = diplodocDataRef.router.pathname
    const breadcrumbs = []

    if (options.tocAsRoot) {
        breadcrumbs.push({
            name: diplodocTocDataRef.title,
            url: window.FEATURE_UTILS.urlWithoutExtension(diplodocTocDataRef.href)
        })
    }

    function recursiveFindItem(items) {
        for (const item of items) {
            const url = window.FEATURE_UTILS.urlWithoutExtension(item.href)

            if (url === route) {
                return [{ name: item.name, url: url,}]
            } else if (Array.isArray(item.items)) {
                const result = recursiveFindItem(item.items)

                if (result.length > 0) {
                    return [{name: item.name, url: url}, ...result]
                }
            }
        }

        return []
    }

    const nextLevelBreadcrumbs = recursiveFindItem(diplodocTocDataRef.items)

    diplodocDataRef.data.breadcrumbs = [
        ...breadcrumbs,
        ...nextLevelBreadcrumbs
    ]
}

window.FEATURE_RUNNER.set("breadcrumbs", injectBreadcrumbs)
