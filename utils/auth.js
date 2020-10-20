/**
 * @file
 *
 * Wrapper around fetch(), and OAuth access token handling operations.
 *
 * To use import getAuthClient, and initialize a client:
 * const auth = getAuthClient(optionalConfig);
 */

// Use new version of AsyncStorage: https://react-native-community.github.io/async-storage/docs/api.
import AsyncStorage from '@react-native-community/async-storage'

const refreshPromises = [];

/**
 * OAuth client factory.
 *
 * @param {object} config
 *
 * @returns {object}
 *   Returns an object of functions with $config injected.
 */
export function getAuthClient(config = {}) {
  const defaultConfig = {
    // Base URL of your Drupal site.
    // @Note: https://localhost:32837 does not work. It gives network error, so try http one.
    base: 'http://10.0.2.2:32807',
    // Name to use when storing the token in localStorage.
    token_name: 'drupal-oauth-token',
    // OAuth client ID - get from Drupal. (https://localhost:32825/admin/config/services/consumer)
    client_id: 'a089d4be-e089-4aa8-8b4c-b2c2b6a7a3e4',
    // OAuth client secret - set in Drupal.
    client_secret: 'reactnative',
    // Drupal user role related to this OAuth client.
    scope: 'oauth',
    // Margin of time before the current token expires that we should force a
    // token refresh.
    expire_margin: 0,
  };

  config = { ...defaultConfig, ...config }

  /**
   * Exchange a username & password for an OAuth token.
   * This function gets used as part of a submit handler for a login form.
   * @param {string} username 
   * @param {string} password 
   */
  async function login(username, password) {
    let formData = new FormData();
    formData.append('grant_type', 'password');
    formData.append('client_id', config.client_id);
    formData.append('client_secret', config.client_secret);
    formData.append('scope', config.scope);
    formData.append('username', username);
    formData.append('password', password);
    try {
      // console.log(formData)
      const response = await fetch(`${config.base}/oauth/token`, {
        method: 'post',
        headers: new Headers({
          'Accept': 'application/json',
        }),
        body: formData,
      });
      const data = await response.json();
      console.log(data)
      if (data.error) {
        console.log('Error retrieving token', data);
        return false;
      }
      return saveToken(data);
    }
    catch (err) {
      return console.log('API got an error', err);
    }
  };


  /**
   * Delete the stored OAuth token, effectively ending the user's session.
   */
  async function logout() {
    try {
      await AsyncStorage.removeItem(config.token_name);
      return Promise.resolve(true);
    } catch (e) {
      console.log(e)
    }
  };


  /**
  * Wrapper for fetch() that will attempt to add a Bearer token if present.
  *
  * If there's a valid token, or one can be obtained via a refresh token, then
  * add it to the request headers. If not, issue the request without adding an
  * Authorization header.
  *
  * @param {string} url URL to fetch.
  * @param {object} options Options for fetch().
  */
  async function fetchWithAuthentication(url, options) {
    if (!options.headers.get('Authorization')) {
      const oauth_token = await token();
      if (oauth_token) {
        console.log('using token', oauth_token);
        options.headers.append('Authorization', `Bearer ${oauth_token.access_token}`);
      }
      return fetch(`${config.base}${url}`, options);
    }
  }


  /**
   * Get the current OAuth token if there is one.
   *
   * Get the OAuth token form localStorage, and refresh it if necessary using
   * the included refresh_token.
   *
   * @returns {Promise}
   *   Returns a Promise that resolves to the current token, or false.
   */
  async function token() {
    try {
      const jsonValue = await AsyncStorage.getItem(config.token_name);
      console.log(jsonValue)
      const token = jsonValue != null ? JSON.parse(jsonValue) : false

      if (!token) {
        return false;
      }

      const { expires_at, refresh_token } = token;

      if (expires_at - config.expire_margin < Date.now() / 1000) {
        return refreshToken(refresh_token);
      }

      return Promise.resolve(token);
    } catch (e) {
      console.log(e)
    }
  };

  /**
   * Request a new token using a refresh_token.
   *
   * This function is smart about reusing requests for a refresh token. So it is
   * safe to call it multiple times in succession without having to worry about
   * whether a previous request is still processing.
   */
  function refreshToken(refresh_token) {
    console.log("getting refresh token");
    if (refreshPromises[refresh_token]) {
      return refreshPromises[refresh_token];
    }

    // Note that the data in the request is different when getting a new token
    // via a refresh_token. grant_type = refresh_token, and do NOT include the
    // scope parameter in the request as it'll cause issues if you do.
    let formData = new FormData();
    formData.append('grant_type', 'refresh_token');
    formData.append('client_id', config.client_id);
    formData.append('client_secret', config.client_secret);
    formData.append('refresh_token', refresh_token);

    return (refreshPromises[refresh_token] = fetch(`${config.base}/oauth/token`, {
      method: 'post',
      headers: new Headers({
        'Accept': 'application/json',
      }),
      body: formData,
    })
      .then(function (response) {
        return response.json();
      })
      .then((data) => {
        delete refreshPromises[refresh_token];

        if (data.error) {
          console.log('Error refreshing token', data);
          return false;
        }
        return saveToken(data);
      })
      .catch(err => {
        delete refreshPromises[refresh_token];
        console.log('API got an error', err)
        return Promise.reject(err);
      })
    );
  }

  /**
  * Store an OAuth token retrieved from Drupal in localStorage.
  *
  * @param {object} data 
  * @returns {object}
  *   Returns the token with an additional expires_at property added.
  */
  async function saveToken(data) {
    let token = Object.assign({}, data); // Make a copy of data object.
    token.date = Math.floor(Date.now() / 1000);
    token.expires_at = token.date + token.expires_in;
    try {
      await AsyncStorage.setItem(config.token_name, JSON.stringify(token));
    } catch (e) {
      console.log(e)
    }
    return token;
  }

  /**
   * Check if the current user is logged in or not.
   *
   * @returns {Promise}
   */
  async function isLoggedIn() {
    const oauth_token = await token();
    if (oauth_token) {
      return Promise.resolve(true);
    }
    return Promise.reject(false);;
  };

  /**
   * Run a query to /oauth/debug and output the results to the console.
   */
  function debug() {
    const headers = new Headers({
      Accept: 'application/vnd.api+json',
    });

    fetchWithAuthentication('/oauth/debug?_format=json', { headers })
      .then((response) => response.json())
      .then((data) => {
        console.log('debug', data);
      });
  }

  return { debug, login, logout, isLoggedIn, fetchWithAuthentication, token, refreshToken };
}