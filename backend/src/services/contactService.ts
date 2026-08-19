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

export const getListsWithCounts = async (userId: string): Promise<Array<{ id: string; name: string; leadCount: number }>> => {
    const { data: lists, error } = await supabase
        .from('contact_lists')
        .select('id, name')
        .eq('user_id', userId);

    if (error) {
        throw new Error(error.message);
    }

    if (!lists || lists.length === 0) return [];

    const withCounts = await Promise.all(
        lists.map(async (list) => {
            const { count } = await supabase
                .from('contacts')
                .select('*', { count: 'exact', head: true })
                .eq('list_id', list.id);
            return { id: list.id, name: list.name, leadCount: count ?? 0 };
        })
    );

    return withCounts;
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

// Regex for Brazilian Phone Numbers (tolerates space between DDD and the mobile "9")
const PHONE_REGEX = /(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\s?\d|[2-9])\d{3})[-.\s]?(\d{4}))/g;

const isMobile = (m: RegExpMatchArray) => (m[3] || '').replace(/\s/g, '').startsWith('9');
const normalizePhone = (m: RegExpMatchArray) => `55${m[2] || ''}${m[3] || ''}${m[4]}`.replace(/\D/g, '');

// Insert a line break before labels glued to the previous value (ex: "65Cel.:" -> "65\nCel.:")
const LABEL_BREAK_RE = /([^\n])(?=(?:CPF|CNPJ|C\.?P\.?F|Cel(?:ular)?\.?|Tel(?:efone)?\.?|Fone\.?|Email|E-mail|Nome|Telefone|Celular|Endere[çc]o|Bairro|Cidade|CEP|Unidade|Bloco|Torre)\s*[:.])/gi;

const FIELD_PATTERNS: Array<{ key: 'nome' | 'cpf' | 'cel' | 'tel' | 'email' | 'outro'; re: RegExp }> = [
    { key: 'nome', re: /^(?:nome\s+(?:do\s+)?(?:propriet[áa]rio|cond[óo]mino)|nome|propriet[áa]rio|cond[óo]mino|cliente|respons[áa]vel)\s*[:.-]*\s*/i },
    { key: 'cpf', re: /^(?:cpf|cnpj|c\.?p\.?f\.?|cpf\s*\/?\s*cnpj)\s*[:.-]*\s*/i },
    { key: 'cel', re: /^(?:cel(?:ular)?|whatsapp|wpp)\s*[:.-]*\s*/i },
    { key: 'tel', re: /^(?:tel(?:efone)?|fone|fixo)\s*[:.-]*\s*/i },
    { key: 'email', re: /^(?:e-?mail|email)\s*[:.-]*\s*/i },
    { key: 'outro', re: /^(?:endere[çc]o|bairro|cidade|cep|unidade|apto|apartamento|bloco|torre|andar|vaga|nascimento|data\s+de)/i },
];

