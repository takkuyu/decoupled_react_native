import React, { useState } from "react";
import { getAuthClient } from "../utils/auth";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  TouchableOpacity,
} from 'react-native';

const auth = getAuthClient();

const NodeForm = ({ id, title, body, onSuccess }) => {
  const [isSubmitting, setSubmitting] = useState(false);

  const [result, setResult] = useState({
    success: null,
    error: null,
    message: '',
  });

  const defaultValues = {
    title: title ? title : '',
    body: body ? body : '',
  };
  const [values, setValues] = useState(defaultValues);

  // const handleInputChange = (event) => {
  //     const { name, value } = event.target;
  //     setValues({ ...values, [name]: value });
  // };

  const handleSubmit = (event) => {
    setSubmitting(true);
    event.preventDefault();

    // const csrfUrl = `/session/token?_format=json`;
    const fetchUrl = id ? `/jsonapi/node/article/${id}` : `/jsonapi/node/article`;

    let data = {
      "data": {
        "type": "node--article",
        "attributes": {
          "title": `${values.title}`,
          "body": {
            "value": `${values.body}`,
            "format": 'plain_text',
          }
        }
      }
    };

    // If we have an ID that means we're editing an existing node and not
    // creating a new one.
    if (id) {
      // Set the ID in the data we'll send to the API.
      data.data.id = id;
    }

    const fetchOptions = {
      // Use HTTP PATCH for edits, and HTTP POST to create new articles.
      method: id ? 'PATCH' : 'POST',
      credentials: 'same-origin',
      headers: new Headers({
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Cache': 'no-cache'
      }),
      body: JSON.stringify(data),
    };

    try {
      auth.fetchWithAuthentication(fetchUrl, fetchOptions)
        .then((response) => response.json())
        .then((data) => {
          // We're done processing.
          setSubmitting(false);

          // If there are any errors display the error and return early.
          if (data.errors && data.errors.length > 0) {
            setResult({
              success: false,
              error: true,
              message: <Text className="messages messages--error">{data.errors[0].title}: {data.errors[0].detail}</Text>,
            });
            return false;
          }

          // If the request was successful, remove existing form values and
          // display a success message.
          setValues(defaultValues);
          if (data.data.id) {
            setResult({
              success: true,
              message: <Text className="messages messages--status">{(id ? 'Updated' : 'Added')}: {data.data.attributes.title}</Text>,
            });

            if (typeof onSuccess === 'function') {
              onSuccess(data.data);
            }
          }
        });
    } catch (error) {
      console.log('Error while contacting API', error);
      setSubmitting(false);
    }
  };

  // If the form is currently being processed display a spinner.
  if (isSubmitting) {
    return (
      <View>
        <Text>Processing ...</Text>
      </View>
    )
  }

  return (
    <View>
      {(result.success || result.error) &&
        <View>
          <Text>{(result.success ? 'Success!' : 'Error')}:</Text>
          <Text>{result.message}</Text>
        </View>
      }
      <View>
        <TextInput
          value={values.title}
          style={styles.Input}
          placeholder="Title"
          onChangeText={(value) => setValues({ ...values, ['title']: value })}
        />
        <TextInput
          multiline={true}
          numberOfLines={4}
          style={styles.Input}
          value={values.body}
          placeholder="Body"
          onChangeText={(value) => setValues({ ...values, ['body']: value })}
        />
        <TouchableOpacity
          // style={styles.saveButton}
          onPress={handleSubmit}
        >
          <Text style={styles.Button}>{id ? 'Edit existing node' : 'Add new node'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
};

const styles = StyleSheet.create({
  Input:{
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: "solid",
  },
  Button:{
    width: 150,
    backgroundColor: 'green',
    color: '#fff',
    marginVertical: 5,
    padding: 5,
  },
})

export default NodeForm;