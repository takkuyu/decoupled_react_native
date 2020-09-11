import React from "react";
import { getAuthClient } from "../utils/auth";
import {
  Button,
} from 'react-native';
const auth = getAuthClient();

const NodeDelete = ({ id, title, onSuccess }) => {
  function doConfirm() {
    return window.confirm(`Are you sure you want to delete ${title}?`);
  }

  function doDelete() {
    // const csrfUrl = `/session/token?_format=json`;
    const fetchUrl = `/jsonapi/node/article/${id}`;
    const fetchOptions = {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: new Headers({
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Cache': 'no-cache'
      }),
    };

    try {
      auth.fetchWithAuthentication(fetchUrl, fetchOptions)
        .then((response) => {
          // Should be 204. If so, call the onSuccess callback.
          if (response.status === 204) {
            if (typeof onSuccess === 'function') {
              onSuccess(id);
            }
          }
        });
    } catch (error) {
      console.log('API error', error);
    }
  }

  return (
    <Button onPress={event => doConfirm() && doDelete()} title="delete" />
  );
};

export default NodeDelete;