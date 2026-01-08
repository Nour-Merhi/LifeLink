import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';

const HospitalsContext = createContext();

export const useHospitals = () => {
    const context = useContext(HospitalsContext);
    if (!context) {
        throw new Error('useHospitals must be used within a HospitalsProvider');
    }
    return context;
};

export const HospitalsProvider = ({ children }) => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const lastFetchRef = useRef(null);
    const hasFetchedRef = useRef(false);

    const fetchHospitals = useCallback(async (forceRefresh = false) => {
        // If we have fresh data (less than 5 minutes old) and not forcing refresh, skip fetch
        if (!forceRefresh && hospitals.length > 0 && lastFetchRef.current) {
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            if (lastFetchRef.current > fiveMinutesAgo) {
                return hospitals;
            }
        }

        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/api/hospital');
            const hospitalsData = response.data.hospitals || response.data || [];
            const hospitalsArray = Array.isArray(hospitalsData) ? hospitalsData : [];
            setHospitals(hospitalsArray);
            lastFetchRef.current = Date.now();
            hasFetchedRef.current = true;
            return hospitalsArray;
        } catch (err) {
            console.error('Error fetching hospitals:', err);
            setError(err.response?.data?.message || 'Failed to load hospitals');
            setHospitals([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependencies to avoid circular dependency

    // Fetch hospitals on mount (only once)
    useEffect(() => {
        if (!hasFetchedRef.current) {
            fetchHospitals();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Get a single hospital by ID
    const getHospitalById = useCallback((id) => {
        return hospitals.find(hospital => hospital.id === parseInt(id) || hospital.id === id);
    }, [hospitals]);

    const value = {
        hospitals,
        loading,
        error,
        fetchHospitals,
        getHospitalById,
        refreshHospitals: () => fetchHospitals(true),
    };

    return (
        <HospitalsContext.Provider value={value}>
            {children}
        </HospitalsContext.Provider>
    );
};

