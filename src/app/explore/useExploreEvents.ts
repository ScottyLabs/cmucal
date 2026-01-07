import { useEffect, useState } from "react";
import { EventType } from "../types/EventType";
import { api, API_BASE_URL } from "../utils/api/api";

type OptionType = {
  value: number;
  label: string;
};

type Props = {
    term: string,
    tags: OptionType[],
    date: Date | null, 
    userID: string | null,
};

export function useExploreEvents ({
    term,
    tags,
    date, 
    userID
} : Props) {

    const LIMIT = 30; // number of new entries to fetch on each load / request

    // const debouncedSearchTerm = useDebounce(searchTerm, 400); // 400ms debounce
    const [exploreResults, setExploreResults] = useState<EventType[]>([]);
    const [offset, setOffset] = useState(0);    
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // fetch sidebar events conditioned on filters (search term, tags, start date)
    const fetchInitial = async () => {
        setLoading(true);
        try {
            setLoading(true);
            const selectedTagIds = tags.map((tag:OptionType) => tag.value).join(",");
            const res = await api.get(`/events/occurrences`, {
                headers: { "Clerk-User-Id": userID },
                params: {
                    term,
                    tags: selectedTagIds,
                    date,
                    limit: LIMIT,
                    offset: 0,
                },
                withCredentials: true,      
            })
            setExploreResults(res.data);
            setOffset(LIMIT);
            setHasMore(res.data.length === LIMIT); 
        } catch (err) {
            console.error("Failed to fetch initial explore events batch", err)
        } finally {
            setLoading(false);
        }
    };

    const fetchMore = async () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        const selectedTagIds = tags.map((tag:OptionType) => tag.value).join(",");

        try {
            const res = await api.get(`/events/occurrences`, {
                headers: { "Clerk-User-Id": userID },
                params: { term, tags, date, limit: LIMIT, offset },
                withCredentials: true,      
            })
            setExploreResults(prev => [...prev, ...res.data]);
            setOffset(prev => prev + LIMIT);
            if (res.data.length < LIMIT) setHasMore(false);
        } catch (err) {
            console.error("Failed to fetch next events batch", err)
        } finally {
            setLoadingMore(false);
        }
    }

    // resets when filter changes
    useEffect(() => {
        if (!userID) return;
        setExploreResults([]);
        setOffset(0);
        setHasMore(true);
        fetchInitial();
    }, [term, tags, date, userID]);

    return { exploreResults, loading, loadingMore, hasMore, fetchMore };

}