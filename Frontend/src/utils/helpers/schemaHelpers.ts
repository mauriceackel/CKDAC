export type Schema =
  | {
      [key: string]: string | Schema;
    }
  | [Schema];

export function removeTypes(schema: any): Schema {
  if (schema.type === 'object') {
    return Object.entries(schema.properties).reduce(
      (obj, [key, value]) => ({
        ...obj,
        [key]: removeTypes(value),
      }),
      {},
    );
  }

  if (schema.type === 'array') {
    return [removeTypes(schema.items)];
  }

  return schema.type;
}

export function flattenSchema(schema: any): any {
  if (schema.allOf !== undefined) {
    const combinedObject = {
      type: 'object',
      properties: schema.allOf.reduce(
        (obj: any, subSchema: any) => ({
          ...obj,
          ...flattenSchema(subSchema).properties,
        }),
        {},
      ),
    };

    return combinedObject;
  }
  return schema;
}
