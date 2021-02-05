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

export async function getRoutingTarget(hostname: string, path: string): Promise<{ bypassAuth: boolean, targetPath: string, targetHost: string } | undefined> {
    logger.info(`Searching for route for incoming request URL: ${hostname + path}`);

    for (const mapping of MAPPINGS) {
        const hostMatch = (!mapping.hostRegex && hostname === mapping.host) || (mapping.hostRegex && new RegExp(mapping.host).test(hostname));

        if (hostMatch) {
            if (path.startsWith(mapping.prefix)) {
                let rewrittenPath = path;
                if (mapping.rewrite) {
                    // Replace first occurance
                    rewrittenPath = rewrittenPath.replace(mapping.prefix, mapping.rewrite);
                }

                const route = mapping.target + rewrittenPath;

                const seperatingIndex = route.indexOf('/', 8);
                const targetHost = route.substr(0, seperatingIndex);
                const targetPath = route.substr(seperatingIndex);

                logger.info(`Found route "${targetHost + targetPath}" for incoming request URL "${hostname + path}"`);
                return { bypassAuth: mapping.bypassAuth || false, targetHost, targetPath };
            }
        }
    }

    logger.info(`No route found for incoming request URL "${hostname + path}"`);
    return undefined;
}
