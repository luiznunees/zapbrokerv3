import { supabase, supabaseAnon } from '../config/supabase';

export const registerUser = async (name: string, email: string, password: string) => {
    const { data, error } = await supabaseAnon.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
            },
        },
    });

    if (error) {
        throw new Error(error.message);
    }

    return {
        user: data.user,
        token: data.session?.access_token,
        session: data.session
    };
};

export const loginUser = async (email: string, password: string) => {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error('Invalid credentials');
    }

    return {
        user: data.user,
        token: data.session?.access_token,
        session: data.session
    };
};
