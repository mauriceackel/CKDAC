import { IAsyncApiMapping, IAttributeEdge, IMapping, IOpenApiMapping, MappingType } from "../models/MappingModel";
import { flatten, unflatten } from 'flat';
import { buildJSONataKey } from "../utils/jsonata-helpers";
import { ApiType } from "../models/ApiModel";
import jsonata from 'jsonata';
const getinputs = require('../utils/get-inputs/get-inputs');

/**
   * Creates a symmetrical, "reversed" mapping for a mapping that is about to be stored in the database.
   *
   * @param mapping The mapping that should be reversed
   */
export function reverseMapping(mapping: Omit<IMapping, "id">): Array<Omit<IMapping, "id">> {
    switch (mapping.apiType) {
        case ApiType.OPEN_API: return buildOpenApiReverseMappings(mapping as Omit<IOpenApiMapping, "id">);
        case ApiType.ASYNC_API: return buildAsyncApiReverseMappings(mapping as Omit<IAsyncApiMapping, "id">);
        default: throw new Error("Unknown mapping type while building reverse mapping");
    }
}

function buildOpenApiReverseMappings(mapping: Omit<IOpenApiMapping, "id">): Array<Omit<IOpenApiMapping, "id">> {
    return mapping.targetIds.map(targetId => ({
        apiType: ApiType.OPEN_API,
        sourceId: targetId,
        targetIds: [mapping.sourceId],
        createdBy: mapping.createdBy,
        type: MappingType.REVERSE,
        requestMapping: revertTransformationObject([targetId, mapping.sourceId], mapping.requestMapping),
        responseMapping: revertTransformationObject([targetId, mapping.sourceId], mapping.responseMapping)
    }));
}

function buildAsyncApiReverseMappings(mapping: Omit<IAsyncApiMapping, "id">): Array<Omit<IAsyncApiMapping, "id">> {
    return mapping.targetIds.map(targetId => ({
        apiType: ApiType.ASYNC_API,
        sourceId: targetId,
        targetIds: [mapping.sourceId],
        createdBy: mapping.createdBy,
        type: MappingType.REVERSE,
        messageMappings: { [mapping.sourceId]: revertTransformationObject([targetId, mapping.sourceId], mapping.messageMappings[targetId]) },
        direction: mapping.direction
    }));
}

/**
   * Creates a reversed mapping for a given JSONata mapping
   *
   * @param prefixes The relevant source and or target IDs, used to filter out mappings
   * @param transformation The JSONata mapping that should be reverted
   */
function revertTransformationObject(prefixes: string[], transformation: string): string {
    //Flatten out the parsed JSONata transformation
    const transformationObject: { [key: string]: string } = flatten(JSON.parse(transformation));

    //Loop over each entry in the JSONata mapping
    const reversedMapping = Object.entries(transformationObject).reduce((reversed, [key, value]) => {
        // Don't allow transformations that use more than one attribute as input
        const keys = getinputs(value).getInputs({}) as string[];
        if(keys.length !== 1) return reversed;

        // If the used key is not in the relevant keys (i.e prefixes), skip
        const relevant = prefixes.some(p => keys[0].startsWith(p)) && prefixes.some(p => key.startsWith(p));
        if (!relevant) return reversed;
        
        const [simple] = isSimple(jsonata(value).ast());
        if (!simple) return reversed;

        const reverted = revertSingleTransformation(buildJSONataKey(key.split('.')), value);
        // TODO: Test if this works or has to be escaped somehow
        return {
            ...reversed,
            [keys[0]]: reverted,
        }

    }, {});

    return JSON.stringify(unflatten(reversedMapping));
}

// All allowed operands in a simple mapping including their reverse operation
const REVERSE = {
    '+': '-',
    '-': '+',
    '*': '/',
    '/': '*',
}

// Checks if the mapping transformation is simple,
// meaning that it may only be a number or a path
// or any combination of the two using the allowed operators
// Returns [isSimple, hasPathReference]
export function isSimple(ast: any): [boolean, boolean] {
    switch (ast.type) {
        case 'number': return [true, false];
        case 'path': return [true, true];
        case 'block': {
            if (ast.expressions.length > 1) {
                return [false, false];
            }
            return isSimple(ast.expressions[0]);
        };
        case 'unary': {
            if (ast.value === '-') {
                return isSimple(ast.expression);
            }
            return [false, false];
        };
        case 'binary': {
            if (!Object.keys(REVERSE).includes(ast.value)) {
                return [false, false];
            }
            const [simpleLeft, pathLeft] = isSimple(ast.lhs);
            const [simpleRight, pathRight] = isSimple(ast.rhs);
            return [simpleLeft && simpleRight && !(pathLeft && pathRight), pathLeft || pathRight];
        };
        default: return [false, false];
    }
}

export function revertEdge(edge: IAttributeEdge): IAttributeEdge {
    return {
        source: edge.target,
        target: edge.source,
        transformation: revertSingleTransformation(buildJSONataKey(edge.target.split('.')), edge.transformation)
    };
}

// Reverts a transformation including basic arithmetics
// AttributeId is the id of the providing attribute
// i.e. <attributeId> = some.path + 10 -> some.path = attributeId - 10
function revertSingleTransformation(attributeId: string, transformation: string): string {
    let ast: { [key: string]: any, value: keyof typeof REVERSE } | undefined = jsonata(transformation).ast();
    let newAst: any = { type: 'path', steps: attributeId.split('.') };

    while (ast !== undefined) {
      switch (ast.type) {
        case 'binary': {
          const leftHasPath = isSimple(ast.lhs)[1];
          if (leftHasPath) {
            newAst = { type: 'binary', value: REVERSE[ast.value], lhs: newAst, rhs: ast.rhs };
            ast = ast.lhs;
          } else {
            newAst = { type: 'binary', value: REVERSE[ast.value], lhs: newAst, rhs: ast.lhs };
            ast = ast.rhs;
          }
        }; break;
        case 'unary': {
          newAst = { type: 'unary', value: REVERSE[ast.value], expression: newAst };
          ast = ast.expression;
        }; break;
        case 'block': {
          ast = ast.expressions[0];
        }; break;
        case 'path': {
          ast = undefined;
        }
      }
    }

    return stringifyAst(newAst);
}

function stringifyAst(ast: any): string {
    switch (ast.type) {
        case 'binary': return `(${stringifyAst(ast.lhs)} ${ast.value} ${stringifyAst(ast.rhs)})`;
        case 'unary': {
            if (ast.value === '+') {
                return stringifyAst(ast.expression);
            }
            return `${ast.value}(${stringifyAst(ast.expression)})`
        };
        case 'path': return `${ast.steps.join('.')}`;
        case 'number': return ast.value;
        case 'block': return `(${stringifyAst(ast.expressions[0])})`;
        default: return '';
    }
}