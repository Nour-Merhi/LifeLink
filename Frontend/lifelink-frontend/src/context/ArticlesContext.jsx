import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';

const ArticlesContext = createContext();

export const useArticles = () => {
    const context = useContext(ArticlesContext);
    if (!context) {
        throw new Error('useArticles must be used within an ArticlesProvider');
    }
    return context;
};

export const ArticlesProvider = ({ children }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const lastFetchRef = useRef(null);
    const hasFetchedRef = useRef(false);

    const fetchArticles = useCallback(async (forceRefresh = false) => {
        // If we have fresh data (less than 5 minutes old) and not forcing refresh, skip fetch
        if (!forceRefresh && articles.length > 0 && lastFetchRef.current) {
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            if (lastFetchRef.current > fiveMinutesAgo) {
                return articles;
            }
        }

        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/api/articles');
            const articlesData = response.data.articles || response.data || [];
            const articlesArray = Array.isArray(articlesData) ? articlesData : [];
            setArticles(articlesArray);
            lastFetchRef.current = Date.now();
            hasFetchedRef.current = true;
            return articlesArray;
        } catch (err) {
            console.error('Error fetching articles:', err);
            setError(err.response?.data?.message || 'Failed to load articles');
            setArticles([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependencies to avoid circular dependency

    // Fetch articles on mount (only once)
    useEffect(() => {
        if (!hasFetchedRef.current) {
            fetchArticles();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Get a single article by ID
    const getArticleById = useCallback((id) => {
        return articles.find(article => article.id === parseInt(id) || article.id === id);
    }, [articles]);

    // Get articles by category
    const getArticlesByCategory = useCallback((category) => {
        return articles.filter(article => article.category === category);
    }, [articles]);

    const value = {
        articles,
        loading,
        error,
        fetchArticles,
        getArticleById,
        getArticlesByCategory,
        refreshArticles: () => fetchArticles(true),
    };

    return (
        <ArticlesContext.Provider value={value}>
            {children}
        </ArticlesContext.Provider>
    );
};
