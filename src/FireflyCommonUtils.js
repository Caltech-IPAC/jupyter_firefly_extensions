import {initFirefly} from 'firefly-api-access';
import { PageConfig} from '@jupyterlab/coreutils';



export function addFirefly()  {
    const fireflyURL= PageConfig.getOption('fireflyURL') || 'http://localhost:8080/firefly';
    if (!window.getFireflyAPI) {
        window.getFireflyAPI= initFirefly(fireflyURL);
    }
    return fireflyURL;
}

