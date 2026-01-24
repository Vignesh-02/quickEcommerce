import queryString from "query-string";

export type QueryValue = string | string[] | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export type ProductFilterParams = {
    search?: string;
    genders: string[];
    sizes: string[];
    colors: string[];
    categories: string[];
    brands: string[];
    priceRanges: Array<{ min: number; max: number }>;
    priceMin?: number;
    priceMax?: number;
    sortBy: string;
    page: number;
    limit: number;
};

export type ProductQueryObject = ProductFilterParams & { offset: number };

export const getDefaultProductFilters = (): ProductFilterParams => ({
    search: undefined,
    genders: [],
    sizes: [],
    colors: [],
    categories: [],
    brands: [],
    priceRanges: [],
    priceMin: undefined,
    priceMax: undefined,
    sortBy: "latest",
    page: 1,
    limit: 6,
});

const arrayFormat = "bracket" as const;

const toArray = (value: QueryValue): string[] => {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value.filter(Boolean);
    }

    return [value];
};

const toNumber = (value: string | undefined) => {
    if (!value) {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const parsePriceRanges = (ranges: string[]) =>
    ranges
        .map((range) => {
            const [minRaw, maxRaw] = range.split("-");
            const min = Number(minRaw);
            const max = Number(maxRaw);
            if (!Number.isFinite(min) || !Number.isFinite(max)) {
                return null;
            }
            return { min, max };
        })
        .filter((range): range is { min: number; max: number } =>
            Boolean(range)
        );

export const parseQueryString = (
    search: string
): Record<string, string | string[]> => {
    if (!search) {
        return {};
    }

    return queryString.parse(search, { arrayFormat }) as Record<
        string,
        string | string[]
    >;
};

export const parseSearchParams = (
    params: Record<string, string | string[] | undefined>
) => {
    const search = queryString.stringify(params, {
        arrayFormat,
        skipEmptyString: true,
        skipNull: true,
    });

    return parseQueryString(search);
};

export const stringifyQueryString = (params: QueryParams) =>
    queryString.stringify(params, {
        arrayFormat,
        skipEmptyString: true,
        skipNull: true,
    });

export const getQueryArray = (params: QueryParams, key: string) =>
    toArray(params[key]);

export const getQueryString = (params: QueryParams, key: string) => {
    const value = params[key];
    if (Array.isArray(value)) {
        return value[0];
    }
    return value ?? undefined;
};

export const withQuery = (pathname: string, search: string) =>
    search ? `${pathname}?${search}` : pathname;

export const setQueryValue = (
    search: string,
    key: string,
    value: QueryValue
) => {
    const params = parseQueryString(search);

    if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
    ) {
        delete params[key];
    } else {
        params[key] = value;
    }

    return stringifyQueryString(params);
};

export const removeQueryValue = (
    search: string,
    key: string,
    value?: string
) => {
    const params = parseQueryString(search);

    if (!value) {
        delete params[key];
        return stringifyQueryString(params);
    }

    const nextValues = toArray(params[key]).filter((entry) => entry !== value);

    if (nextValues.length === 0) {
        delete params[key];
    } else {
        params[key] = nextValues;
    }

    return stringifyQueryString(params);
};

export const toggleQueryValue = (
    search: string,
    key: string,
    value: string
) => {
    const params = parseQueryString(search);
    const currentValues = toArray(params[key]);
    const nextValues = currentValues.includes(value)
        ? currentValues.filter((entry) => entry !== value)
        : [...currentValues, value];

    if (nextValues.length === 0) {
        delete params[key];
    } else {
        params[key] = nextValues;
    }

    return stringifyQueryString(params);
};

export const parseFilterParams = (
    searchParams: Record<string, string | string[] | undefined>
): ProductFilterParams => {
    const parsed = parseSearchParams(searchParams);
    const search = getQueryString(parsed, "search") ?? undefined;
    const genders = getQueryArray(parsed, "gender");
    const sizes = getQueryArray(parsed, "size");
    const colors = getQueryArray(parsed, "color");
    const categories = getQueryArray(parsed, "category");
    const brands = getQueryArray(parsed, "brand");
    const priceRanges = parsePriceRanges(getQueryArray(parsed, "price"));
    const priceMin =
        toNumber(getQueryString(parsed, "priceMin") ?? undefined) ??
        toNumber(getQueryString(parsed, "minPrice") ?? undefined);
    const priceMax =
        toNumber(getQueryString(parsed, "priceMax") ?? undefined) ??
        toNumber(getQueryString(parsed, "maxPrice") ?? undefined);
    const sortBy =
        getQueryString(parsed, "sortBy") ??
        getQueryString(parsed, "sort") ??
        "latest";
    const page = toNumber(getQueryString(parsed, "page") ?? undefined) ?? 1;
    const limit = toNumber(getQueryString(parsed, "limit") ?? undefined) ?? 12;

    return {
        search,
        genders,
        sizes,
        colors,
        categories,
        brands,
        priceRanges,
        priceMin,
        priceMax,
        sortBy,
        page,
        limit,
    };
};

export const buildProductQueryObject = (
    filters: Partial<ProductFilterParams>
): ProductQueryObject => {
    const defaults = getDefaultProductFilters();
    const merged: ProductFilterParams = { ...defaults, ...filters };
    const page = Math.max(merged.page, 1);
    const limit = Math.max(merged.limit, 1);
    const offset = (page - 1) * limit;

    return {
        ...merged,
        page,
        limit,
        offset,
    };
};
