const jsonata = require('jsonata');

const sourceTopic = '{{ params.sourceTopic }}';
const sourceId = '{{ params.sourceId }}';

const targets = [
  {%- for target in params.targets %}
  {
    mapping: '{{ target.mapping|safe }}',
    topic: '{{ target.topic }}',
    id: '{{ target.fullId }}',
    appRef: require('../../../../targets/{{ target.id }}/src/api/index')
  },
  {%- endfor %}
];

{% if params.mappingDirection === '0' -%}
module.exports = (app) => {
  for (const target of targets) {
    const topicWithParams = target.topic.replace(/\{([^\{\}]+)\}/g, (match, paramName) => `:${paramName}`);
    target.appRef.use(topicWithParams, (message) => {
      const { payload, headers, params } = message;
      const { payload: mappedPayload, headers: mappedHeaders, parameters: mappedParameters } = jsonata(target.mapping).evaluate({ [target.id]: { payload, headers, parameters: params } })[sourceId];

      const paramRegex = new RegExp(`\\{(${Object.keys(mappedParameters).join('|')})\\}`, 'g');
      const resolvedTopic = sourceTopic.replace(paramRegex, (match, paramName) => mappedParameters[paramName]);

      console.log('Rerouting incoming message', message, 'from target', target.id, 'to topic', resolvedTopic, 'with payload', mappedPayload, 'and headers', mappedHeaders);
      app.injectMessage(mappedPayload, mappedHeaders, resolvedTopic);
    });
  }
};
{%- elif params.mappingDirection === '1' -%}
module.exports = (message, next) => {
  const { payload, headers, topic, params } = message;
  if (topic === sourceTopic) {
    for (const target of targets) {
      const { payload: mappedPayload, headers: mappedHeaders, parameters: mappedParameters } = jsonata(target.mapping).evaluate({ [sourceId]: { payload, headers, parameters: params } })[target.id];

      const paramRegex = new RegExp(`\\{(${Object.keys(mappedParameters).join('|')})\\}`, 'g');
      const resolvedTopic = target.topic.replace(paramRegex, (match, paramName) => mappedParameters[paramName]);

      console.log('Rerouting outgoing message', message, 'to target', target.id, 'with topic', resolvedTopic, 'with payload', mappedPayload, 'and headers', mappedHeaders);
      target.appRef.send(mappedPayload, mappedHeaders, resolvedTopic);
    }

    return;
  }

  next();
};
{%- endif %}
