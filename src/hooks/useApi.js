import { useState, useEffect, useCallback } from 'react';
import { cityApi, categoryApi, serviceApi, eventsApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

// Simple in-memory cache for API requests
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  apiCache.set(key, { data, timestamp: Date.now() });
};

// Custom hook for API calls with loading, error states, and optional caching
export const useApi = (apiFunction, dependencies = [], cacheKey = null) => {
  const [data, setData] = useState(() => {
    if (cacheKey) {
      const cached = getCachedData(cacheKey);
      if (cached) return cached;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    if (cacheKey) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction();
      setData(result);
      if (cacheKey) {
        setCachedData(cacheKey, result);
      }
    } catch (err) {
      setError(err.message);
      console.error('API call failed:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFunction, cacheKey]);

  useEffect(() => {
    execute();
  }, dependencies);

  const refetch = () => {
    if (cacheKey) {
      apiCache.delete(cacheKey);
    }
    execute();
  };

  return { data, loading, error, refetch };
};

// Specific hooks for each API endpoint
export const useCities = () => {
  return useApi(cityApi.getAll);
};

export const useCity = (id) => {
  return useApi(() => cityApi.getById(id), [id]);
};

export const useCategories = () => {
  const { language } = useLanguage();
  return useApi(categoryApi.getAll, [language], `categories_all_${language}`);
};

export const useCategoryList = () => {
  const { language } = useLanguage();
  return useApi(categoryApi.getList, [language], `categories_list_${language}`);
};

export const useCategory = (id) => {
  return useApi(() => categoryApi.getById(id), [id]);
};

export const useServices = () => {
  return useApi(serviceApi.getAll);
};

export const useService = (id) => {
  return useApi(() => serviceApi.getById(id), [id]);
};

export const useEvents = () => {
  const { language } = useLanguage();
  return useApi(eventsApi.getAll, [language], `events_all_${language}`);
};

export const useEvent = (id) => {
  return useApi(() => eventsApi.getById(id), [id]);
};

export const useEventsByCategory = (category) => {
  const { language } = useLanguage();
  return useApi(() => eventsApi.getByCategory(category), [category, language], `events_by_category_${category}_${language}`);
};

export const useEventFeed = () => {
  const { language } = useLanguage();
  return useApi(eventsApi.getFeed, [language], `event_feed_${language}`);
};

export const useEventDetails = (id) => {
  const { language } = useLanguage();
  const cacheKey = id ? `event_details_${id}_${language}` : null;

  const [data, setData] = useState(() => {
    if (cacheKey) {
      const cached = getCachedData(cacheKey);
      if (cached) return cached;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setError(null);
      return;
    }

    const cached = getCachedData(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await eventsApi.getDetails(id);
        setData(result);
        setCachedData(cacheKey, result);
      } catch (err) {
        const errorMessage = err.message || err.detail || 'Failed to load event details';
        setError(errorMessage);
        console.error('Error loading event details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, cacheKey]);

  return { data, loading, error };
};

export const usePopularEvents = () => {
  const { language } = useLanguage();
  return useApi(eventsApi.getPopular, [language], `events_popular_${language}`);
};

export const useFeaturedEvents = () => {
  const { language } = useLanguage();
  return useApi(eventsApi.getFeatured, [language], `events_featured_${language}`);
};

// Hook for mutations (create, update, delete)
export const useApiMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeMutation = useCallback(async (mutationFunction) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mutationFunction();
      return result;
    } catch (err) {
      setError(err.message);
      console.error('API mutation failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, executeMutation };
}; 