import {initFirefly} from 'firefly-api-access';
import { PageConfig} from '@jupyterlab/coreutils';



export function addFirefly()  {
    const fireflyURL= PageConfig.getOption('fireflyURL') || 'http://localhost:8080/firefly';
    const channel= PageConfig.getOption('fireflyChannel');
    window.firefly= Object.assign({}, window.firefly, {channel});
    if (!window.getFireflyAPI) {
        window.getFireflyAPI= initFirefly(fireflyURL);
    }
    // console.log(`url: ${fireflyURL}`);
    // console.log(`channel: ${channel}`);
    // console.log(window.firefly);
    return fireflyURL;
}

