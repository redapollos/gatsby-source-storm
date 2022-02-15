let warnOnceForNoSupport = false;

var mergeData = function(full, partial) {
    if(!full)
        return partial;

    full.contentTypes = full.contentTypes.map((o, i) => {
        return partial.contentTypes.some(y => y.id === o.id) ? partial.contentTypes.find(y => y.id === o.id) : o;
    });

    full.contentList = full.contentList.map((o, i) => {
        return partial.contentList.some(y => y.id === o.id) ? partial.contentList.find(y => y.id === o.id) : o;
    });

    full.systemLists = full.systemLists.map((o, i) => {
        return partial.systemLists.some(y => y.id === o.id) ? partial.systemLists.find(y => y.id === o.id) : o;
    });

    full.menus = full.menus.map((o, i) => {
        return partial.menus.some(y => y.id === o.id) ? partial.menus.find(y => y.id === o.id) : o;
    });

    full.forms = full.forms.map((o, i) => {
        return partial.forms.some(y => y.id === o.id) ? partial.forms.find(y => y.id === o.id) : o;
    });

    return full;
};

var createNodeManifest = function ({
        entryItem, // the raw data source/cms content data
        appKey,   // the cms project data
        entryNode, // the Gatsby node
        unstable_createNodeManifest}) {

    // This env variable is provided automatically on Gatsby Cloud hosting
    const isPreview = process.env.GATSBY_IS_PREVIEW === `true`
    const createNodeManifestIsSupported = typeof unstable_createNodeManifest === `function`
    const shouldCreateNodeManifest = isPreview && createNodeManifestIsSupported
    if (shouldCreateNodeManifest) {
        const updatedOn = entryItem.updatedOn
        const manifestId = `${appKey}-${entryItem.id}-${updatedOn}`
        unstable_createNodeManifest({
            manifestId,
            node: entryNode,
            updatedAtUTC: updatedOn,
        })
    }
    else if (
        // it's helpful to let users know if they're using an outdated Gatsby version so they'll upgrade for the best experience
        isPreview && !createNodeManifestIsSupported && !warnOnceForNoSupport
      ) {
        console.warn(
          `${sourcePluginName}: Your version of Gatsby core doesn't support Content Sync (via the unstable_createNodeManifest action). Please upgrade to the latest version to use Content Sync in your site.`
        )
        // This is getting called for every entry node so we don't want the console logs to get cluttered
        warnOnceForNoSupport = true
    }
}

module.exports = { 
    mergeData,
    createNodeManifest
};