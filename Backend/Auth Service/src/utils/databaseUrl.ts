import dns from 'dns';
import { URL } from 'url';
import { DB_URL } from '../config/Config';

export async function getDatabaseUrl(): Promise<string> {
    const url = new URL(DB_URL);
    const portName = url.searchParams.get('portName');
    const protocol = url.protocol;
    url.searchParams.delete('portName');

    if(!protocol.includes('+srv') || portName === null) {
        return url.toString();
    }

    const host = url.hostname;
    const port = url.port;
    const addresses = await dnsLookup(`_${portName}._tcp.${host}`);

    const portString = port ? `:${port}`: '';
    const mongoHost = addresses.map(address => `${address}${portString}`).join(',')
    return `mongodb://${mongoHost}${url.pathname}${url.search}`;
}

async function dnsLookup(fqdn: string) {
    return new Promise<string[]>((resolve, reject) => {
        dns.lookup(fqdn, { all: true }, (err, addresses) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(addresses.map(a => a.address));
        })
    });
}