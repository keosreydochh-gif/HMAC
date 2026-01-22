
import { User, AttendanceRecord, NetworkConfig, UserRole } from '../types.ts';
import { supabase } from './supabaseClient.ts';

export class DBService {
  static async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error('Supabase fetch error:', e);
      return [];
    }
  }

  static async saveUser(user: User): Promise<void> {
    const { error } = await supabase
      .from('users')
      .upsert(user);
    
    if (error) throw error;
  }

  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async getLogs(): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching logs:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      return [];
    }
  }

  static async addLog(log: AttendanceRecord): Promise<void> {
    const { error } = await supabase
      .from('attendance_logs')
      .insert(log);
    
    if (error) throw error;
  }

  static async getNetworkConfig(): Promise<NetworkConfig> {
    try {
      const { data, error } = await supabase
        .from('network_config')
        .select('*');
      
      if (error || !data || data.length === 0) {
        console.warn('Network config empty or missing:', error);
        return { whitelistedIps: [] };
      }
      
      // If data is an array, take the first row's whitelistedIps
      return { whitelistedIps: data[0].whitelistedIps || [] };
    } catch (error) {
      console.error('Failed to fetch network config:', error);
      return { whitelistedIps: [] };
    }
  }

  static async saveNetworkConfig(config: NetworkConfig): Promise<void> {
    // Attempt to upsert row with id 1
    const { error } = await supabase
      .from('network_config')
      .upsert({ id: 1, whitelistedIps: config.whitelistedIps });
    
    if (error) throw error;
  }
}
