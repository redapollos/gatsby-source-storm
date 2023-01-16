const axios = require("./src/AxiosHelper");
const { mergeData, createNodeManifest } = require("./src/DataHelper");
const moment = require("moment");
const package = require("./package.json");

exports.onPreInit = () => console.log(`Loaded gatsby-source-storm@${package.version}`);

exports.sourceNodes = async ({ actions, createContentDigest, createNodeId, cache }, pluginOptions) => {
    const { createNode, unstable_createNodeManifest } = actions;

    const pluginName = "gatsby-source-storm";
    const cacheKey = "gatsby-source-storm-data";
    const cacheTimestamp = "timestamp";

    const defaultOptions = {
        host: "not-yet-set",
        debug: false,
    };

    pluginOptions.host = pluginOptions.host || defaultOptions.host;
    pluginOptions.debug = pluginOptions.debug || defaultOptions.debug;

    // see if there is any previously cached data
    const cachedData = !pluginOptions.debug ? await cache.get(cacheKey) : null;
    // only get updated info if we have previous data, otherwise, get everything
    const lastFetched = cachedData ? await cache.get(cacheTimestamp) : null;
    const datePart = lastFetched ? `/${moment(lastFetched).format()}` : "";
    const url = `https://${pluginOptions.host}/api/system/export${datePart}`;
    const utcNow = new Date().getTime();
    const slugList = []; // check for dups

    if (!pluginOptions.appkey) {
        console.log("gatsby-source-storm error: appkey wasn't given");
        return;
    }

    // get the data
    var data = {};
    await axios
        .getData(url, pluginOptions.appkey)
        .then((d) => {
            data = mergeData(cachedData, d);
        })
        .catch((err) => {
            console.log(err);
            return;
        });

    if (pluginOptions.debug) {
        console.log(data.contentTypes);
        console.log(`Preview: ${process.env.GATSBY_IS_PREVIEW?.toString()}`);
    }

    // Create all the gatsby nodes
    try {
        // go through each items in the json array and create a new "node" in StormContent/allStormContent
        data.contentTypes.forEach((y) => {
            // go through terms to create StormContentTypes/allStormContentTypes
            const childId = createNodeId(`${pluginName}${y.id}type`);
            const contentTypeNode = {
                ...y, // pass all data into this object
                contentId: y.id,
                slug: y.slug,
                sourceInstanceName: pluginName,
                id: childId,
                children: [],
                parent: pluginName,
                internal: {
                    type: "StormContentTypes", // the name of the node used in graphQL
                    contentDigest: createContentDigest(y),
                    description: "A Storm Content Type",
                },
            };

            // if we have a dup, then we have problems
            if (isSlugDup(slugList, y)) return;

            const n = createNode(contentTypeNode);

            if (pluginOptions.debug) console.log(`ContentType: ${y.slug}`);

            // loop through all the content types/content and fill out the gatsby nodes
            data.contentList
                .filter((o) => o.contentTypeSlug === y.slug)
                .forEach((c) => {
                    // check for media and references and forms
                    c.meta = getMetaChildren(data, c.meta);

                    // calculate some unique values
                    const childId = createNodeId(`storm${c.id}`);

                    // if we have a dup, then we have problems
                    if (isSlugDup(slugList, c)) return;

                    // Regular Entry
                    const contentNode = {
                        ...c, // pass all data into this object
                        contentId: c.id,
                        slug: c.slug,
                        sourceInstanceName: pluginName,
                        id: childId,
                        children: [],
                        parent: pluginName,
                        internal: {
                            type: `Storm${y.name.replace(" ", "")}`, // the name of the node used in graphQL
                            contentDigest: createContentDigest(c),
                            description: `A piece of Storm Content - ${y.name}`,
                        },
                    };

                    // map all meta into first rate properties
                    for (let m of c.meta) {
                        contentNode[sluggify(m.name)] = m.value;

                        // if date or time, create a numeric field equivalent
                        if ((m.fieldType === 7 || m.fieldType === 8 || m.fieldType === 9) && m.value) {
                            contentNode[`${sluggify(m.name)}_isFuture`] = Date.parse(m.value) > utcNow;
                            contentNode[`${sluggify(m.name)}_milliseconds`] = m.value ? parseInt(Date.parse(m.value), 10) : 0;
                        }
                    }

                    const gatsbyNode = createNode(contentNode);

                    // for these, create a manifest so we can handle incremental builds
                    createNodeManifest({
                        entryItem: c,
                        entryNode: gatsbyNode,
                        appKey: pluginOptions.appkey,
                        unstable_createNodeManifest,
                        debug: pluginOptions.debug,
                    });
                });
        });

        // systemlists
        data.systemLists?.forEach((c) => {
            const childId = createNodeId(`${pluginName}${c.id}syslist`);
            const listNode = {
                ...c, // pass all data into this object
                menuId: c.id,
                slug: c.slug,
                sourceInstanceName: pluginName,
                id: childId,
                children: [],
                parent: pluginName,
                internal: {
                    type: "StormLists", // the name of the node used in graphQL
                    contentDigest: createContentDigest(c),
                    description: "A Storm List",
                },
            };
            const n = createNode(listNode);
        });

        // go through menus to create stormMenus/allStormMenus
        data.menus.forEach((c) => {
            const childId = createNodeId(`${pluginName}${c.id}menu`);
            const menuNode = {
                ...c, // pass all data into this object
                menuId: c.id,
                slug: c.slug,
                sourceInstanceName: pluginName,
                id: childId,
                children: [],
                parent: pluginName,
                internal: {
                    type: "StormMenus", // the name of the node used in graphQL
                    contentDigest: createContentDigest(c),
                    description: "A Storm Menu",
                },
            };

            const n = createNode(menuNode);
        });

        // forms
        data.forms.forEach((c) => {
            const childId = createNodeId(`${pluginName}${c.id}form`);
            const formNode = {
                ...c, // pass all data into this object
                formId: c.id,
                slug: c.slug,
                sourceInstanceName: pluginName,
                id: childId,
                children: [],
                parent: pluginName,
                internal: {
                    type: "StormForms", // the name of the node used in graphQL
                    contentDigest: createContentDigest(c),
                    description: "A Storm Form",
                },
            };

            const n = createNode(formNode);
        });

        // go through settings to create stormSettings/allStormSettings
        data.settings.forEach((c) => {
            const childId = createNodeId(`${pluginName}${c.id}setting`);
            const menuNode = {
                ...c, // pass all data into this object
                settingId: c.id,
                slug: c.name,
                sourceInstanceName: pluginName,
                id: childId,
                children: [],
                parent: pluginName,
                internal: {
                    type: "StormSettings", // the name of the node used in graphQL
                    contentDigest: createContentDigest(c),
                    description: "Storm Settings",
                },
            };

            const n = createNode(menuNode);
        });
    } catch (error) {
        console.error(error);
    }

    // cache things for later
    await cache.set(cacheKey, data);
    await cache.set(cacheTimestamp, Date.now());
    return;
};

