import React from "react";
import { getAuthClient } from "../utils/auth";
import {
  Button,
  Alert
} from 'react-native';
const auth = getAuthClient();

const NodeDelete = ({ id, title, onSuccess }) => {
  // @todo: Figure out how to do confirm on react-native.
  function doConfirm() {
    return Alert.alert(
      `Are you sure you want to delete ${title}?`,
      null,
      [
        { text: 'NO', onPress: () => console.warn('NO Pressed'), style: 'cancel' },
        { text: 'YES', onPress: () => {return true} },
      ]
    );
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
    <Button onPress={event => doDelete()} title="delete" />
  );
};

export default NodeDelete;