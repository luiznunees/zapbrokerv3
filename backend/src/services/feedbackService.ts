import { supabase } from '../config/supabase';

export interface FeedbackInput {
    userId?: string | null;
    name?: string;
    email?: string;
    overallRating?: number;
    easeRating?: number;
    liked?: string;
    confusing?: string;
    hadError?: boolean;
    errorDescription?: string;
    improvements?: string;
    pageUrl?: string;
    userAgent?: string;
}

export const createFeedback = async (input: FeedbackInput) => {
    const { data, error } = await supabase
        .from('beta_feedback')
        .insert([{
            user_id: input.userId || null,
            name: input.name || null,
            email: input.email || null,
            overall_rating: input.overallRating ?? null,
            ease_rating: input.easeRating ?? null,
            liked: input.liked || null,
            confusing: input.confusing || null,
            had_error: input.hadError ?? null,
            error_description: input.errorDescription || null,
            improvements: input.improvements || null,
            page_url: input.pageUrl || null,
            user_agent: input.userAgent || null,
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const getFeedback = async (page = 1, limit = 50) => {
    const { data, error, count } = await supabase
        .from('beta_feedback')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

    if (error) throw new Error(error.message);
    return { data, page, limit, total: count || 0 };
};
