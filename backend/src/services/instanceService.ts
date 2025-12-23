import { supabase } from '../config/supabase';
import * as evolutionService from './evolutionService';

export const createInstance = async (userId: string, name: string) => {
    // Evolution API: Instance name acts as the ID/Token
    const instanceName = name.replace(/\s+/g, '-').toLowerCase() + '-' + userId.substring(0, 4);

    // Check if an instance with this evolution_id already exists in DB
    const { data: existingInstance } = await supabase
        .from('instances')
        .select('*')
        .eq('evolution_id', instanceName)
        .single();

    if (existingInstance) {
        if (existingInstance.user_id === userId) {
            throw new Error('You already have a WhatsApp instance configured. Please delete it before creating a new one.');
        } else {
            // Unlikely collision with user ID suffix, but possible
            throw new Error('A WhatsApp instance with this name already exists.');
        }
    }

    await evolutionService.createSession(instanceName);

    // 2. Save to DB
    const { data, error } = await supabase
        .from('instances')
        .insert([
            { user_id: userId, name: name, evolution_id: instanceName, status: 'disconnected' }
        ])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const connectInstance = async (userId: string, instanceId: string) => {
    const { data: instance } = await supabase
        .from('instances')
        .select('*')
        .eq('id', instanceId)
        .eq('user_id', userId)
        .single();

    if (!instance) {
        throw new Error('Instance not found');
    }

    // Connect (Get QR Code)
    const base64 = await evolutionService.getSessionScreen(instance.evolution_id);

    return { base64: base64 };
};

export const getInstances = async (userId: string) => {
    const { data: instances, error } = await supabase
        .from('instances')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        throw new Error(error.message);
    }

    // Sync status with Evolution
    const updatedInstances = await Promise.all(instances.map(async (instance) => {
        try {
            const status = await evolutionService.checkSessionStatus(instance.evolution_id);

            // Map Evolution status to our status
            // Evolution v2: open, close, connecting, refused
            let dbStatus = instance.status;

            if (status === 'not_found' || status === 'refused') {
                dbStatus = 'disconnected';
            } else if (status === 'open') {
                dbStatus = 'connected';
            } else if (status === 'close') {
                dbStatus = 'disconnected';
            } else if (status === 'connecting') {
                dbStatus = 'connecting';
            } else if (status === 'error') {
                dbStatus = 'error';
            }

            // Update DB if changed
            if (dbStatus !== instance.status) {
                await supabase
                    .from('instances')
                    .update({ status: dbStatus })
                    .eq('id', instance.id);
                instance.status = dbStatus;
            }
        } catch (err) {
            console.error(`Failed to sync status for instance ${instance.name}`);
        }
        return instance;
    }));

    return updatedInstances;
};

export const deleteInstance = async (userId: string, instanceId: string) => {
    const { data: instance } = await supabase
        .from('instances')
        .select('*')
        .eq('id', instanceId)
        .eq('user_id', userId)
        .single();

    if (!instance) {
        throw new Error('Instance not found');
    }

    // Delete from Evolution
    await evolutionService.deleteSession(instance.evolution_id);

    // Delete from DB
    const { error } = await supabase
        .from('instances')
        .delete()
        .eq('id', instanceId);


    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
};

export const logoutInstance = async (userId: string, instanceId: string) => {
    const { data: instance } = await supabase
        .from('instances')
        .select('*')
        .eq('id', instanceId)
        .eq('user_id', userId)
        .single();

    if (!instance) {
        throw new Error('Instance not found');
    }

    await evolutionService.logoutSession(instance.evolution_id);

    // Update status in DB
    await supabase
        .from('instances')
        .update({ status: 'disconnected' })
        .eq('id', instanceId);

    return { success: true };
};

export const getInstanceByName = async (userId: string, name: string) => {
    const { data: instance } = await supabase
        .from('instances')
        .select('*')
        .eq('user_id', userId)
        .eq('name', name)
        .single();

    return instance;
};
