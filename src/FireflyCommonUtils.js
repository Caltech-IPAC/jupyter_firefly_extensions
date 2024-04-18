import {initFirefly} from 'firefly-api-access';
import { ServerConnection } from '@jupyterlab/services';


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
        // request the config from server at /lab/fireflyLocation (see handlers.py)
        const settings = ServerConnection.makeSettings();
        if (!cachedLoc) cachedLoc= await (await ServerConnection.makeRequest(ffLocURL, fetchOptions, settings)).json();

        // make sure that response of above request contains non-empty fireflyURL
        const {fireflyURL, fireflyChannel:channel}= cachedLoc;
        if (!fireflyURL) throw new Error(`fireflyURL couldn't be retrieved from ${ffLocURL}`);

        // load firefly API from fireflyURL at /lab (window)
        // (CORS errors might happen here if headers aren't set up correctly, maybe due to caching)
        if (!window.firefly?.initialized) window.firefly= {...window.firefly, wsch:channel};
        if (!window.getFireflyAPI) window.getFireflyAPI= initFirefly(fireflyURL);
        const firefly= await window.getFireflyAPI();

        // resolve Promise
        cachedFindFireflyResult= {fireflyURL, channel, firefly};
        console.log('Firefly loaded successfully\n', cachedFindFireflyResult);
        return cachedFindFireflyResult;
    }
    catch (e) {
        // log information about error(s) before rejecting Promise
        console.group('Firefly Load Failed');
        console.log('findFirefly: Could not determine firefly location or load firefly, call failed');
        if (cachedLoc) console.log(`firefly url: ${cachedLoc.fireflyURL} channel: ${cachedLoc.fireflyChannel}`);
        console.log(e);
        console.groupEnd('Firefly Load Failed');
        throw e;  // to let promise reject
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