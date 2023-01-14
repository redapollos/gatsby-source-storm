let warnOnceForNoSupport = false;

var mergeData = function (full, partial) {
    console.log(
        `Storm Data :: Content: ${partial.contentList.length} added ${partial.contentListDeleted.length} removed, ContentTypes: ${partial.contentTypes.length}, SystemLists: ${partial.systemLists.length}, Menus: ${partial.menus.length}, Forms: ${partial.forms.length}, Settings: ${partial.settings.length}`
    );

    if (!full) return partial;

    // updates
    full.contentTypes = full.contentTypes.map((o, i) => {
        return partial.contentTypes.some((y) => y.id === o.id) ? partial.contentTypes.find((y) => y.id === o.id) : o;
    });

    full.contentList = full.contentList.map((o, i) => {
        return partial.contentList.some((y) => y.id === o.id) ? partial.contentList.find((y) => y.id === o.id) : o;
    });

    full.systemLists = full.systemLists.map((o, i) => {
        return partial.systemLists.some((y) => y.id === o.id) ? partial.systemLists.find((y) => y.id === o.id) : o;
    });

    full.menus = full.menus.map((o, i) => {
        return partial.menus.some((y) => y.id === o.id) ? partial.menus.find((y) => y.id === o.id) : o;
    });

    full.forms = full.forms.map((o, i) => {
        return partial.forms.some((y) => y.id === o.id) ? partial.forms.find((y) => y.id === o.id) : o;
    });

    full.settings = full.settings.map((o, i) => {
        return partial.settings.some((y) => y.id === o.id) ? partial.settings.find((y) => y.id === o.id) : o;
    });

    // adds
    const newContentTypes = partial.contentTypes.filter((o) => !full.contentTypes.some((x) => x.id === o.id));
    const newContentList = partial.contentList.filter((o) => !full.contentList.some((x) => x.id === o.id));
    const newSystemLists = partial.systemLists.filter((o) => !full.systemLists.some((x) => x.id === o.id));
    const newMenus = partial.menus.filter((o) => !full.menus.some((x) => x.id === o.id));
    const newForms = partial.forms.filter((o) => !full.forms.some((x) => x.id === o.id));
    const newSettings = partial.settings.filter((o) => !full.settings.some((x) => x.id === o.id));

    if (newContentTypes) full.contentTypes = full.contentTypes.concat(newContentTypes);
    if (newContentList) full.contentList = full.contentList.concat(newContentList);
    if (newSystemLists) full.systemLists = full.systemLists.concat(newSystemLists);
    if (newMenus) full.menus = full.menus.concat(newMenus);
    if (newForms) full.forms = full.forms.concat(newForms);
    if (newSettings) full.settings = full.settings.concat(newSettings);

    // deletes
    if (partial.contentListDeleted) {
        full.contentList = full.contentList.filter((o) => !partial.contentListDeleted.some((x) => x === o.id));
    }

    return full;
};

var createNodeManifest = function ({
    entryItem, // the raw data source/cms content data
    appKey, // the cms project data
    entryNode, // the Gatsby node
    unstable_createNodeManifest,
}) {
    // This env variable is provided automatically on Gatsby Cloud hosting
    const isPreview = process.env.GATSBY_IS_PREVIEW === true;
    const createNodeManifestIsSupported = typeof unstable_createNodeManifest === `function`;
    const shouldCreateNodeManifest = isPreview && createNodeManifestIsSupported && entryItem.isPreviewable && entryItem.title !== undefined;
    if (shouldCreateNodeManifest) {
        const updatedOn = entryItem.updatedOn;
        const manifestId = `${appKey}-${entryItem.id}-${updatedOn}`;
        unstable_createNodeManifest({
            manifestId,
            node: entryNode,
            updatedAtUTC: updatedOn,
        });
    } else if (
        // it's helpful to let users know if they're using an outdated Gatsby version so they'll upgrade for the best experience
        isPreview &&
        !createNodeManifestIsSupported &&
        !warnOnceForNoSupport
    ) {
        console.warn(
            `${sourcePluginName}: Your version of Gatsby core doesn't support Content Sync (via the unstable_createNodeManifest action). Please upgrade to the latest version to use Content Sync in your site.`
        );
        // This is getting called for every entry node so we don't want the console logs to get cluttered
        warnOnceForNoSupport = true;
    }
};

module.exports = {
    mergeData,
    createNodeManifest,
};
