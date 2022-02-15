const axios = require('./src/AxiosHelper');
const { mergeData } = require('./src/DataHelper');
const moment = require('moment');

exports.onPreInit = () => console.log("Loaded gatsby-source-storm")

exports.sourceNodes = async ({
    actions,
    createContentDigest,
    createNodeId,
    getNodesByType,
    cache
  }, pluginOptions) => {
    const { createNode } = actions

    const pluginName = "gatsby-source-storm";
    const cacheKey = "gatsby-source-storm-data";
    const cacheTimestamp = "timestamp";

    const defaultOptions = {
        host: "not-yet-set"
    }

    pluginOptions.host = pluginOptions.host || defaultOptions.host;

    // see if there is any previously cached data
    const cachedData = await cache.get(cacheKey);
    // only get updated info if we have previous data, otherwise, get everything
    const lastFetched = cachedData ? await cache.get(cacheTimestamp) : null;
    const datePart = lastFetched ? `/${moment(lastFetched).format()}` : "";
    const url = `https://${pluginOptions.host}/api/system/export${datePart}`;

    if(!pluginOptions.appkey) {
        console.log("gatsby-cource-storm error: appkey wasn't given");
        return;
    }
        

    // get the data
    var data = {};
    await axios.getData(url, pluginOptions.appkey)
        .then(d => { 
            data = mergeData(cachedData, d);
        })
        .catch(err => {
            console.log(err);
            return;
        });
        

    // console.log(data.contentTypes);
    // Create all the gatsby nodes
    try {                
        const defaultStartDate = new Date(2000, 1, 1);
        const utcNow = new Date().getTime();        

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
            createNode(contentTypeNode);

            // loop through all the content and fill those out
            data.contentList.filter(o => o.contentTypeSlug === y.slug).forEach((c) => {

                // check for media and references and forms
                c.meta = getMetaChildren(data, c.meta);

                // calculate some unique values
                const childId = createNodeId(`storm${c.id}`);

                // get contenttype specific values
                if(y.slug === "seminar") {
                    let propStartDate = getPropertyValue(c.meta, 'start-datetime');
                    c.startDateTime = !!propStartDate ? new Date(propStartDate) : defaultStartDate;
                    c.isFuture = c.startDateTime > utcNow;
                }
                
                if(y.slug === "state-requirements") {
                    c.state = getPropertyValue(c.meta, 'state');
                    let stateList = getProperty(data.systemLists, 'states', 'slug');
                    c.stateName = stateList ? getProperty(stateList.items, c.state, 'value')?.label : null;
                }

                if(y.slug === "presenters") {
                    c.lastName = getPropertyValue(c.meta, 'last-name');
                }

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
                createNode(contentNode);

                // create types for the presentation types
                if(y.slug === "seminar") {
                    
                    // Live Webinars
                    if(c.meta.some(o => o.fieldTypeName === "reference" && 
                                    o.reference !== null && 
                                    o.reference.some(r => r.slug === "live-webinar"))) {
                        const contentNodeLive = {
                            ...c, // pass all data into this object
                            contentId: c.id,
                            slug: c.slug,
                            sourceInstanceName: pluginName,
                            id: childId + "live",
                            children: [],
                            parent: pluginName,
                            internal: {
                                type: `Storm${y.name.replace(" ", "")}Live`, // the name of the node used in graphQL
                                contentDigest: createContentDigest(c),
                                description: `A piece of Storm Content - ${y.name} - Live Webinar`,
                            },
                        };
                        createNode(contentNodeLive);
                    }
                    
                    // Recorded
                    if(c.meta.some(o => o.fieldTypeName === "reference" && 
                                    o.reference !== null && 
                                    o.reference.some(r => r.slug === "recorded-webinar"))) {
                        const contentNodeRecorded = {
                            ...c, // pass all data into this object
                            contentId: c.id,
                            slug: c.slug,
                            sourceInstanceName: pluginName,
                            id: childId + "recorded",
                            children: [],
                            parent: pluginName,
                            internal: {
                                type: `Storm${y.name.replace(" ", "")}Recorded`, // the name of the node used in graphQL
                                contentDigest: createContentDigest(c),
                                description: `A piece of Storm Content - ${y.name} - Recorded Webinar`,
                            },
                        };
                        createNode(contentNodeRecorded);
                    }
                }
            });
        });

        // systemlists
        data.systemLists?.forEach((c) => {
            const childId = createNodeId(`${pluginName}${c.id}syslist`);
            const contentTypeNode = {
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
            createNode(contentTypeNode);
        });

        // go through menus to create stormMenus/allStormMenus
        data.menus.forEach((c) => {
            const childId = createNodeId(`${pluginName}${c.id}menu`);
            const contentTypeNode = {
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
            createNode(contentTypeNode);
        });

        // forms
        data.forms.forEach((c) => {
            const childId = createNodeId(`${pluginName}${c.id}form`);
            const contentTypeNode = {
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
            createNode(contentTypeNode);
        });

       } catch (error) {
         console.error(error);
       }

    // cache things for later
    await cache.set(cacheKey, data);
    await cache.set(cacheTimestamp, Date.now());
    return
}

//#region Helpers
function getProperty (properties, slug, propname = 'slug') {    
    if(slug === null) return null;    
    let prop = properties.find(o => o[propname]?.toLowerCase() === slug.toLowerCase());    
    return prop === undefined ? null : prop;
}

function getPropertyValue (properties, slug, def = null) {
    let prop = properties.find(o => o.name === slug.toLowerCase());
    return prop === undefined ? def : prop.value;
}

// recursive function for mining meta references and media
function getMetaChildren(content, meta) {
    meta = meta.map((o,i) => {
        if(o.fieldTypeName === "media") {
            let media = []; // always possible to have more than one so we need an array
            let values = o.value?.split(',') || [];
            for(let a = 0; a < values.length; a++) {
                let m = content.media.find(m => m.id.toString() === values[a]);
                if(m) {
                    media.push(m);
                }
            }
            return (media.length > 0) ? { ...o, media } : o;
        }              
        if(o.fieldTypeName === "reference") {
            let reference = []; // always possible to have more than one so we need an array
            let values = o.value?.split(',') || [];
            for(let a = 0; a < values.length; a++) {
                let r = content.contentList.find(m => m.id.toString() === values[a]);
                if(r) {
                    r.meta = getMetaChildren(content, r.meta);
                    reference.push(r);
                }
            }
            return (reference.length > 0) ? { ...o, reference } : o;
        }      
        if(o.fieldTypeName === "form") {
            let forms = []; // always possible to have more than one so we need an array
            let values = o.value?.split(',') || [];
            for(let a = 0; a < values.length; a++) {
                let r = content.forms.find(m => m.id.toString() === values[a]);
                if(r) {
                    forms.push(r);
                }
            }
            return (forms.length > 0) ? { ...o, forms } : o;
        }     
        return o;
    });

    return meta;
}
//#endregion