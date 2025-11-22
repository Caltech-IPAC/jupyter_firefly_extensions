/**
 * This is JupyterLab's recommended way of creating handlers for extension with server.
 */

import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response object
 */
export async function requestAPI(
  endPoint = '',
  init: RequestInit = {}
): Promise<Response> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings();
  const requestUrl = URLExt.join(
    settings.baseUrl,
    'jupyter-firefly-extensions', // API Namespace
    endPoint
  );

  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error as any);
  }

  if (!response.ok) {
    const data = await response.text();
    throw new ServerConnection.ResponseError(response, data);
  }

  return response;
}
