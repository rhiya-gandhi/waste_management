import { createClient } from '@supabase/supabase-js';
import {
  Profile,
  WasteBatch,
  RecyclerFacility,
  AcceptedMaterial,
  CollectionRequest,
  HandoverRecord,
  WasteStatusHistory,
  UserRole,
  BatchStatus,
} from '../types/database.types';
import {
  DEMO_PROFILES,
  DEMO_RECYCLERS,
  DEMO_ACCEPTED_MATERIALS,
  DEMO_WASTE_BATCHES,
  DEMO_COLLECTION_REQUESTS,
  DEMO_STATUS_HISTORY,
} from './demoData';
import { validateStatusTransition } from './stateMachine';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-wasteroute.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isLiveSupabaseConfigured =
  supabaseUrl !== 'https://placeholder-wasteroute.supabase.co' &&
  supabaseAnonKey !== 'placeholder-anon-key' &&
  !supabaseUrl.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Local Storage Keys for offline / demo persistence
const STORAGE_KEYS = {
  PROFILES: 'wasteroute_profiles',
  RECYCLERS: 'wasteroute_recyclers',
  MATERIALS: 'wasteroute_materials',
  BATCHES: 'wasteroute_batches',
  COLLECTIONS: 'wasteroute_collections',
  HANDOVERS: 'wasteroute_handovers',
  HISTORY: 'wasteroute_history',
  CURRENT_USER: 'wasteroute_current_user',
};

// Initialize localStorage with seed demo data if not already present
function initLocalStorageData() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(DEMO_PROFILES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RECYCLERS)) {
    localStorage.setItem(STORAGE_KEYS.RECYCLERS, JSON.stringify(DEMO_RECYCLERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(DEMO_ACCEPTED_MATERIALS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BATCHES)) {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(DEMO_WASTE_BATCHES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COLLECTIONS)) {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(DEMO_COLLECTION_REQUESTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HANDOVERS)) {
    localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(DEMO_STATUS_HISTORY));
  }
}

initLocalStorageData();

// Helper to get array from storage
function getStored<T>(key: string, defaultVal: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

// Helper to save array to storage
function setStored<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage write error', err);
  }
}

