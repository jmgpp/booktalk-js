'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function DebugPage() {
  const { user, profile, loading } = useAuth();
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});
  const [dbStatus, setDbStatus] = useState<string>('Checking...');
  const [profileStatus, setProfileStatus] = useState<string>('Checking...');
  const [schemaInfo, setSchemaInfo] = useState<any[] | null>(null);

  useEffect(() => {
    // Check environment variables
    const checkEnv = async () => {
      const envVars = {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      };
      setEnvStatus(envVars);
    };

    // Check database connection
    const checkDB = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
          setDbStatus(`Error: ${error.message}`);
        } else {
          setDbStatus('Connected successfully');
        }
      } catch (err) {
        setDbStatus(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    // Check schema
    const checkSchema = async () => {
      try {
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('table_name, column_name, data_type, is_nullable')
          .eq('table_schema', 'public')
          .in('table_name', ['profiles']);

        if (error) {
          console.error('Schema error:', error);
        } else {
          setSchemaInfo(data || []);
        }
      } catch (err) {
        console.error('Schema check error:', err);
      }
    };

    // Check profile for current user
    const checkProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            setProfileStatus(`Error: ${error.message} (${error.code})`);
          } else if (data) {
            setProfileStatus(`Found: ${data.username}`);
          } else {
            setProfileStatus('No profile found');
          }
        } catch (err) {
          setProfileStatus(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else {
        setProfileStatus('No user logged in');
      }
    };

    checkEnv();
    checkDB();
    checkSchema();
    if (!loading) {
      checkProfile();
    }
  }, [user, loading]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Debug Page</h1>
      
      <div className="grid gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Environment</h2>
          <ul>
            {Object.entries(envStatus).map(([key, value]) => (
              <li key={key} className="mb-1">
                <span className="font-medium">{key}:</span>{' '}
                <span className={value ? 'text-green-600' : 'text-red-600'}>
                  {value ? 'Available' : 'Missing'}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Database Connection</h2>
          <p className={dbStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}>
            {dbStatus}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Authentication</h2>
          <p className="mb-2">
            <span className="font-medium">Status:</span>{' '}
            {loading ? 'Loading...' : user ? 'Authenticated' : 'Not authenticated'}
          </p>
          {user && (
            <>
              <p className="mb-2">
                <span className="font-medium">User ID:</span> {user.id}
              </p>
              <p className="mb-2">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">Profile:</span> {profileStatus}
              </p>
            </>
          )}
        </div>
        
        {schemaInfo && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Database Schema</h2>
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Column
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nullable
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schemaInfo.map((col, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap">{col.table_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{col.column_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{col.data_type}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {col.is_nullable === 'YES' ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {user && profile && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Profile Data</h2>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-[300px]">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 