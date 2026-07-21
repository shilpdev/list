import type { RequestHandler } from '@7span/list-types';
import type { Skill } from '../types/skill';

const requestHandler: RequestHandler<Skill> = async ({
  endpoint,
  page,
  perPage,
  search,
  sortBy,
  sortOrder,
  filters,
}) => {
  const params = new URLSearchParams();

  if (page && perPage) {
    params.append('page', String(page));
    params.append('limit', String(perPage));
  }

  if (search) {
    params.append('search', search);
  }

  if (sortBy) {
    params.append('sort', sortOrder === 'desc' ? `-${sortBy}` : sortBy);
  }

  if (filters && Object.keys(filters).length > 0) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (typeof value === 'object' && value !== null) {
          Object.entries(value as Record<string, unknown>).forEach(
            ([operator, operatorValue]) => {
              params.append(
                `filter[${key}][${operator}]`,
                String(operatorValue)
              );
            }
          );
        } else {
          params.append(`filter[${key}][_eq]`, String(value));
        }
      }
    });
  }

  params.append('meta', '*');

  const queryString = params.toString();
  const url = `https://everest.7span.in/items/${endpoint}${
    queryString ? `?${queryString}` : ''
  }`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      items: data.data as Skill[],
      count: data.meta?.total_count || data.meta?.filter_count || 0,
      meta: data.meta || {},
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      items: [],
      count: 0,
    };
  }
};

export default requestHandler;
