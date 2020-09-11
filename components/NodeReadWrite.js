import React, { useEffect, useState } from "react";
import NodeAdd from "./NodeAdd";
import NodeEdit from "./NodeEdit";
import NodeDelete from "./NodeDelete";
import { getAuthClient } from "../utils/auth";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Linking
} from 'react-native';

const auth = getAuthClient();

/**
 * Helper function to validate data retrieved from JSON:API.
 */
function isValidData(data) {
  if (data === null) {
    return false;
  }
  if (data.data === undefined ||
    data.data === null ||
    data.data.length === 0) {
    return false;
  }
  return true;
}

/**
 * Component for displaying an inViewidual article, with optional admin features.
 */
const NodeItem = ({ id, drupal_internal__nid, title, body, contentList, updateContent }) => {
  const [showAdminOptions, setShowAdminOptions] = useState(false);

  function handleClick(event) {
    event.preventDefault();
    setShowAdminOptions(!showAdminOptions)
  }

  function onEditSuccess(data) {
    // Replace the edited item in the list with updated values.
    const idx = contentList.findIndex(item => item.id === data.id);
    console.log('index', { idx, data, content: contentList });
    contentList[idx] = data;
    updateContent([...contentList]);
  }

  function onDeleteSuccess(id) {
    // Remove the deleted item from the list.
    const list = contentList.filter(item => item.id !== id);
    updateContent([...list]);
  }

  // Show the item with admin options.
  if (showAdminOptions) {
    return (
      <View>
        <Text>Admin options for {title}</Text>
        <NodeEdit
          id={id}
          title={title}
          body={body.value}
          onSuccess={onEditSuccess}
        />
        <Button onPress={handleClick} title="cancel" />
        <NodeDelete
          id={id}
          title={title}
          onSuccess={onDeleteSuccess}
        />
      </View>
    );
  }

  // Show just the item.
  return (
    <View>
      <Text style={{ color: 'blue' }}
        onPress={() => Linking.openURL(`/node/${drupal_internal__nid}`)}>
        {title}
        {" -- "}
      </Text>
      <Button onPress={handleClick} title="edit" />
    </View>
  );
};

/**
 * Component to render when there are no articles to display.
 */
const NoData = () => (
  <Text>No articles found.</Text>
);

/**
 * Display a list of Drupal article nodes.
 *
 * Retrieves articles from Drupal's JSON:API and then displays them along with
 * admin features to create, update, and delete articles.
 */
const NodeReadWrite = () => {
  const [content, updateContent] = useState([]);
  const [filter, setFilter] = useState(null);
  const [showNodeAdd, setShowNodeAdd] = useState(false);

  useEffect(() => {
    // This should point to your local Drupal instance. Alternatively, for React
    // applications embedded in a Drupal theme or module this could also be set
    // to a relative path.
    const API_ROOT = '/jsonapi/';
    const url = `${API_ROOT}node/article?fields[node--article]=id,drupal_internal__nid,title,body&sort=-created&page[limit]=10`;

    const headers = new Headers({
      Accept: 'application/vnd.api+json',
    });

    auth.fetchWithAuthentication(url, { headers })
      .then((response) => response.json())
      .then((data) => {
        if (isValidData(data)) {
          // Initialize the list of content with data retrieved from Drupal.
          updateContent(data.data);
        }
      })
      .catch(err => console.log('There was an error accessing the API', err));
  }, []);

  // Handle updates to state when a node is added.
  function onNodeAddSuccess(data) {
    // Add the new item to the top of the list.
    content.unshift(data);
    // Note the use of [...content] here, this is because we're
    // computing new state based on previous state and need to use a
    // functional update. https://reactjs.org/docs/hooks-reference.html#functional-updates
    // [...content] syntax creates a new array with the values of
    // content, and updates the state to that new array.
    updateContent([...content]);
  }

  return (
    <View>
      <Text>Site content</Text>
      {content.length ? (
        <>
          <Text htmlFor="filter">Type to filter:</Text>
          <TextInput
            type="text"
            name="filter"
            placeholder="Start typing ..."
            onChange={(event => setFilter(event.target.value.toLowerCase()))}
          />
          {
            // If there's a `filter` apply it to the list of nodes.
            content.filter((item) => {
              if (!filter) {
                return item;
              }

              if (filter && (item.attributes.title.toLowerCase().includes(filter) || item.attributes.body.value.toLowerCase().includes(filter))) {
                return item;
              }
            }).map((item) => (
              <NodeItem
                key={item.id}
                id={item.id}
                updateContent={updateContent}
                contentList={content}
                {...item.attributes}
              />
            ))
          }
        </>
      ) : (
          <NoData />
        )}
      {showNodeAdd ? (
        <>
          <Text>Add a new article</Text>
          <NodeAdd
            onSuccess={onNodeAddSuccess}
          />
        </>
      ) : (
          <Text>
            Don't see what you're looking for?
            <Button onPress={() => setShowNodeAdd(true)} title="Add a node" />
          </Text>
        )}
    </View>
  );
};

export default NodeReadWrite;