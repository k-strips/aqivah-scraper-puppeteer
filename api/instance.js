const axios = require('axios');


// axios.defaults.baseURL = process.env.API_ENDPOINT || 'http://localhost:5000';
axios.defaults.baseURL = 'http://3.135.45.57:5000' || 'http://localhost:5000';

const api = (method, url, variables) =>
  new Promise((resolve, reject) => {
    axios({
      url, method,
      headers: { "Content-Type": "application/json" },
      params: method === "get" ? variables : undefined,
      data: method !== "get" ? variables : undefined,
    })
      .then(response => resolve(response))
      .catch(e => { reject(e); });
  });


module.exports = {
  get: (...args) => api("get", ...args),
  post: (...args) => api("post", ...args),
  put: (...args) => api("put", ...args),
  patch: (...args) => api("patch", ...args),
  delete: (...args) => api("delete", ...args),
};