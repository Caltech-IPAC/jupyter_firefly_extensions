import {initFirefly} from 'firefly-api-access';


let cachedLoc;
let cachedFindFireflyResult;
const ffLocURL= makeLabEndpoint('lab/fireflyLocation');
const fetchOptions= {
    method: 'get',
    mode: 'cors',
    credentials: 'include',
    cache: 'default',
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
};

/**
 * Determine where firefly is my calling the lab server extension then load firefly.
 * Results are cache so this function can be call many times.
 * @return {Promise<{firefly: Object, channel: string, fireflyURL: string}>}
 */
export async function findFirefly()  {
    if (cachedFindFireflyResult) return cachedFindFireflyResult;

    try {
        if (!cachedLoc) cachedLoc= await (await fetch(ffLocURL, fetchOptions)).json();

        const {fireflyURL='http://localhost:8080/firefly', fireflyChannel:channel}= cachedLoc;
        if (!window.firefly?.initialized) window.firefly= {...window.firefly, wsch:channel};
        if (!window.getFireflyAPI) window.getFireflyAPI= initFirefly(fireflyURL);
        const firefly= await window.getFireflyAPI();
        cachedFindFireflyResult= {fireflyURL, channel, firefly};
        return cachedFindFireflyResult;
    }
    catch (e) {
        console.group('Firefly Load Failed');
        console.log('findFirefly: Could not determine firefly location or load firefly, call failed');
        console.log(`find firefly url: ${ffLocURL}`);
        if (cachedLoc) console.log(`firefly url: ${cachedLoc.fireflyURL} channel: ${cachedLoc.channel}`);
        console.log(e);
        console.groupEnd('Firefly Load Failed');
    }

}



export function buildURLErrorHtml(e) {
    const details= `<br>Set the firefly URL by setting <code>c.Firefly.url</code> in 
                    <code>jupyter_notebook_config.py</code>
                    <br>or the environment variable <code>FIREFLY_URL</code>`;
    return `<div style='padding: 30px 0 0 30px'>${e.message}${details}</div>`;
}


export function makeLabEndpoint(endPoint, searchParams) {
    const {origin,pathname}= new URL(window.document.location.href);
    const originURL= origin + pathname;
    const start= originURL.substring(0, originURL.lastIndexOf('lab'))
    const slashMaybe= start.endsWith('/') ? '' : '/';
    return `${start}${slashMaybe}${endPoint}${searchParams?'?'+searchParams.toString():''}`
}