//#region Helpers
function isSlugDup(slugList, o) {
    let s = o.slug ?? o.name;
    if (slugList.indexOf(s) > -1) {
        console.error(`${s} IS ALREADY IN USE AND WON'T BE RENDERED AGAIN! ${o.name}`);
        return true;
    } else slugList.push(s);
    return false;
}

function sluggify(str) {
    return str.replace(/-/gi, "_");
}

function getProperty(properties, slug, propname = "slug") {
    if (slug === null) return null;
    let prop = properties.find((o) => o[propname]?.toLowerCase() === slug.toLowerCase());
    return prop === undefined ? null : prop;
}

function getPropertyValue(properties, slug, def = null) {
    let prop = properties.find((o) => o.name === slug.toLowerCase());
    return prop === undefined ? def : prop.value;
}

// recursive function for mining meta references and media
function getMetaChildren(content, meta) {
    meta = meta.map((o, i) => {
        if (o.fieldTypeName === "media") {
            let media = []; // always possible to have more than one so we need an array
            let values = o.value?.split(",") || [];
            for (let a = 0; a < values.length; a++) {
                let m = content.media.find((m) => m.id.toString() === values[a]);
                if (m) {
                    media.push(m);
                }
            }
            return media.length > 0 ? { ...o, media } : o;
        }
        if (o.fieldTypeName === "reference") {
            let reference = []; // always possible to have more than one so we need an array
            let values = o.value?.split(",") || [];
            for (let a = 0; a < values.length; a++) {
                let r = content.contentList.find((m) => m.id.toString() === values[a]);
                if (r) {
                    r.meta = getMetaChildren(content, r.meta);
                    reference.push(r);
                }
            }
            return reference.length > 0 ? { ...o, reference } : o;
        }
        if (o.fieldTypeName === "form") {
            let forms = []; // always possible to have more than one so we need an array
            let values = o.value?.split(",") || [];
            for (let a = 0; a < values.length; a++) {
                let r = content.forms.find((m) => m.id.toString() === values[a]);
                if (r) {
                    forms.push(r);
                }
            }
            return forms.length > 0 ? { ...o, forms } : o;
        }
        return o;
    });

    return meta;
}
//#endregion