const cleanName = (raw: string) => {
    if (!raw) return '';
    let n = raw
        .replace(/\s+/g, ' ')
        .replace(/\S+@\S+/g, ' ')
        .replace(/\b(?:cpf|cnpj|c\.?p\.?f\.?)\s*[:.]*\s*[\d.\-/]{8,}/gi, ' ')
        .replace(/\b(?:cel(?:ular)?|tel(?:efone)?|fone|wpp|whatsapp)\s*[:.]*\s*\(?\d[\d\s().\-]{7,}\)?/gi, ' ')
        .replace(/\b(?:q\s?\d+|l\s?\d+|qd\.?\s?\d+|lt\.?\s?\d+|lote\s?\d+|quadra\s?\d+|bloco\s?\d+|apto?\s?\d+|ap\s?\d+|torre\s?\d+|unidade\s?\d+)\b/gi, ' ')
        .replace(/\b(?:nome|propriet[áa]rio|cond[óo]mino|cliente|respons[áa]vel)\s*[:.]*\s*/gi, ' ')
        .replace(/\b(?:endere[çc]o|bairro|cidade|cep|unidade|apto|apartamento|bloco|torre|andar|vaga)\s*[:.]*\s*/gi, ' ')
        .replace(/[^A-Za-zÀ-ÿ0-9\s.'’]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return n.replace(/^[-:;|•\s]+|[-:;|•\s]+$/g, '').trim();
};

// Helper to extract contacts from text
const extractContactsFromText = (text: string, listId: string) => {
    let normalized = text.replace(/\r/g, '\n');
    normalized = normalized.replace(LABEL_BREAK_RE, '$1\n');

    const lines = normalized.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    const contacts: any[] = [];
    const seenPhones = new Set();

    const addContact = (name: string, phone: string) => {
        const clean = cleanName(name);
        const finalName = (clean.length > 1 ? clean : 'Contato Importado (PDF)').substring(0, 100);
        if (phone.length >= 10 && !seenPhones.has(phone)) {
            seenPhones.add(phone);
            contacts.push({ list_id: listId, name: finalName, phone });
        }
    };

    const hasAnyLabel = lines.some(line => FIELD_PATTERNS.some(f => f.re.test(line)));

    // Fallback: no labels found — extract per line, preferring mobile numbers
    if (!hasAnyLabel) {
        for (const line of lines) {
            const matches = [...line.matchAll(PHONE_REGEX)];
            if (matches.length === 0) continue;
            const best = matches.sort((a, b) => (isMobile(b) ? 1 : 0) - (isMobile(a) ? 1 : 0))[0];
            const normalizedPhone = normalizePhone(best);
            addContact(line.replace(best[0], ''), normalizedPhone);
        }
        return contacts;
    }

    // Labeled records — group lines that belong to the same person
    let current: any = null;
    const finalize = () => {
        if (!current) return;
        const phone = current.cel || current.tel || '';
        addContact(current.name || '', phone);
        current = null;
    };

    for (const line of lines) {
        let matched = false;

        for (const f of FIELD_PATTERNS) {
            const m = line.match(f.re);
            if (!m) continue;
            matched = true;
            const value = line.slice(m[0].length).trim();

            if (f.key === 'nome') {
                if (current && current.name && (current.cel || current.tel)) finalize();
                if (!current) current = {};
                current.name = (current.name ? current.name + ' ' : '') + value;
            } else if (f.key === 'cpf') {
                if (current && current.cpf && current.name && (current.cel || current.tel)) finalize();
                if (!current) current = {};
                current.cpf = value.replace(/\D/g, '');
            } else if (f.key === 'cel' || f.key === 'tel') {
                const field = f.key;
                const phones = [...value.matchAll(PHONE_REGEX)];
                const normalized = phones.length > 0 ? normalizePhone(phones[0]) : value.replace(/\D/g, '');
                if (current && current[field] && current.name) finalize();
                if (!current) current = {};
                if (!current[field]) current[field] = normalized;
            } else if (f.key === 'email') {
                if (!current) current = {};
            } else {
                // 'outro' — ignore
            }
            break;
        }

        if (!matched) {
            // Unlabeled line — could be the person's name or a phone by itself
            const linePhones = [...line.matchAll(PHONE_REGEX)];
            const isJustPhone = linePhones.length > 0 && line.replace(PHONE_REGEX, '').trim().length < 4;

            if (isJustPhone) {
                if (!current) current = {};
                if (!current.cel && linePhones.some(p => isMobile(p))) current.cel = normalizePhone(linePhones.find(p => isMobile(p))!);
                else if (!current.tel) current.tel = normalizePhone(linePhones[0]);
            } else if (!current) {
                // A line before the first labeled record that has no phone and is a title/header — skip it
                const looksLikeHeader = /^[A-ZÀ-ÖØ-Ý0-9\s.,/()'"-]+$/.test(line) && linePhones.length === 0;
                if (!looksLikeHeader) current = { name: line };
            } else if (!current.name) {
                current.name = line;
            } else if (current.cel || current.tel) {
                finalize();
                current = { name: line };
            } else {
                current.name = (current.name + ' ' + line).trim();
            }
        }
    }
    finalize();

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
        // Rebuild the text preserving table columns (pdf-parse's data.text
        // glues columns together without spaces, e.g. "2TALLITA" or "311PORTO").
        const text = await extractPdfTextWithLayout(dataBuffer, pdf);

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

// Rebuilds PDF text using each text item's coordinates so that table columns
// are separated by spaces instead of being glued together.
const extractPdfTextWithLayout = async (dataBuffer: Buffer, pdf: any) => {
    let text = '';

    const renderPage = (pageData: any) => {
        const renderOptions = {
            normalizeWhitespace: false,
            disableCombineTextItems: false
        };

        return pageData.getTextContent(renderOptions).then((textContent: any) => {
            // Collect items with x/y coordinates
            const items = textContent.items
                .filter((item: any) => item.str && item.str.trim().length > 0)
                .map((item: any) => ({
                    x: item.transform[4],
                    y: item.transform[5],
                    str: item.str
                }));

            // Group into rows by y (tolerance of 2 units)
            const rows: any[][] = [];
            for (const item of items) {
                const row = rows.find(r => Math.abs(r[0].y - item.y) < 2);
                if (row) row.push(item);
                else rows.push([item]);
            }

            const lines = rows
                .map((row) => {
                    // Sort left to right
                    row.sort((a, b) => a.x - b.x);

                    let line = '';
                    let prevEndX = -Infinity;
                    for (const item of row) {
                        if (line && item.x - prevEndX > 2) line += ' ';
                        line += item.str;
                        prevEndX = item.x + (item.str.length * 4); // approximate char width
                    }
                    return line;
                })
                .join('\n');

            text += (text ? '\n' : '') + lines;
            return lines;
        });
    };

    const result = await pdf(dataBuffer, {
        pagerender: renderPage,
        version: 'default'
    });

    return text || result.text || '';
};

export const importContactsFromCsv = async (userId: string, filePath: string, originalFilename: string) => {
    // Create List from filename
    const listName = originalFilename.replace(/\.[^/.]+$/, ""); // Remove extension
    const newList = await createList(userId, listName);

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
                            list_id: newList.id,
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

                    resolve({ list: newList, count: contacts.length });
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => reject(error));
    });
};

export const importContactsFromExcel = async (userId: string, filePath: string, originalFilename: string) => {
    const XLSX = require('xlsx');

    // Create List from filename
    const listName = originalFilename.replace(/\.[^/.]+$/, ""); // Remove extension
    const newList = await createList(userId, listName);

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
                list_id: newList.id,
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

        return { list: newList, count: contacts.length };
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

export const findContacts = async (userId: string, query: string, limit: number = 5) => {
    const normalizedPhone = query.replace(/\D/g, '');
    let q = supabase
        .from('contacts')
        .select('id, name, phone, status, last_interaction_at, list_id, contact_lists!inner(user_id, name)')
        .eq('contact_lists.user_id', userId)
        .limit(limit);

    q = normalizedPhone.length >= 6
        ? q.ilike('phone', `%${normalizedPhone}%`)
        : q.ilike('name', `%${query}%`);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        status: c.status,
        lastInteractionAt: c.last_interaction_at,
        listName: c.contact_lists?.name,
    }));
};

