import { supabase } from '@/lib/supabase/client';

/**
 * Simple in-memory store for development/testing use
 * Used when Supabase is not available
 */
class LocalStorage {
  private static storage: Record<string, any[]> = {};

  static getTable(name: string): any[] {
    if (!this.storage[name]) {
      this.storage[name] = [];
    }
    return this.storage[name];
  }

  static insert(table: string, data: any): any {
    const id = data.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const item = { ...data, id };
    this.getTable(table).push(item);
    return item;
  }

  static update(table: string, id: string, data: any): boolean {
    const items = this.getTable(table);
    const index = items.findIndex(item => item.id === id);
    if (index >= 0) {
      items[index] = { ...items[index], ...data };
      return true;
    }
    return false;
  }

  static delete(table: string, id: string): boolean {
    const items = this.getTable(table);
    const index = items.findIndex(item => item.id === id);
    if (index >= 0) {
      items.splice(index, 1);
      return true;
    }
    return false;
  }

  static query(table: string, conditions: Record<string, any> = {}): any[] {
    const items = this.getTable(table);
    return items.filter(item => {
      return Object.entries(conditions).every(([key, value]) => item[key] === value);
    });
  }
}

/**
 * Database class that provides access to SQL operations
 * Uses Supabase for cloud data and falls back to local storage when unavailable
 */
export class Database {
  private static instance: Database | null = null;

  private constructor() {
    // Initialize connection
  }

