const camelizeSlashPattern = /\/(.?)/g;
const camelizeUppercasePattern = /(\.?)(\w)([^\.]*)$/g;
const camelizeUnderscorePattern =/_(.)/g;
const camelizeHyphenPattern = /-(.)/g;

export function camelcase(input: string) {

    input = input.replace(camelizeSlashPattern, ".$1");
    
    const parts = input.split(".");
    input = parts.map(p => p.charAt(0).toUpperCase() + p.substr(1)).join('');
    
    input = input.replace(camelizeSlashPattern, (full, $1: string) => $1.charAt(0).toUpperCase() + $1.substr(1));
    
    input = input.replace(camelizeUppercasePattern, (full, $1: string, $2: string, $3: string) => {
        let result = $1 + $2.toUpperCase() + $3
        result = result.replace(/\\$/g, `\\\\\\$`);
        return result;
    })
   
    input = input.replace(camelizeUnderscorePattern, (full, $1: string) => {
        return $1.toUpperCase();
    });

    input = input.replace(camelizeHyphenPattern, (full, $1: string) => {
        return $1.toUpperCase();
    });

    input = input.replace(/[A-Za-z]/, m => m.toLowerCase())

    input = input.replace(/_/g, "");
    return input;
}
