
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

module.exports = { 
    mergeData
};