  /**
   * Get singleton instance of the database
   */
  public static async getInstance(): Promise<Database> {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Execute a SQL query with parameters.
   * Attempts to use Supabase client methods for simple SELECT/UPDATE/INSERT.
   * Falls back to local execution if Supabase is unavailable or query is complex.
   */
  public async executeSql(
    query: string,
    params: any[] = []
  ): Promise<{ rows: any[]; rowCount: number }> {
    const start = Date.now();
    const queryTrimmed = query.trim();
    const queryType = queryTrimmed.split(' ')[0].toUpperCase();
    
    console.log(`Attempting SQL ${queryType}:`, { 
      query: queryTrimmed.substring(0, 200) + (queryTrimmed.length > 200 ? '...' : ''),
      params 
    });

    // If Supabase is available, try to use its client methods first
    if (supabase) {
      try {
        // --- Handle SELECT --- (Basic: SELECT ... FROM table WHERE col1 = ? AND col2 = ? LIMIT ?)
        if (queryType === 'SELECT') {
          const tableMatch = queryTrimmed.match(/FROM\s+([\w_]+)/i);
          // Ensure tableMatch is not null before accessing [1]
          if (!tableMatch || !tableMatch[1]) {
            console.warn('Could not parse table name from SELECT query:', queryTrimmed);
            return { rows: [], rowCount: 0 };
          }
          const tableName = tableMatch[1];
          
          let queryBuilder = supabase.from(tableName).select('*');
          
          const whereMatch = queryTrimmed.match(/WHERE\s+(.+?)(?:LIMIT|$)/i);
          // Check if whereMatch exists and has a capture group
          if (whereMatch && whereMatch[1]) {
            const conditions = whereMatch[1].split(/\s+AND\s+/i);
            const limitMatch = queryTrimmed.match(/LIMIT\s+(\d+)/i); // Check limitMatch inside here
            
            // Adjust parameter count check based on whether LIMIT exists
            const expectedParams = limitMatch ? conditions.length + 1 : conditions.length;
            if (conditions.length > 0 && params.length >= conditions.length) { // Ensure enough params for conditions
              conditions.forEach((condition, index) => {
                const parts = condition.match(/([\w_]+)\s*=\s*\?/i);
                if (parts && parts[1] && index < params.length) { // Check parts and index bounds
                  queryBuilder = queryBuilder.eq(parts[1], params[index]);
                } else {
                   console.warn('Could not parse condition or param missing:', condition);
                   // Decide: throw error or ignore condition?
                   // For now, let's ignore potentially malformed conditions
                }
              });
            } else if (conditions.length > 0) {
               // Throw error only if WHERE clause exists but params don't match
               throw new Error('Parameter count mismatch for WHERE clause');
            }
          }
          
          const limitMatch = queryTrimmed.match(/LIMIT\s+(\d+)/i); // Check limitMatch again for applying limit
          if (limitMatch && limitMatch[1]) {
            queryBuilder = queryBuilder.limit(parseInt(limitMatch[1], 10));
          }
          
          const { data, error, count } = await queryBuilder;
           
          if (error) throw error;
          const end = Date.now();
          console.log(`Supabase SELECT completed in ${end - start}ms, returned ${data?.length || 0} rows`);
          return { rows: data || [], rowCount: data?.length || 0 };
        }
        
        // --- Handle UPDATE --- (Basic: UPDATE table SET col1 = ?, col2 = ? WHERE id = ?)
        if (queryType === 'UPDATE') {
            const tableMatch = queryTrimmed.match(/^UPDATE\s+([\w_]+)/i);
            const setMatch = queryTrimmed.match(/SET\s+(.+?)\s+WHERE/i);
            const whereMatch = queryTrimmed.match(/WHERE\s+([\w_]+)\s*=\s*\?/i); 
            
            // Ensure all matches are valid before proceeding
            if (!tableMatch || !tableMatch[1] || !setMatch || !setMatch[1] || !whereMatch || !whereMatch[1] || params.length === 0) {
                console.warn('Could not parse UPDATE query structure or missing params:', queryTrimmed);
                return { rows: [], rowCount: 0 };
            }
            
            const tableName = tableMatch[1];
            const idColumn = whereMatch[1];
            const idValue = params[params.length - 1]; 
            const setData: Record<string, any> = {};
            const setClauses = setMatch[1].split(',').map(s => s.trim());
               
            if (setClauses.length !== params.length - 1) {
                 throw new Error('Parameter count mismatch for UPDATE SET clause');
            }
            
            setClauses.forEach((clause, index) => {
                const parts = clause.match(/([\w_]+)\s*=\s*\?/i);
                // Ensure parts match is valid before accessing [1]
                if (parts && parts[1]) {
                    setData[parts[1]] = params[index];
                } else {
                    console.warn('Could not parse SET clause part:', clause);
                    // Decide: throw or ignore? Throwing seems safer for UPDATE.
                    throw new Error(`Could not parse SET clause part: ${clause}`);
                }
            });
            
            if (!setData.hasOwnProperty('updated_at')) {
                setData['updated_at'] = new Date().toISOString();
            }
            
            const { data, error, count } = await supabase
                .from(tableName)
                .update(setData)
                .eq(idColumn, idValue);
                        
            if (error) throw error;
            const end = Date.now();
            console.log(`Supabase UPDATE completed in ${end - start}ms, matched count: ${count ?? 'unknown'}`);
            return { rows: [], rowCount: count ?? 0 };
        }
        
        // --- Handle INSERT --- (Basic: INSERT INTO table (col1, col2) VALUES (?, ?))
        // This is less likely needed for executeSql, use db.insert() instead.
        // Add basic parsing here if required later.

        // --- Fallback for complex queries or if parsing fails ---
        console.warn(`Query did not match simple patterns, cannot execute directly via client: ${queryTrimmed}`);
        return { rows: [], rowCount: 0 };

      } catch (error) {
        const end = Date.now();
        console.error(`Supabase client execution Error (${end - start}ms):`, { error, query: queryTrimmed, params });
        // Don't fall back to local execution on Supabase error, just throw
        throw error;
      }
    } else {
      // Fall back to local execution if Supabase client is not available
      console.log('Supabase not available, falling back to local execution');
      try {
        return this.executeSqlLocally(queryTrimmed, params);
      } catch (localError) {
        console.error('Local execution failed:', localError);
        throw localError; // Re-throw the local execution error
      }
    }
  }

  /**
   * Simplified local SQL execution for basic operations
   * Only supports very basic SQL operations as a fallback
   */
  private executeSqlLocally(
    query: string,
    params: any[] = []
  ): { rows: any[]; rowCount: number } {
    try {
      const queryLower = query.toLowerCase().trim();
      
      if (queryLower.startsWith('select')) {
        const tableMatch = query.match(/from\s+([\w_]+)/i);
        if (!tableMatch || !tableMatch[1]) {
          console.warn('[Local] Could not parse table name from SELECT query:', query);
          return { rows: [], rowCount: 0 };
        }
        const tableName = tableMatch[1];
        
        let conditions: Record<string, any> = {};
        if (queryLower.includes('where')) {
          const wherePartMatch = query.match(/where\s+(.+)/i);
          if (wherePartMatch && wherePartMatch[1]) {
            const whereConditions = wherePartMatch[1].split('and').map(c => c.trim());
            
            whereConditions.forEach((condition, index) => {
              const parts = condition.split('=');
              if (parts.length === 2 && parts[1]?.trim() === '?') {
                const column = parts[0]?.trim();
                if (column && index < params.length) {
                  conditions[column] = params[index];
                } else {
                  console.warn('[Local] Could not parse condition or param missing:', condition);
                }
              }
            });
          }
        }
        
        const results = LocalStorage.query(tableName, conditions);
        return { rows: results, rowCount: results.length };
      }
      
      else if (queryLower.startsWith('insert')) {
        const tableMatch = query.match(/into\s+([\w_]+)/i);
        if (!tableMatch || !tableMatch[1]) {
          console.warn('[Local] Could not parse table name from INSERT query:', query);
          return { rows: [], rowCount: 0 };
        }
        const tableName = tableMatch[1];
        
        const columnsMatch = query.match(/\(([^)]+)\)/);
        if (!columnsMatch || !columnsMatch[1]) {
          console.warn('[Local] Could not parse columns from INSERT query:', query);
          return { rows: [], rowCount: 0 };
        }
        const columns = columnsMatch[1].split(',').map(c => c.trim());
        
        if (columns.length !== params.length) {
           console.warn('[Local] Param count mismatch for INSERT query:', query, params);
           return { rows: [], rowCount: 0 }; 
        }
        const data: Record<string, any> = {};
        columns.forEach((col, index) => {
          data[col] = params[index];
        });
        
        const inserted = LocalStorage.insert(tableName, data);
        return { rows: [inserted], rowCount: 1 };
      }
      
      else if (queryLower.startsWith('update')) {
        const tableMatch = query.match(/update\s+([\w_]+)/i);
        if (!tableMatch || !tableMatch[1]) {
          console.warn('[Local] Could not parse table name from UPDATE query:', query);
          return { rows: [], rowCount: 0 };
        }
        const tableName = tableMatch[1];
        
        const setMatch = query.match(/set\s+(.+?)\s+where/i);
        if (!setMatch || !setMatch[1]) {
          console.warn('[Local] Could not parse SET clause from UPDATE query:', query);
          return { rows: [], rowCount: 0 };
        }
        const setClauses = setMatch[1].split(',').map(c => c.trim());
        
        const whereMatch = query.match(/where\s+([\w_]+)\s*=\s*\?/i);
        if (!whereMatch || !whereMatch[1]) {
          console.warn('[Local] Could not parse WHERE clause from UPDATE query (expected id = ?):', query);
          return { rows: [], rowCount: 0 };
        }
        const idColumn = whereMatch[1];
        
        if (setClauses.length !== params.length - 1) {
            console.warn('[Local] Param count mismatch for UPDATE query:', query, params);
            return { rows: [], rowCount: 0 };
        }
        
        const updateData: Record<string, any> = {};
        setClauses.forEach((clause, index) => {
          const parts = clause.split('=');
          if (parts.length === 2 && parts[1]?.trim() === '?') {
            const column = parts[0]?.trim();
            if (column) {
              updateData[column] = params[index];
            } else {
              console.warn('[Local] Could not parse SET column:', clause);
            }
          }
        });
        
        const idValue = params[params.length - 1];
        const updated = LocalStorage.update(tableName, idValue, updateData);
        return { rows: [], rowCount: updated ? 1 : 0 };
      }
      
      console.warn('[Local] Unsupported query type:', query);
      return { rows: [], rowCount: 0 };
    } catch (error) {
      console.error('Error in local SQL execution:', error);
      return { rows: [], rowCount: 0 };
    }
  }

