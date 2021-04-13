import { ApiModel } from 'models/ApiModel';
import { OptionTypeBase } from 'react-select';

export type ApiOption = {
  value: ApiModel;
  label: string;
};

export function optionFilter(
  option: OptionTypeBase,
  searchText: string | undefined,
): boolean {
  const lowerSearch = searchText?.toLowerCase();

  const { value: api } = option;

  return (
    !lowerSearch ||
    api.name.toLowerCase().includes(lowerSearch) ||
    (api.metadata?.company?.toLowerCase().includes(lowerSearch) ?? false) ||
    (api.metadata?.keywords?.toLowerCase().includes(lowerSearch) ?? false)
  );
}

export type OperationOption = {
  value: { operationId: string };
  label: string;
};

export type ResponseOption = {
  value: { responseId: string };
  label: string;
};
