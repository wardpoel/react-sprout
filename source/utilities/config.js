import Redirect from '../components/redirect.jsx';

import { joinPaths, pathParts, resolvePaths } from './path.js';
import { childrenToArray } from './children.js';
import { descriptorScore, descriptorStructure, equivalentDescriptors } from './descriptor.js';

import configConsole from './console.js';

export function createConfig(rootElement, options) {
	let { prefix = '' } = options ?? {};

	let duplicates = [];

	if (import.meta.env.DEV && rootElement == undefined) {
		console.warn(`No routes are specified. The router will not render anything.`);
	}

	return createConfigs(rootElement == undefined ? [] : [rootElement]);

	function createConfigs(elements, options) {
		let { base = '/', level = 0 } = options ?? {};

		let validElements = elements.filter(verifyNoElementErrors);
		let sortedElements = sortElementsByDescriptorScore(validElements);

		validElements.forEach(verifyNoElementWarnings);

		return sortedElements.map(element => {
			let { path, root, to, status, loader, action, children, ...other } = element.props;

			if (action === true) action = createConfigAction(prefix);
			if (loader === true) loader = createConfigLoader(prefix, level);

			let childBase = resolvePaths(base, path);
			let childOptions;
			let childConfigs;

			let childrenArray = childrenToArray(children);
			if (childrenArray.length) {
				childOptions = { base: childBase, level: level + 1 };
				childConfigs = createConfigs(childrenArray, childOptions);
			} else {
				let descriptorPath = path == undefined ? joinPaths(childBase, '*') : childBase;

				let structure = descriptorStructure(descriptorPath);
				let duplicate = duplicates.find(duplicate => equivalentDescriptors(duplicate.structure, structure));
				if (duplicate && import.meta.env.DEV) {
					configConsole.warn(
						`There are two routes which will match the same url. The second route will never render.`,
						rootElement,
						[duplicate.element, element],
					);
				} else {
					duplicates.push({ element, structure });
				}
			}

			let type = element.type;
			if (type === Redirect) {
				return { type, path, to, status, action };
			} else {
				return { type, path, root, status, loader, action, children: childConfigs };
			}
		});
	}

	function assertNoElementErrors(element) {
		assertElementIsNotTextNode(element);
	}

	function verifyNoElementErrors(element) {
		try {
			assertNoElementErrors(element);
		} catch (error) {
			if (import.meta.env.DEV && error instanceof RouterConfigError) {
				configConsole.warn(error.message, rootElement, [element]);
				return false;
			} else {
				throw error;
			}
		}

		return true;
	}

	function assertNoElementWarnings(element) {
		assertElementPathHasNoHash(element);
		assertElementRedirectHasNoLoader(element);
		assertElementRedirictHasNoChildren(element);
		assertElementWithoutChildrenIsNotRoot(element);
	}

	function verifyNoElementWarnings(element) {
		try {
			assertNoElementWarnings(element);
		} catch (error) {
			if (import.meta.env.DEV && error instanceof RouterConfigError) {
				configConsole.warn(error.message, rootElement, [element]);
			} else {
				throw error;
			}

			return false;
		}

		return true;
	}
}

function sortElementsByDescriptorScore(elements) {
	let scores = {};
	for (let element of elements) {
		let path = element.props.path;
		if (scores[path] == undefined) {
			scores[path] = descriptorScore(path);
		}
	}

	return elements.sort(function (a, b) {
		if (scores[a.props.path] < scores[b.props.path]) return 1;
		if (scores[a.props.path] > scores[b.props.path]) return -1;

		return 0;
	});
}

export class RouterConfigError extends Error {}

function assertElementIsNotTextNode(element) {
	if (typeof element === 'string') {
		throw new RouterConfigError(
			`There is a text node "${element}" in the children of your <Router>. Routes need to be specified by react elements. Please remove this text node to fix this.`,
		);
	}
}

function assertElementRedirectHasNoLoader(element) {
	let type = element.type;
	let loader = element.props.loader;
	if (loader && type === Redirect) {
		throw new RouterConfigError(
			`There is a Redirect route with a loader. Redirect routes should not load data as they will not render. Please remove the loader to fix this.`,
		);
	}
}

function assertElementRedirictHasNoChildren(element) {
	let type = element.type;
	let children = element.props.children;
	if (children && type === Redirect) {
		throw new RouterConfigError(
			`There is a Redirect route with child routes. Redirect routes should not have child routes. Please remove the child routes to fix this.`,
		);
	}
}

function assertElementWithoutChildrenIsNotRoot(element) {
	let root = element.props.root;
	let children = element.props.children;
	if (children && root) {
		throw new RouterConfigError(
			`There is a root route without child routes. Please remove the root property to fix this.`,
		);
	}
}

function assertElementPathHasNoHash(element) {
	let path = element.props.path;
	if (path != undefined) {
		let hash = pathParts(element.props.path)[2];
		if (hash) {
			throw new RouterConfigError(
				`There is a route with a hash "#${hash}". Hashes should not be used in your route paths. Please remove the hash "#${hash}" to fix this.`,
			);
		}
	}
}

export function createConfigLoader(prefix, level) {
	return async function loader({ request }) {
		let url = new URL(request.url);
		let response = await fetch(`${prefix}${url.pathname}${url.search}`, {
			headers: {
				Accept: 'application/json',
				Range: `route=${level}`,
			},
		});

		let result;
		let contentType = response.headers.get('content-type');
		let contentLength = response.headers.get('content-length');
		if (contentLength > 0 && contentType?.includes('application/json')) {
			result = await response.json();
		} else {
			result = await response.text();
		}

		if (response.ok) {
			return result;
		} else {
			throw response;
		}
	};
}

export function createConfigAction(prefix) {
	return async function action({ request }) {
		let url = new URL(request.url);
		let response = await fetch(`${prefix}${url.pathname}${url.search}`, {
			method: 'POST',
			body: request.body,
			headers: { Accept: 'application/json' },
		});

		let result;
		let contentType = response.headers.get('Content-Type');
		let contentLength = response.headers.get('content-length');
		if (contentLength > 0 && contentType?.includes('application/json')) {
			result = await response.json();
		} else {
			result = await response.text();
		}

		if (response.ok) {
			return result;
		} else {
			throw response;
		}
	};
}