  /**
   * Insert a record and return the inserted row
   */
  public async insert(
    table: string,
    values: Record<string, any>
  ): Promise<any | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from(table)
          .insert(values)
          .select()
          .single();

        if (error) {
          console.error(`Error inserting into ${table}:`, error);
          return LocalStorage.insert(table, values);
        }

        return data;
      } else {
        return LocalStorage.insert(table, values);
      }
    } catch (error) {
      console.error(`Failed to insert into ${table}:`, error);
      return LocalStorage.insert(table, values);
    }
  }

  /**
   * Update a record by ID
   */
  public async update(
    table: string,
    id: string,
    values: Record<string, any>
  ): Promise<boolean> {
    try {
      if (supabase) {
        const { error } = await supabase
          .from(table)
          .update({ ...values, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          console.error(`Error updating ${table}:`, error);
          return LocalStorage.update(table, id, values);
        }
        return true;
      } else {
        return LocalStorage.update(table, id, values);
      }
    } catch (error) {
      console.error(`Failed to update ${table}:`, error);
      return LocalStorage.update(table, id, values);
    }
  }

  /**
   * Delete a record by ID
   */
  public async delete(table: string, id: string): Promise<boolean> {
    try {
      if (supabase) {
        const { error } = await supabase.from(table).delete().eq('id', id);

        if (error) {
          console.error(`Error deleting from ${table}:`, error);
          return LocalStorage.delete(table, id);
        }
        return true;
      } else {
        return LocalStorage.delete(table, id);
      }
    } catch (error) {
      console.error(`Failed to delete from ${table}:`, error);
      return LocalStorage.delete(table, id);
    }
  }

  /**
   * Get a record by ID
   */
  public async getById(
    table: string,
    id: string
  ): Promise<any | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error(`Error getting ${table} by ID:`, error);
          const localResults = LocalStorage.query(table, { id });
          return localResults.length > 0 ? localResults[0] : null;
        }
        return data;
      } else {
        const localResults = LocalStorage.query(table, { id });
        return localResults.length > 0 ? localResults[0] : null;
      }
    } catch (error) {
      console.error(`Failed to get ${table} by ID:`, error);
      const localResults = LocalStorage.query(table, { id });
      return localResults.length > 0 ? localResults[0] : null;
    }
  }
} 