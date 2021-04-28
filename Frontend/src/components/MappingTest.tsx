import { MappingPair } from 'models/MappingModel';
import React, {
  Fragment,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react';
import jsonata from 'jsonata';
import { pairs2Trans } from 'services/mappingservice';
import stringified2Jsonata from 'utils/helpers/stringIfiedToJsonata';
import axios from 'axios';
import { getRequestUrl, OpenApiOperation } from 'utils/helpers/swaggerParser';
import { Collapse } from 'react-collapse';
import { Schema } from 'utils/helpers/schemaHelpers';
import JsonEditor from './JsonEditor';
import ChevronRightIcon from './Icons/ChevronRightIcon';

interface MappingTestProps {
  requestMappingPairs: MappingPair[];
  responseMappingPairs: MappingPair[];
  sourceRequestSchema?: Schema;
  targetOperations?: Record<string, OpenApiOperation>;
}
function MappingTest(props: MappingTestProps): ReactElement {
  const {
    requestMappingPairs,
    responseMappingPairs,
    sourceRequestSchema,
    targetOperations,
  } = props;

  const [expanded, setExpanded] = useState<boolean>(false);

  const [requestData, setRequestData] = useState<any>({});
  useEffect(() => setRequestData(sourceRequestSchema ?? {}), [
    sourceRequestSchema,
  ]);
  const [mappedRequestData, setMappedRequestData] = useState<any>({});
  const [rawResponseData, setRawResponseData] = useState<any>({});
  const [responseData, setResponseData] = useState<any>({});

  const [logs, setLogs] = useState<string[]>();
  const [error, setError] = useState<string>();

  // #region Execute request
  const executeRequest = useCallback(async () => {
    setError(undefined);
    setLogs(undefined);

    try {
      const requestMapping = pairs2Trans(requestMappingPairs);
      const requestMappingString = stringified2Jsonata(
        JSON.stringify(requestMapping),
      );

      const targetsRequestData: Record<string, any> = jsonata(
        requestMappingString,
      ).evaluate(requestData);
      setMappedRequestData(targetsRequestData);

      const targetResponseData: Record<string, any> = {};
      const promises = Object.entries(targetsRequestData).map(
        async ([targetOperationId, targetRequestData]) => {
          if (
            targetOperations?.[targetOperationId]?.api.apiObject === undefined
          ) {
            return;
          }

          const urlResponse = getRequestUrl(
            targetOperations[targetOperationId].api.apiObject!,
            targetOperations[targetOperationId].operationId,
            targetRequestData.parameters,
          );

          if (!urlResponse) {
            return;
          }

          const { method, url } = urlResponse;

          setLogs((currentLogs) => [
            ...(currentLogs || []),
            `Querying endpoint at: ${url}`,
          ]);
          targetResponseData[targetOperationId] = await axios
            .request({
              method: method as any,
              url,
              data: targetRequestData.body,
              responseType: 'json',
            })
            .then((r) => r.data);
        },
      );

      await Promise.all(promises);

      setRawResponseData(targetResponseData);
      const responseMapping = pairs2Trans(responseMappingPairs);
      const responseMappingString = stringified2Jsonata(
        JSON.stringify(responseMapping),
      );
      const sourceResponseData = jsonata(responseMappingString).evaluate(
        targetResponseData,
      );

      setResponseData(sourceResponseData);
    } catch (err) {
      const message = `An error occurred during your request: ${err.message}.${
        err.value ? ` Received value: ${JSON.stringify(err.value)}` : ''
      }`;

      setError(message);
      setResponseData({});
    }
  }, [
    requestData,
    requestMappingPairs,
    responseMappingPairs,
    targetOperations,
  ]);
  // #endregion

  return (
    <>
      <button
        type="button"
        className="divider relative mt-4"
        onClick={() => setExpanded((curr) => !curr)}
      >
        Test Request
        <ChevronRightIcon
          className={`absolute w-5 h-5 right-4 transition-all transform ${
            expanded ? '-rotate-90' : 'rotate-90'
          } `}
        />
      </button>

      <Collapse isOpened={expanded}>
        <div className="flex flex-col pt-2">
          <div className="flex">
            <div className="w-1/2 mr-1">
              Raw Request Data
              <JsonEditor value={requestData} onChange={setRequestData} />
            </div>

            <div className="w-1/2 ml-1">
              Mapped Request Data
              <JsonEditor value={mappedRequestData} readonly />
            </div>
          </div>
          <div className="flex">
            <div className="w-1/2 mr-1">
              Raw Response Data
              <JsonEditor value={rawResponseData} readonly />
            </div>

            <div className="w-1/2 ml-1">
              Mapped Response Data
              <JsonEditor value={responseData} readonly />
            </div>
          </div>

          {logs && (
            <div className="text-green-600">
              Logs:
              <br />
              {logs.map((line) => (
                <Fragment key={line}>
                  {line}
                  <br />
                </Fragment>
              ))}
            </div>
          )}
          {error && <div className="text-red-600">{error}</div>}

          <div className="flex justify-end">
            <button
              type="button"
              className="button bg-red-900 text-white"
              onClick={executeRequest}
            >
              Execute
            </button>
          </div>
        </div>
      </Collapse>
    </>
  );
}

export default MappingTest;
