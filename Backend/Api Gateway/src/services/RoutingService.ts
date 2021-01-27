import { config } from "winston";
import { MAPPINGS } from "../config/Config";
import { logger } from "../Service";

export interface Mapping {
    host: string,
    hostRegex?: boolean,
    prefix: string,
    rewrite?: string,
    target: string,
    bypassAuth?: boolean, //TODO: Handle this (i.e. retrieve url with bypass info as first step, then perform auth conditionally, then perform redirect)
    cors?: {
        headers: string
        origins: string
        methods: string
        credentials: boolean
    },
}

export async function getRoutingTarget(hostname: string, path: string): Promise<{ bypassAuth: boolean, route: string } | undefined> {
    logger.info(`Searching for route for incoming request URL: ${hostname + path}`);

    for (const mapping of MAPPINGS) {
        const hostMatch = (!mapping.hostRegex && hostname === mapping.host) || (mapping.hostRegex && new RegExp(mapping.host).test(hostname));

        if (hostMatch) {
            if (path.startsWith(mapping.prefix)) {
                let targetPath = path;
                if (mapping.rewrite) {
                    // Replace first occurance
                    targetPath = targetPath.replace(mapping.prefix, mapping.rewrite);
                }

                const route = mapping.target + targetPath
                logger.info(`Found route "${route}" for incoming request URL "${hostname + path}"`);
                return { bypassAuth: mapping.bypassAuth || false, route };
            }
        }
    }

    logger.info(`No route found for incoming request URL "${hostname + path}"`);
    return undefined;
}
