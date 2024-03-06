type Splat = Array<string>;
type Params = { [key: string]: string };

type Action = (options: ActionOptions) => Promise<ActionValue> | ActionValue;
type ActionValue = undefined | null | boolean | string | object | number | bigint | Response;
type ActionOptions = {
	url: URL;
	data: any;
	splat: Splat;
	params: Params;
	signal: AbortSignal;
};

type Loader = (options: LoaderOptions) => Promise<LoaderValue> | LoaderValue;
type LoaderValue = undefined | null | boolean | string | object | number | bigint | Response;
type LoaderOptions = {
	url: URL;
	splat: Splat;
	params: Params;
	signal: AbortSignal;
};

type DefaultRouteConfig = {
	type: React.ReactNode;
	path: string;
	root: boolean;
	loader: Loader;
	action: Action;
	children: Array<RouteConfig>;
};

type RedirectTo = (options: RedirectOptions) => string;
type RedirectOptions = { splat: Array<string>; params: object };
type RedirectRouteConfig = {
	type: React.ReactNode;
	path: string;
	to: string | RedirectTo;
};

type RouteConfig = DefaultRouteConfig | RedirectRouteConfig;
type RoutesConfig = React.JSX.Element | RouteConfig | Array<React.JSX.Element> | Array<RouteConfig>;
type RoutesOptions = {};

export default function Routes(routes: RoutesConfig): React.ReactNode;
export default function Routes(options: RoutesOptions, routes: RoutesConfig): React.ReactNode;

interface NavigationOptions {
	data?: any;
	push?: boolean;
	replace?: boolean;
	title?: string;
	state?: any;
	data?: any;
	cache?: boolean;
	sticky?: boolean;
	reload?: boolean;
	relative?: boolean;
	onAbort?: (event: CustomEvent, reason: any) => void;
	onCancel?: (event: CustomEvent) => void;
	onNavigate?: (event: CustomEvent) => void;
	onNavigateEnd?: (event: CustomEvent) => void;
	onNavigateStart?: (event: CustomEvent) => void;
}

interface LinkProps extends React.LinkHTMLAttributes<HTMLAnchorElement>, NavigationOptions {}

export function Link(props: LinkProps): React.JSX.Element;

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement>, NavigationOptions {
	onActionError?: (event: CustomEvent, error, Error) => void;
}

export function Form(props: FormProps): React.JSX.Element;

type RequestProps = { value?: Request; defaultValue?: Request };

export function Request(props: RequestProps): React.JSX.Element;

type RedirectProps = {};

export function Redirect(props: RedirectProps): React.JSX.Element;

type Link = (props: LinkProps) => React.JSX.Element;

export function useLink(): [link: Link, busy: boolean, loading: boolean, navigations: Array<Navigation>];

type Form = (props: FormProps) => React.JSX.Element;

export function useForm(): [form: Form, busy: boolean, loading: boolean, navigations: Array<Navigation>];

interface NavigateToOptions extends NavigationOptions {
	method: string;
	onActionError?: (event: CustomEvent, error: Error) => void;
}

interface NavigateOptions extends NavigateToOptions {
	to: string;
}

type Navigate = (options: NavigateOptions) => void;
type NavigateTo = (to: string, options: NavigateToOptions) => void;
type Navigation = { loading: boolean; detail: object };

export function useNavigate(): [
	navigate: Navigate | NavigateTo,
	busy: boolean,
	loading: boolean,
	navigations: Array<Navigation>,
];

export function useNavigations(): Array<Navigation>;

type AbortNavigations = undefined | null | Navigation | Array<Navigation>;
type Abort = (navigations: AbortNavigations) => void;

export function useAbort(): Abort;
export function useSplat(): Splat;
export function useParams(): Params;
export function useHistory(): History;
export function useLocation(): URL;
export function useActionError(): any;
export function useActionResult(): any;
export function useLoaderResult(): any;

type Resolve = (options: ResolveOptions) => string;
type ResolveTo = (to: string, options: ResolveOptions) => string;
type ResolveOptions = { relative?: boolean };

export function useResolve(): Resolve | ResolveTo;
