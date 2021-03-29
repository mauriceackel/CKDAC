/* eslint-disable @typescript-eslint/no-use-before-define */
import React, {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import Select from 'react-select';
import { ApiType } from 'models/ApiModel';
import { getApi, getApis, upsertApi } from 'services/apiservice';
import { useParams } from 'react-router';
import ValidatedInput from 'components/ValidatedInput';
import { AuthContext } from 'services/auth/authcontext';
import JsonEditor from 'components/JsonEditor';
import { ApiOption, optionFilter } from 'utils/helpers/apiSelection';

// #region Form Validation
const ApiSchema = yup.object({
  name: yup.string().required('Name is required'),
  metadata: yup.object({
    company: yup.string(),
    keywords: yup.string(),
  }),
  apiSpec: yup.mixed().required(),
});
type ApiData = yup.InferType<typeof ApiSchema>;
// #endregion

function InterfaceEditor(): ReactElement {
  const { user } = useContext(AuthContext).authState;

  const { mode } = useParams<{ mode: string }>();
  const apiType = useMemo(() => {
    switch (mode) {
      case 'openapi':
        return ApiType.OPEN_API;
      case 'asyncapi':
        return ApiType.ASYNC_API;
      default:
        return undefined;
    }
  }, [mode]);

  const {
    control,
    register,
    handleSubmit,
    errors,
    reset: resetForm,
    setError,
  } = useForm({
    resolver: yupResolver(ApiSchema),
  });

  // #region Load Apis
  const [apiOptions, setApiOptions] = useState<ApiOption[]>();

  const loadApis = useCallback(
    async (type: ApiType) => {
      if (!user) {
        return;
      }

      try {
        const loadedApis = await getApis(type, true, user.id);

        setApiOptions(
          loadedApis.map((api) => ({
            value: api,
            label: api.name,
          })),
        );
      } catch (err) {
        console.log('Error loading apis', err);
      }
    },
    [user],
  );

  useEffect(() => {
    if (apiType !== undefined) {
      loadApis(apiType);
    }
  }, [apiType, loadApis]);
  // #endregion

  // #region Api Selection
  const [selectedApiOption, setSelectedApiOption] = useState<ApiOption>();
  const selectedApi = useMemo(() => {
    return selectedApiOption?.value;
  }, [selectedApiOption]);
  // #endregion

  // #region Fully load selected Api
  useEffect(() => {
    async function loadFullApiData() {
      if (!selectedApi) {
        resetForm({});
        return;
      }

      try {
        const apiData = await getApi(selectedApi.id, false);

        resetForm({
          name: apiData.name,
          metadata: apiData.metadata,
          apiSpec: JSON.parse(apiData.apiSpec),
        });
      } catch (err) {
        console.log(err);
      }
    }

    loadFullApiData();
  }, [selectedApi, resetForm]);
  // #endregion

  // #region Upsert Api
  async function handleUpsert(apiData: ApiData) {
    if (apiType === undefined) {
      return;
    }

    try {
      await upsertApi({
        ...apiData,
        apiSpec: JSON.stringify(apiData.apiSpec),
        id: selectedApi?.id,
        createdBy: user?.id,
        type: selectedApi?.type ?? apiType,
      });

      loadApis(apiType);
      setSelectedApiOption(undefined);
      resetForm({});

      setError('success', {
        type: 'manual',
        message: 'API was updated successfully.',
      });
    } catch (err) {
      console.log(err);
    }
  }
  // #endregion

  return (
    <div className="content-page flex flex-col items-center">
      <form
        noValidate
        onSubmit={handleSubmit(handleUpsert)}
        className="mt-4 flex flex-col shadow-lg p-8 rounded"
      >
        <p className="font-bold text-sm">APIs</p>
        <Select
          className="w-full"
          defaultValue={selectedApiOption}
          isSearchable
          isClearable
          onChange={(value) => setSelectedApiOption(value ?? undefined)}
          options={apiOptions}
          filterOption={optionFilter}
        />

        <p className="mt-4 font-bold text-sm">Name</p>
        <ValidatedInput name="name" register={register} errors={errors}>
          <input type="test" className="input" />
        </ValidatedInput>

        <p className="mt-2 font-bold text-sm">Metadata</p>
        <div className="flex">
          <div className="mr-1">
            <p className="font-bold text-sm">Company</p>
            <ValidatedInput
              name="metadata.company"
              register={register}
              errors={errors}
            >
              <input type="test" className="input" />
            </ValidatedInput>
          </div>
          <div className="ml-1">
            <p className="font-bold text-sm">Keywords</p>
            <ValidatedInput
              name="metadata.keywords"
              register={register}
              errors={errors}
            >
              <input type="test" className="input" />
            </ValidatedInput>
          </div>
        </div>

        <p className="mt-2 font-bold text-sm">Api Specification</p>
        <div className="max-w-md">
          <Controller
            name="apiSpec"
            control={control}
            defaultValue={{}}
            render={({ onChange, value }) => (
              <JsonEditor value={value} onChange={onChange} />
            )}
          />
          {errors.apiSpec && (
            <p className="h-6 text-sm text-red-600">{errors.apiSpec.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="mt-4 button shadow-lg bg-red-900 text-white"
        >
          Save
        </button>
        {errors.success && (
          <p className="text-sm text-green-600">{errors.success.message}</p>
        )}
      </form>
    </div>
  );
}

export default InterfaceEditor;
