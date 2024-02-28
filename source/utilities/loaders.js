import { createData } from './response.js';
import { createResource } from './resource.js';
import { isEquivalentMatch } from './match.js';

export function createLoaders(render, options = {}) {
	let { loaders, action, scheduler } = options;

	let results = [];
	let matched = render.root;
	while (matched) {
		let match = matched;
		let loader = match.config.loader;
		if (loader) {
			let result = loaders?.find(loader => !loader.dirty && isEquivalentMatch(match, loader.match));
			if (result == undefined) {
				let { url, signal } = render.request;

				let dirty = false;
				let promise = createLoaderPromise();
				let resource = createResource(promise, scheduler);
				let controller = new AbortController();

				signal.addEventListener('abort', () => controller.abort(), { once: true });

				result = { dirty, match, promise, resource, controller };

				async function createLoaderPromise() {
					await action;

					let loaderResult;
					let loaderType = typeof loader;
					if (loaderType === 'function') {
						let { splat, params } = match;

						loaderResult = await loader({ url, splat, params, signal });
					} else {
						loaderResult = await loader;
					}

					if (loaderResult instanceof Response) {
						return createData(loaderResult);
					} else {
						return loaderResult;
					}
				}
			}

			results.push(result);
		}

		matched = match.children;
	}

	return results;
}
