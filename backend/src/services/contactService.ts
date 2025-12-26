import { supabase } from '../config/supabase';
import fs from 'fs';
import csv from 'csv-parser';

export const createList = async (userId: string, name: string) => {
    const { data, error } = await supabase
        .from('contact_lists')
        .insert([{ user_id: userId, name }])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const getLists = async (userId: string) => {
    const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const addContact = async (userId: string, listId: string, name: string, phone: string) => {
    // Verify list ownership
    const { data: list } = await supabase
        .from('contact_lists')
        .select('id')
        .eq('id', listId)
        .eq('user_id', userId)
        .single();

    if (!list) throw new Error('Contact list not found or access denied');

    const { data, error } = await supabase
        .from('contacts')
        .insert([{ list_id: listId, name, phone }])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

// Helper to extract contacts from text
const extractContactsFromText = (text: string, listId: string) => {
    // Regex for Brazilian Phone Numbers
    const PHONE_REGEX = /(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})[-.\s]?(\d{4}))/g;
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const contacts: any[] = [];
    const seenPhones = new Set();

    lines.forEach(line => {
        const matches = [...line.matchAll(PHONE_REGEX)];
        if (matches.length > 0) {
            const match = matches[0];
            const fullMatch = match[0];
            const ddd = match[2] || '';
            const part1 = match[3];
            const part2 = match[4];

            // Normalize: 55 + DDD + Number
            let normalizedPhone = `55${ddd}${part1}${part2}`.replace(/\D/g, '');

            // Avoid duplicates in the same import
            if (seenPhones.has(normalizedPhone)) return;
            seenPhones.add(normalizedPhone);

            // Guess Name
            let name = line.replace(fullMatch, '').trim();
            name = name.replace(/^[-:;|•\s]+|[-:;|•\s]+$/g, '');
            if (!name) name = "Contato Importado (PDF)";

            // Basic validation
            if (name.length > 2 && normalizedPhone.length >= 10) {
                contacts.push({
                    list_id: listId,
                    name: name.substring(0, 100), // Limit length
                    phone: normalizedPhone
                });
            }
        }
    });
    return contacts;
};

export const importContactsFromPdf = async (userId: string, filePath: string, originalFilename: string) => {
    const pdf = require('pdf-parse');

    // 1. Create List
    const listName = originalFilename.replace(/\.[^/.]+$/, ""); // Remove extension
    const newList = await createList(userId, listName);

    // 2. Parse PDF
    const dataBuffer = fs.readFileSync(filePath);
    let contacts: any[] = [];

    try {
        const data = await pdf(dataBuffer);
        const text = data.text;

        // 3. Extract
        contacts = extractContactsFromText(text, newList.id);

        // 4. Insert
        if (contacts.length > 0) {
            const { error } = await supabase
                .from('contacts')
                .insert(contacts);

            if (error) {
                console.error("Failed to insert contacts:", error);
                throw new Error(error.message);
            }
        }
    } catch (e: any) {
        console.error("PDF Parsing error:", e);
        throw new Error("Falha ao processar arquivo PDF: " + e.message);
    } finally {
        // Clean up
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    return { list: newList, count: contacts.length };
};

export const importContactsFromCsv = async (userId: string, listId: string, filePath: string) => {
    // Verify list ownership
    const { data: list } = await supabase
        .from('contact_lists')
        .select('id')
        .eq('id', listId)
        .eq('user_id', userId)
        .single();

    if (!list) throw new Error('Contact list not found or access denied');

    const results: any[] = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    const contacts = results.map((row: any) => {
                        // Find name and phone regardless of case or slight variations
                        const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('nome'));
                        const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('tel') || k.toLowerCase().includes('cel'));

                        return {
                            list_id: listId,
                            name: (nameKey ? row[nameKey] : row.name || row.Name || 'Sem Nome').trim(),
                            phone: (phoneKey ? row[phoneKey] : row.phone || row.Phone || '').replace(/\D/g, '').trim()
                        };
                    }).filter(c => c.phone); // Filter out empty phones

                    if (contacts.length > 0) {
                        const { error } = await supabase
                            .from('contacts')
                            .insert(contacts);

                        if (error) throw new Error(error.message);
                    }

                    // Clean up file
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                    resolve({ count: contacts.length });
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => reject(error));
    });
};

export const importContactsFromExcel = async (userId: string, listId: string, filePath: string) => {
    const XLSX = require('xlsx');

    // Verify list ownership
    const { data: list } = await supabase
        .from('contact_lists')
        .select('id')
        .eq('id', listId)
        .eq('user_id', userId)
        .single();

    if (!list) throw new Error('Contact list not found or access denied');

    try {
        // Read Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Get first sheet
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process contacts
        const contacts = jsonData.map((row: any) => {
            // Find name and phone regardless of case or slight variations
            const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('nome'));
            const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('tel') || k.toLowerCase().includes('cel'));

            return {
                list_id: listId,
                name: (nameKey ? row[nameKey] : row.name || row.Name || 'Sem Nome').toString().trim(),
                phone: (phoneKey ? row[phoneKey] : row.phone || row.Phone || '').toString().replace(/\D/g, '').trim()
            };
        }).filter((c: any) => c.phone); // Filter out empty phones

        if (contacts.length > 0) {
            const { error } = await supabase
                .from('contacts')
                .insert(contacts);

            if (error) throw new Error(error.message);
        }

        // Clean up file
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        return { count: contacts.length };
    } catch (error: any) {
        // Clean up file on error
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw new Error('Falha ao processar arquivo Excel: ' + error.message);
    }
};

