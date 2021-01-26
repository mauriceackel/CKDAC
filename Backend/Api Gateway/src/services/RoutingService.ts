import { logger } from "../Service";

interface Mapping {
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

const mappings: Mapping[] = [
    {
        host: 'one.base-route.de',
        prefix: '/foo',
        target: 'full.target.de/path1',
    },
    {
        host: 'one.base-route.de',
        prefix: '/bar',
        target: 'full.target.de/path2',
    },
    {
        host: 'two.base-route.de',
        prefix: '/x',
        target: 'other.target.de/path3',
    },
    {
        host: '.*\.ckdac\.com',
        hostRegex: true,
        bypassAuth: true,
        prefix: '/api',
        target: 'final.final.de/foobar',
    },
]

export async function getRoutingTarget(hostname: string, path: string): Promise<{ bypassAuth: boolean, route: string } | undefined> {
    logger.info(`Searching for route for incoming request URL: ${hostname + path}`);

    for (const mapping of mappings) {
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
