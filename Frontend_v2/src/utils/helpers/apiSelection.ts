import { ApiModel } from 'models/ApiModel';

export type ApiOption = {
  value: ApiModel;
  label: string;
};

export function optionFilter(
  option: any,
  searchText: string | undefined,
): boolean {
  const lowerSearch = searchText?.toLowerCase();

  const { value: api } = option as { value: ApiModel };

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

export type CodeOption = {
  value: { code: string };
  label: string;
};
