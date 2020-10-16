import { logger } from '../Service';
import { InvalidApiKeyError } from '../utils/errors/InvalidApiKeyError';
import { ApiKey } from '../models/ApiKeyModel';

/**
 * Checkes the validity of the provided api key.
 * 
 * @param apiKey The API key to validate.
 * @returns The name assigned to this api key.
 * @throws InvalidApiKeyError if the api key does not exist.
 */
export async function validateApiKey(apiKey: string) {
    logger.info(`Trying to validate API key: ${apiKey}`);

    let apiKeyModel = await ApiKey.findOne({ key: apiKey });
    if (apiKeyModel && apiKeyModel.isValid()) {
        logger.info(`API key valid. Name: ${apiKeyModel.name}`);
        return apiKeyModel.name;
    } else {
        logger.error(`Invalid authentication request. The API key does not exist.`);
        throw new InvalidApiKeyError("invalid_token", "The API key does not exist.")
    }
}