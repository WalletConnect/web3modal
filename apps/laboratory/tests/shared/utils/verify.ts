import type { Page } from '@playwright/test'

/*
 * This function makes requests to the intercept URL be handled by the base URL
 * This allows the browser APIs to think interceptUrl is the URL the page is on
 */
// eslint-disable-next-line max-params
export async function routeInterceptUrl(
  page: Page,
  interceptUrl: string,
  baseUrl: string,
  path: string
) {
  await page.route(`${interceptUrl}/**/*`, async (route, request) => {
    // eslint-disable-next-line init-declarations
    let url: string
    if (request.url() === `${interceptUrl}/`) {
      url = `${baseUrl}${path}`
    } else {
      url = request.url().replace(interceptUrl, baseUrl)
    }
    const response = await fetch(url, {
      method: request.method(),
      headers: request.headers(),
      body: request.postData()
    })
    const headers: Record<string, string> = {}
    response.headers.forEach((value: string, key: string) => {
      headers[key] = value
    })
    const body = Buffer.from(await response.arrayBuffer())
    await route.fulfill({
      status: response.status,
      headers,
      body
    })
  })
}