export const getChats = async (userId: string) => {
    // Fetch contacts that have interactions (status != 'New' or last_interaction_at is not null)
    // We might want to filter by user_id if contacts belong to user (via list)
    // For now, assuming all contacts are accessible or we filter by lists owned by user

    // Join with lists to check ownership if needed
    const { data, error } = await supabase
        .from('contacts')
        .select(`
            id, 
            name, 
            phone, 
            status, 
            last_interaction_at, 
            unread_count,
            contact_lists!inner(user_id)
        `)
        .eq('contact_lists.user_id', userId)
        .not('last_interaction_at', 'is', null)
        .order('last_interaction_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

export const getMessages = async (userId: string, contactId: string) => {
    // Verify contact ownership via list
    const { data: contact } = await supabase
        .from('contacts')
        .select('id, contact_lists!inner(user_id)')
        .eq('id', contactId)
        .eq('contact_lists.user_id', userId)
        .single();

    if (!contact) throw new Error('Contact not found or access denied');

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    // Mark as read
    await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('contact_id', contactId)
        .eq('is_read', false);

    await supabase
        .from('contacts')
        .update({ unread_count: 0 })
        .eq('id', contactId);

    return data;
};

export const getAllContacts = async (userId: string, filters?: any) => {
    let query = supabase
        .from('contacts')
        .select(`
            *,
            contact_lists!inner(user_id)
        `)
        .eq('contact_lists.user_id', userId);

    if (filters?.tag || filters?.listId) {
        query = query.eq('list_id', filters.tag || filters.listId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data.map(c => ({
        ...c,
        nome: c.name,
        telefone: c.phone,
        criadoEm: c.created_at
    }));
};

export const updateContact = async (userId: string, contactId: string, updates: any) => {
    // Verify ownership
    const { data: contact } = await supabase
        .from('contacts')
        .select('id, contact_lists!inner(user_id)')
        .eq('id', contactId)
        .eq('contact_lists.user_id', userId)
        .single();

    if (!contact) throw new Error('Contact not found or access denied');

    const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const deleteContact = async (userId: string, contactId: string) => {
    // Verify ownership
    const { data: contact } = await supabase
        .from('contacts')
        .select('id, contact_lists!inner(user_id)')
        .eq('id', contactId)
        .eq('contact_lists.user_id', userId)
        .single();

    if (!contact) throw new Error('Contact not found or access denied');

    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
};

export const deleteList = async (userId: string, listId: string) => {
    console.log(`[ContactService] Attempting to delete list ${listId} for user ${userId}`);

    // Verify ownership
    const { data: list, error: verifyError } = await supabase
        .from('contact_lists')
        .select('id')
        .eq('id', listId)
        .eq('user_id', userId)
        .single();

    if (verifyError || !list) {
        console.error('[ContactService] Verification failed:', verifyError?.message || 'List not found');
        throw new Error('Contact list not found or access denied');
    }

    // Delete contacts first (if not cascaded)
    console.log(`[ContactService] Deleting contacts for list ${listId}`);
    const { error: contactsError } = await supabase
        .from('contacts')
        .delete()
        .eq('list_id', listId);

    if (contactsError) {
        console.error('[ContactService] Error deleting contacts:', contactsError.message);
        throw new Error(`Erro ao excluir contatos: ${contactsError.message}`);
    }

    console.log(`[ContactService] Deleting list ${listId}`);
    const { error: listError } = await supabase
        .from('contact_lists')
        .delete()
        .eq('id', listId);

    if (listError) {
        console.error('[ContactService] Error deleting list:', listError.message);
        throw new Error(`Erro ao excluir lista: ${listError.message}`);
    }

    console.log(`[ContactService] List ${listId} deleted successfully`);
    return { success: true };
};

export const updateList = async (userId: string, listId: string, name: string) => {
    // Verify ownership
    const { data: list } = await supabase
        .from('contact_lists')
        .select('id')
        .eq('id', listId)
        .eq('user_id', userId)
        .single();

    if (!list) throw new Error('Contact list not found or access denied');

    const { data, error } = await supabase
        .from('contact_lists')
        .update({ name })
        .eq('id', listId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const getContactsCount = async (userId: string) => {
    const { count, error } = await supabase
        .from('contacts')
        .select(`
            *,
            contact_lists!inner(user_id)
        `, { count: 'exact', head: true })
        .eq('contact_lists.user_id', userId);

    if (error) {
        throw new Error(error.message);
    }

    return { count: count || 0 };
};
