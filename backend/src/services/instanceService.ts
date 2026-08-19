import { supabase } from '../config/supabase';
import * as evolutionService from './evolutionService';
import * as eventLogService from './eventLogService';

export const createInstance = async (userId: string, name: string, phoneNumber?: string) => {
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

    // Criar já com o número (quando informado) evita o pairing code/QR travado do
    // fluxo criar-depois-conectar — ver connectInstance abaixo.
    const { base64, pairingCode } = await evolutionService.createSession(instanceName, phoneNumber);

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

    return { ...data, base64, pairingCode };
};

export const connectInstance = async (userId: string, instanceId: string, phoneNumber?: string) => {
    const { data: instance } = await supabase
        .from('instances')
        .select('*')
        .eq('id', instanceId)
        .eq('user_id', userId)
        .single();

    if (!instance) {
        throw new Error('Instance not found');
    }

    // Sessão pendente/travada de uma tentativa anterior faz a Evolution devolver
    // pairingCode/base64 nulos silenciosamente, ou um código velho ainda vinculado ao
    // socket antigo (que o celular rejeita com "não foi possível conectar"). Desloga e
    // espera o estado realmente virar 'close' antes de pedir um QR/código novo, pra
    // garantir que o código gerado esteja atrelado a um socket novo de verdade.
    await evolutionService.logoutSession(instance.evolution_id);

    const maxWaitMs = 5000;
    const pollIntervalMs = 300;
    let waited = 0;
    while (waited < maxWaitMs) {
        const state = await evolutionService.checkSessionStatus(instance.evolution_id);
        if (state === 'close' || state === 'not_found') break;
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        waited += pollIntervalMs;
    }

    // Connect (Get QR Code or Pairing Code)
    const { base64, pairingCode } = await evolutionService.getSessionScreen(instance.evolution_id, phoneNumber);

    return { base64, pairingCode };
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
                // Primeira conexão de verdade marca o início do aquecimento (ver
                // campaignService.getWarmupInfo) — reconexões não resetam essa data.
                const isFirstConnection = dbStatus === 'connected' && !instance.connected_at;

                await supabase
                    .from('instances')
                    .update({
                        status: dbStatus,
                        ...(isFirstConnection ? { connected_at: new Date().toISOString() } : {}),
                    })
                    .eq('id', instance.id);

                if (isFirstConnection) instance.connected_at = new Date().toISOString();

                // Só interessa reportar quando o número CAI num estado ruim — a saída de
                // erro/desconectado (voltando a conectar) não é um evento de alerta.
                if (dbStatus === 'error') {
                    eventLogService.logEvent({
                        type: 'whatsapp.error',
                        severity: 'error',
                        message: `WhatsApp "${instance.name}" entrou em estado de erro`,
                        userId,
                        metadata: { instanceId: instance.id },
                    });
                } else if (dbStatus === 'disconnected' && instance.status !== 'disconnected') {
                    eventLogService.logEvent({
                        type: 'whatsapp.disconnected',
                        severity: 'warn',
                        message: `WhatsApp "${instance.name}" desconectou`,
                        userId,
                        metadata: { instanceId: instance.id },
                    });
                }

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
