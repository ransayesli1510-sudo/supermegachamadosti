/**
 * Supabase Database Helper Functions
 * Replaces GitHub JSON storage with proper Supabase database
 */

// --- Authentication Functions ---

async function signUp(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) throw error;

        // Create profile entry
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: data.user.id,
                email: email,
                full_name: fullName,
                role: 'user' // Default role
            }]);

        if (profileError) throw profileError;

        ErrorLogger.success('Cadastro realizado com sucesso!');
        return { success: true, user: data.user };
    } catch (error) {
        ErrorLogger.error('Erro ao cadastrar usuário', error);
        return { success: false, error: error.message };
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Get user profile with role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) throw profileError;

        // Auto-promote specific admin email
        if (profile.email === 'ransay@supermegavendas.com' && profile.role !== 'admin') {
            profile.role = 'admin';
            // Optionally update DB too, but we prioritize UI access first
            await supabase.from('profiles').update({ role: 'admin' }).eq('id', profile.id);
        }

        ErrorLogger.success('Login realizado com sucesso!');
        return { success: true, user: data.user, profile };
    } catch (error) {
        ErrorLogger.error('Erro ao fazer login', error);
        return { success: false, error: error.message };
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        ErrorLogger.success('Logout realizado com sucesso!');
        return { success: true };
    } catch (error) {
        ErrorLogger.error('Erro ao fazer logout', error);
        return { success: false, error: error.message };
    }
}

async function getCurrentUser() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!session) return null;

        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError) throw profileError;

        // Auto-promote specific admin email
        if (profile.email === 'ransay@supermegavendas.com' && profile.role !== 'admin') {
            profile.role = 'admin';
        }

        return { user: session.user, profile };
    } catch (error) {
        ErrorLogger.error('Erro ao obter usuário atual', error);
        return null;
    }
}

// --- Ticket Functions ---

async function createTicket(ticketData) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        const payload = {
            title: ticketData.category,
            description: ticketData.description,
            category: ticketData.category,
            department: ticketData.department,
            status: 'open',
            attachment_url: ticketData.attachment || null
        };

        // If user is logged in, associate the ticket
        if (user) {
            payload.created_by = user.id;
        }

        const { data, error } = await supabase
            .from('tickets')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        ErrorLogger.success('Chamado criado com sucesso!');
        return { success: true, ticket: data };
    } catch (error) {
        ErrorLogger.error('Erro ao criar chamado', error);
        return { success: false, error: error.message };
    }
}

async function getTickets() {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        // Base query
        let query = supabase
            .from('tickets')
            .select(`
                *,
                created_by_profile:profiles!tickets_created_by_fkey(full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (user) {
            // Get user profile to check role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            // If not admin, show own tickets
            if (profile && profile.role !== 'admin') {
                query = query.eq('created_by', user.id);
            }
        } else {
            // If NOT logged in, return empty but success (so UI doesn't show error)
            return { success: true, tickets: [] };
        }

        const { data, error } = await query;
        if (error) throw error;

        return { success: true, tickets: data };
    } catch (error) {
        ErrorLogger.error('Erro ao carregar chamados', error);
        return { success: false, error: error.message };
    }
}

async function updateTicketStatus(ticketId, newStatus) {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', ticketId)
            .select()
            .single();

        if (error) throw error;

        ErrorLogger.success(`Status atualizado para ${newStatus}`);
        return { success: true, ticket: data };
    } catch (error) {
        ErrorLogger.error('Erro ao atualizar status do chamado', error);
        return { success: false, error: error.message };
    }
}

async function deleteTicket(ticketId) {
    try {
        const { error } = await supabase
            .from('tickets')
            .delete()
            .eq('id', ticketId);

        if (error) throw error;

        ErrorLogger.success('Chamado deletado com sucesso!');
        return { success: true };
    } catch (error) {
        ErrorLogger.error('Erro ao deletar chamado', error);
        return { success: false, error: error.message };
    }
}

// --- Real-time Subscriptions ---

function subscribeToTickets(callback) {
    const channel = supabase
        .channel('tickets-changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'tickets'
        }, (payload) => {
            ErrorLogger.info('Atualização em tempo real recebida');
            callback(payload);
        })
        .subscribe();

    return channel;
}

function unsubscribeFromTickets(channel) {
    if (channel) {
        supabase.removeChannel(channel);
    }
}
