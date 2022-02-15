const https = require('https');
const axios = require("axios");

/**
 * Disable only in development mode
 */
 if (process.env.NODE_ENV === 'development') {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    })
    axios.defaults.httpsAgent = httpsAgent
}

// create a default instance of axios
const instance = axios.create({
    responseType: "json"
});

//#region generic crud methods
instance.getData = (url, appkey) => {    
    const requestOptions = { headers: {
        'Content-Type': 'application/json',
        'AppKey': appkey
    }};
    
    return new Promise((resolve, reject) => {
        axios.get(url, requestOptions)
            .then(res => {
                resolve(res.data);
            })
            .catch(res => {
                reject(formatReject(res));
            })
    });
}

function formatReject(res) {    
    if(res === null)
        return "error";
        
    // normal operation
    if(res.response) {
        if(Array.isArray(res.response.data)) {
            let m = res.response.data.map((o, idx) => {
                return o.description;
            });
            return m.join("\n");
        }
    
        return res.response.data;
    }
    else if (res.request) {
        return "network error";
    }
    else
        return "error";    
}
//#endregion

module.exports = instance;