// Agrupa contatos do usuário por telefone normalizado e retorna só os grupos com duplicidade.
export const findDuplicateContacts = async (userId: string) => {
    const { data, error } = await supabase
        .from('contacts')
        .select('id, name, phone, list_id, created_at, contact_lists!inner(user_id, name)')
        .eq('contact_lists.user_id', userId);

    if (error) throw new Error(error.message);

    const groups = new Map<string, any[]>();
    for (const c of data || []) {
        const key = (c.phone || '').replace(/\D/g, '');
        if (!key) continue;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(c);
    }

    return Array.from(groups.entries())
        .filter(([, contacts]) => contacts.length > 1)
        .map(([phone, contacts]) => ({
            phone,
            contacts: contacts
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((c: any) => ({ id: c.id, name: c.name, listName: c.contact_lists?.name })),
        }));
};

// Mantém o contato mais antigo de cada grupo duplicado e apaga os demais.
// Não recebe IDs do cliente — recalcula os grupos no servidor pra evitar apagar contato errado.
export const mergeDuplicateContacts = async (userId: string) => {
    const groups = await findDuplicateContacts(userId);
    let mergedGroups = 0;
    let removedContacts = 0;

    for (const group of groups) {
        const [, ...toRemove] = group.contacts;
        if (toRemove.length === 0) continue;

        const { error } = await supabase
            .from('contacts')
            .delete()
            .in('id', toRemove.map((c: any) => c.id));

        if (error) throw new Error(error.message);
        mergedGroups += 1;
        removedContacts += toRemove.length;
    }

    return { mergedGroups, removedContacts };
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
