// path to the WebAPI facilitating the calls.
let url = 'https://localhost:7182';

class APIMethods {
  async execFetch(method, action, headers, data) {
    let message = {};

    // set the action > POST, GET, etc
    message.method = action;

    // assign the message headers
    if (headers) {
      message.headers = headers;
    }
    else {
      message.headers = {};
    }

    // set the message body for the call
    if (data) {
      message.body = JSON.stringify(data);
    }

    const response = await fetch(url + method, message);

    if (response.ok) {
      return (response.status != 204 ? response.json().catch(() => null) : null);
    } else {
      let error = await response.json();
      return Promise.reject({
        status: response.status,
        statusText: response.statusText,
        errorMessage: error.message
      });
    }
  }
  
  defaultHeaders = { 'Content-Type': 'application/json; charset=utf-8' };
}

let API = new APIMethods();
export default API;
