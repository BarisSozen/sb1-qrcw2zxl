import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: any;
  role: 'admin' | 'audit' | 'sales' | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'audit' | 'sales' | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        determineUserRole(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await determineUserRole(session.user.id);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const determineUserRole = async (userId: string) => {
    try {
      // Check if user is an audit client
      const { data: auditClient } = await supabase
        .from('clients')
        .select('client_type')
        .eq('id', userId)
        .eq('client_type', 'audit')
        .single();

      if (auditClient) {
        setRole('audit');
        return;
      }

      // Check if user is a sales rep
      const { data: salesRep } = await supabase
        .from('sales_reps')
        .select('id')
        .eq('id', userId)
        .single();

      if (salesRep) {
        setRole('sales');
        return;
      }

      // If neither, assume admin (you might want to add a specific admin check)
      setRole('admin');
    } catch (error) {
      console.error('Error determining user role:', error);
      setRole(null);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};