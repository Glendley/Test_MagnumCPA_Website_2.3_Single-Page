// ===== Magnum CPA — shared Supabase client + helpers =====
// Requires the supabase-js UMD bundle to be loaded first, e.g.:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="supabase.js"></script>
//
// The anon/public key is safe to ship in the browser — Row-Level Security
// (see supabase-schema.sql) is what actually protects the data.

const SUPABASE_URL = 'https://nnvqdmdrhruqlhellnyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udnFkbWRyaHJ1cWxoZWxsbnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NTc2MDksImV4cCI6MjA5ODEzMzYwOX0.4FTAyDAeDwPKYvQuCq0JaATC70IkMRvMgvbBN8-q8UE';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.sb = sb;

const Magnum = {
  // ----- auth -----
  async currentUser(){
    const { data } = await sb.auth.getUser();
    return data ? data.user : null;
  },
  async signUp(name, email, password){
    return await sb.auth.signUp({
      email, password,
      options: { data: { name: name || '' } }
    });
  },
  async signIn(email, password){
    return await sb.auth.signInWithPassword({ email, password });
  },
  async signOut(){ await sb.auth.signOut(); },

  // Redirect helpers — call at the top of a protected page.
  async requireClient(redirect){
    const u = await this.currentUser();
    if (!u){ location.href = redirect || 'client-portal.html'; throw new Error('no-auth'); }
    return u;
  },
  async requireAdmin(redirect){
    const u = await this.currentUser();
    if (!u){ location.href = redirect || 'admin-login.html'; throw new Error('no-auth'); }
    const { data } = await sb.from('profiles').select('role').eq('id', u.id).maybeSingle();
    if (!data || data.role !== 'admin'){ location.href = redirect || 'admin-login.html'; throw new Error('not-admin'); }
    return u;
  },

  // ----- profile -----
  async myProfile(){
    const u = await this.currentUser();
    if (!u) return null;
    const { data } = await sb.from('profiles').select('*').eq('id', u.id).maybeSingle();
    return data || { id: u.id, email: u.email };
  },
  async getProfile(userId){
    const { data } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data || {};
  },
  async saveProfile(userId, patch){
    return await sb.from('profiles').update(patch).eq('id', userId);
  },

  // ----- organizer -----
  async getOrganizer(userId){
    const { data } = await sb.from('organizer').select('data').eq('user_id', userId).maybeSingle();
    return (data && data.data) ? data.data : {};
  },
  async saveOrganizer(userId, dataObj){
    return await sb.from('organizer')
      .upsert({ user_id: userId, data: dataObj, updated_at: new Date().toISOString() },
              { onConflict: 'user_id' });
  },

  // ----- storage (uploaded files) -----
  // Path scheme: <user_id>/<field_id>/<filename>
  async uploadFile(userId, fieldId, file){
    const path = userId + '/' + fieldId + '/' + file.name;
    const { error } = await sb.storage.from('documents')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return { name: file.name, size: file.size, path: path };
  },
  async fileUrl(path){
    if (!path) return '#';
    const { data } = await sb.storage.from('documents').createSignedUrl(path, 3600);
    return data ? data.signedUrl : '#';
  },

  // ----- updates / meetings -----
  async getUpdates(userId){
    const { data } = await sb.from('updates').select('*')
      .eq('user_id', userId).order('created_at', { ascending: true });
    return data || [];
  },
  async addUpdate(userId, text, task){
    return await sb.from('updates').insert({ user_id: userId, text: text, task: task });
  },
  async deleteUpdate(id){ return await sb.from('updates').delete().eq('id', id); },

  async getMeetings(userId){
    const { data } = await sb.from('meetings').select('*')
      .eq('user_id', userId).order('created_at', { ascending: true });
    return data || [];
  },
  async addMeeting(userId, title, notes, drive){
    return await sb.from('meetings').insert({ user_id: userId, title: title, notes: notes, drive: drive });
  },
  async deleteMeeting(id){ return await sb.from('meetings').delete().eq('id', id); },

  // ----- chat -----
  async getChat(userId){
    const { data } = await sb.from('chat_messages').select('*')
      .eq('user_id', userId).order('created_at', { ascending: true });
    return data || [];
  },
  async sendChat(userId, sender, text){
    const { data } = await sb.from('chat_messages')
      .insert({ user_id: userId, sender: sender, text: text })
      .select().maybeSingle();
    return data;
  },

  // ----- notifications -----
  async getNotifications(userId, recipient){
    const { data } = await sb.from('notifications').select('*')
      .eq('user_id', userId).eq('recipient', recipient).order('created_at', { ascending: true });
    return data || [];
  },
  async getAdminNotifications(){
    const { data } = await sb.from('notifications').select('*')
      .eq('recipient', 'admin').order('created_at', { ascending: true });
    return data || [];
  },
  async addNotification(userId, recipient, text, type){
    return await sb.from('notifications')
      .insert({ user_id: userId, recipient: recipient, text: text, type: type || '' });
  },
  async markRead(ids){
    if (!ids || !ids.length) return;
    return await sb.from('notifications').update({ read: true }).in('id', ids);
  },

  // ----- reviews -----
  async getReviews(){
    const { data } = await sb.from('reviews').select('*').order('created_at', { ascending: true });
    return data || [];
  },
  async getApprovedReviews(){
    const { data } = await sb.from('reviews').select('*')
      .eq('approved', true).order('created_at', { ascending: true });
    return data || [];
  },
  async myReview(userId){
    const { data } = await sb.from('reviews').select('*').eq('user_id', userId).maybeSingle();
    return data || null;
  },
  async upsertReview(row){
    return await sb.from('reviews').upsert(row, { onConflict: 'user_id' });
  },
  async setReviewApproved(id, on){
    return await sb.from('reviews').update({ approved: on }).eq('id', id);
  },
  async deleteReview(id){ return await sb.from('reviews').delete().eq('id', id); }
};

window.Magnum = Magnum;