// Data service layer combining Supabase live client with local fallback
export const DataService = {
  isLiveMode(): boolean {
    return isLiveSupabaseConfigured;
  },

  // PROFILES
  async getProfile(userId: string): Promise<Profile | null> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) return data as Profile;
    }
    const profiles = getStored<Profile>(STORAGE_KEYS.PROFILES, DEMO_PROFILES);
    return profiles.find((p) => p.id === userId) || null;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    }
    const profiles = getStored<Profile>(STORAGE_KEYS.PROFILES, DEMO_PROFILES);
    const index = profiles.findIndex((p) => p.id === userId);
    if (index === -1) throw new Error('Profile not found');
    const updated = { ...profiles[index], ...updates, updated_at: new Date().toISOString() };
    profiles[index] = updated;
    setStored(STORAGE_KEYS.PROFILES, profiles);
    return updated;
  },

  // WASTE BATCHES
  async getBatches(filter?: { generatorId?: string; status?: BatchStatus }): Promise<WasteBatch[]> {
    if (isLiveSupabaseConfigured) {
      let query = supabase.from('waste_batches').select('*').order('created_at', { ascending: false });
      if (filter?.generatorId) query = query.eq('generator_id', filter.generatorId);
      if (filter?.status) query = query.eq('status', filter.status);
      const { data, error } = await query;
      if (!error && data) return data as WasteBatch[];
    }
    let batches = getStored<WasteBatch>(STORAGE_KEYS.BATCHES, DEMO_WASTE_BATCHES);
    if (filter?.generatorId) batches = batches.filter((b) => b.generator_id === filter.generatorId);
    if (filter?.status) batches = batches.filter((b) => b.status === filter.status);
    return batches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getBatchById(id: string): Promise<WasteBatch | null> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase.from('waste_batches').select('*').eq('id', id).single();
      if (!error && data) return data as WasteBatch;
    }
    const batches = getStored<WasteBatch>(STORAGE_KEYS.BATCHES, DEMO_WASTE_BATCHES);
    return batches.find((b) => b.id === id) || null;
  },

  async createBatch(batchData: Omit<WasteBatch, 'id' | 'created_at' | 'updated_at'>): Promise<WasteBatch> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase.from('waste_batches').insert([batchData]).select().single();
      if (error) throw error;
      return data as WasteBatch;
    }
    const batches = getStored<WasteBatch>(STORAGE_KEYS.BATCHES, DEMO_WASTE_BATCHES);
    const newBatch: WasteBatch = {
      ...batchData,
      id: 'batch-' + Math.random().toString(36).substring(2, 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    batches.unshift(newBatch);
    setStored(STORAGE_KEYS.BATCHES, batches);

    // Add initial status history
    this.addStatusHistory({
      batch_id: newBatch.id,
      previous_status: null,
      new_status: newBatch.status,
      changed_by: newBatch.generator_id,
      role_at_change: 'generator',
      notes: 'Batch created',
    });

    return newBatch;
  },

  async updateBatchStatus(
    batchId: string,
    targetStatus: BatchStatus,
    actorId: string,
    actorRole: UserRole,
    notes?: string
  ): Promise<WasteBatch> {
    const current = await this.getBatchById(batchId);
    if (!current) throw new Error('Batch not found');

    const validation = validateStatusTransition(current.status, targetStatus, actorRole);
    if (!validation.allowed) {
      throw new Error(validation.reason || 'Transition not allowed');
    }

    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from('waste_batches')
        .update({ status: targetStatus, notes: notes || current.notes })
        .eq('id', batchId)
        .select()
        .single();
      if (error) throw error;
      return data as WasteBatch;
    }

    const batches = getStored<WasteBatch>(STORAGE_KEYS.BATCHES, DEMO_WASTE_BATCHES);
    const idx = batches.findIndex((b) => b.id === batchId);
    if (idx === -1) throw new Error('Batch not found');

    const previousStatus = batches[idx].status;
    batches[idx].status = targetStatus;
    if (notes) batches[idx].notes = notes;
    batches[idx].updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.BATCHES, batches);

    this.addStatusHistory({
      batch_id: batchId,
      previous_status: previousStatus,
      new_status: targetStatus,
      changed_by: actorId,
      role_at_change: actorRole,
      notes: notes || `Status changed from ${previousStatus} to ${targetStatus}`,
    });

    return batches[idx];
  },

  // RECYCLERS & RULES
  async getRecyclers(includeUnverified = false): Promise<RecyclerFacility[]> {
    if (isLiveSupabaseConfigured) {
      let query = supabase.from('recyclers').select('*, accepted_materials(*)');
      if (!includeUnverified) {
        query = query.eq('verification_status', 'verified').eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data) return data as RecyclerFacility[];
    }
    const recyclers = getStored<RecyclerFacility>(STORAGE_KEYS.RECYCLERS, DEMO_RECYCLERS);
    const materials = getStored<AcceptedMaterial>(STORAGE_KEYS.MATERIALS, DEMO_ACCEPTED_MATERIALS);

    const enriched = recyclers.map((r) => ({
      ...r,
      accepted_materials: materials.filter((m) => m.recycler_id === r.id),
    }));

    if (includeUnverified) return enriched;
    return enriched.filter((r) => r.verification_status === 'verified' && r.is_active);
  },

  async getRecyclerByUserId(userId: string): Promise<RecyclerFacility | null> {
    const list = await this.getRecyclers(true);
    return list.find((r) => r.user_id === userId) || null;
  },

  async updateRecyclerVerification(
    recyclerId: string,
    status: 'verified' | 'rejected',
    adminId: string,
    notes: string
  ): Promise<RecyclerFacility> {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from('recyclers')
        .update({
          verification_status: status,
          verified_by: adminId,
          verified_at: new Date().toISOString(),
          verification_notes: notes,
        })
        .eq('id', recyclerId)
        .select()
        .single();
      if (error) throw error;
      return data as RecyclerFacility;
    }

    const recyclers = getStored<RecyclerFacility>(STORAGE_KEYS.RECYCLERS, DEMO_RECYCLERS);
    const idx = recyclers.findIndex((r) => r.id === recyclerId);
    if (idx === -1) throw new Error('Recycler not found');

    recyclers[idx] = {
      ...recyclers[idx],
      verification_status: status,
      verified_by: adminId,
      verified_at: new Date().toISOString(),
      verification_notes: notes,
      updated_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.RECYCLERS, recyclers);
    return recyclers[idx];
  },

  async saveAcceptedMaterial(rule: Omit<AcceptedMaterial, 'id' | 'created_at'>): Promise<AcceptedMaterial> {
    const materials = getStored<AcceptedMaterial>(STORAGE_KEYS.MATERIALS, DEMO_ACCEPTED_MATERIALS);
    const newRule: AcceptedMaterial = {
      ...rule,
      id: 'mat-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    materials.push(newRule);
    setStored(STORAGE_KEYS.MATERIALS, materials);
    return newRule;
  },

  // COLLECTION REQUESTS
  async getCollectionRequests(filter?: { collectorId?: string; recyclerId?: string }): Promise<CollectionRequest[]> {
    const requests = getStored<CollectionRequest>(STORAGE_KEYS.COLLECTIONS, DEMO_COLLECTION_REQUESTS);
    const batches = await this.getBatches();
    const recyclers = await this.getRecyclers(true);

    return requests
      .filter((cr) => {
        if (filter?.collectorId && cr.collector_id !== filter.collectorId) return false;
        if (filter?.recyclerId && cr.recycler_id !== filter.recyclerId) return false;
        return true;
      })
      .map((cr) => ({
        ...cr,
        batch: batches.find((b) => b.id === cr.batch_id),
        recycler: recyclers.find((r) => r.id === cr.recycler_id),
      }));
  },

  async createCollectionRequest(data: {
    batch_id: string;
    recycler_id: string;
    collector_id?: string;
  }): Promise<CollectionRequest> {
    const requests = getStored<CollectionRequest>(STORAGE_KEYS.COLLECTIONS, DEMO_COLLECTION_REQUESTS);
    const newReq: CollectionRequest = {
      id: 'cr-' + Math.random().toString(36).substring(2, 9),
      batch_id: data.batch_id,
      recycler_id: data.recycler_id,
      collector_id: data.collector_id || null,
      status: 'requested',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    requests.push(newReq);
    setStored(STORAGE_KEYS.COLLECTIONS, requests);
    return newReq;
  },

  async acceptCollectionAssignment(requestId: string, collectorId: string): Promise<CollectionRequest> {
    const requests = getStored<CollectionRequest>(STORAGE_KEYS.COLLECTIONS, DEMO_COLLECTION_REQUESTS);
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error('Collection request not found');

    requests[idx].collector_id = collectorId;
    requests[idx].status = 'accepted';
    requests[idx].updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.COLLECTIONS, requests);

    // Update batch status to assigned
    await this.updateBatchStatus(
      requests[idx].batch_id,
      'assigned',
      collectorId,
      'collector',
      'Collector accepted dispatch job'
    );

    return requests[idx];
  },

  // HANDOVER RECORDS
  async confirmHandover(record: Omit<HandoverRecord, 'id' | 'confirmed_at' | 'created_at'>): Promise<HandoverRecord> {
    const handovers = getStored<HandoverRecord>(STORAGE_KEYS.HANDOVERS, []);
    const newRecord: HandoverRecord = {
      ...record,
      id: 'hnd-' + Math.random().toString(36).substring(2, 9),
      confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    handovers.push(newRecord);
    setStored(STORAGE_KEYS.HANDOVERS, handovers);

    // Update batch status to confirmed
    await this.updateBatchStatus(
      record.batch_id,
      'confirmed',
      record.recycler_id,
      'recycler',
      `Recycler confirmed handover of ${record.received_quantity} ${record.quantity_unit}. Quality accepted: ${record.quality_accepted}`
    );

    return newRecord;
  },

  // STATUS HISTORY (AUDIT TRAIL)
  async getStatusHistory(batchId: string): Promise<WasteStatusHistory[]> {
    const history = getStored<WasteStatusHistory>(STORAGE_KEYS.HISTORY, DEMO_STATUS_HISTORY);
    return history
      .filter((h) => h.batch_id === batchId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  addStatusHistory(item: Omit<WasteStatusHistory, 'id' | 'created_at'>): void {
    const history = getStored<WasteStatusHistory>(STORAGE_KEYS.HISTORY, DEMO_STATUS_HISTORY);
    const newEntry: WasteStatusHistory = {
      ...item,
      id: 'hist-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    history.push(newEntry);
    setStored(STORAGE_KEYS.HISTORY, history);
  },
};
