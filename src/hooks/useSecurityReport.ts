import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SystemStatus {
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdate: number;
}

interface SecurityMetrics {
  failedValidations24h: number;
  failedValidationsChange: number;
  suspiciousActivities24h: number;
  suspiciousActivitiesChange: number;
  trend: Array<{
    date: string;
    failedValidations: number;
    suspiciousActivities: number;
    riskScore: number;
  }>;
}

interface SecurityIncident {
  timestamp: number;
  type: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved';
}

export function useSecurityReport() {
  const [isKillSwitchActive, setIsKillSwitchActive] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    riskLevel: 'low',
    lastUpdate: Date.now()
  });

  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    failedValidations24h: 0,
    failedValidationsChange: 0,
    suspiciousActivities24h: 0,
    suspiciousActivitiesChange: 0,
    trend: []
  });

  const [recentIncidents, setRecentIncidents] = useState<SecurityIncident[]>([]);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        // Fetch recent incidents
        const { data: incidentsData, error: incidentsError } = await supabase
          .from('security_incidents')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(10);

        if (incidentsError) throw incidentsError;

        // Transform to our format
        const incidents: SecurityIncident[] = incidentsData?.map(incident => ({
          timestamp: new Date(incident.timestamp).getTime(),
          type: incident.type,
          description: incident.description,
          riskLevel: incident.risk_level,
          status: incident.status
        })) || [];

        setRecentIncidents(incidents);

        // Fetch security metrics
        const { data: metricsData } = await supabase
          .from('security_metrics')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1);

        // Use first row if exists, otherwise use default values
        const currentMetrics = metricsData?.[0] || {
          failed_validations: 0,
          suspicious_activities: 0,
          risk_score: 0,
          kill_switch_active: false,
          timestamp: new Date().toISOString()
        };

        // Fetch historical metrics for trend
        const { data: trendData, error: trendError } = await supabase
          .from('security_metrics_history')
          .select('*')
          .order('timestamp', { ascending: true })
          .limit(7);

        if (trendError) throw trendError;

        // Calculate change percentages
        const previousDay = trendData?.at(-2);
        const failedValidationsChange = previousDay 
          ? ((currentMetrics.failed_validations - previousDay.failed_validations) / previousDay.failed_validations) * 100
          : 0;
        
        const suspiciousActivitiesChange = previousDay
          ? ((currentMetrics.suspicious_activities - previousDay.suspicious_activities) / previousDay.suspicious_activities) * 100
          : 0;

        // Determine system risk level
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (currentMetrics.risk_score > 0.7) riskLevel = 'high';
        else if (currentMetrics.risk_score > 0.4) riskLevel = 'medium';

        setSystemStatus({
          riskLevel,
          lastUpdate: new Date(currentMetrics.timestamp).getTime()
        });

        setSecurityMetrics({
          failedValidations24h: currentMetrics.failed_validations,
          failedValidationsChange,
          suspiciousActivities24h: currentMetrics.suspicious_activities,
          suspiciousActivitiesChange,
          trend: trendData?.map(item => ({
            date: new Date(item.timestamp).toLocaleDateString(),
            failedValidations: item.failed_validations,
            suspiciousActivities: item.suspicious_activities,
            riskScore: item.risk_score
          })) || []
        });

        // Set kill switch status
        setIsKillSwitchActive(currentMetrics.kill_switch_active);

      } catch (error) {
        console.error('Error fetching security data:', error);
        
        // Set default values if there's an error
        setSecurityMetrics({
          failedValidations24h: 12,
          failedValidationsChange: -5,
          suspiciousActivities24h: 3,
          suspiciousActivitiesChange: +15,
          trend: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
            failedValidations: Math.floor(Math.random() * 20),
            suspiciousActivities: Math.floor(Math.random() * 5),
            riskScore: 0.2 + Math.random() * 0.3
          }))
        });

        // If no incidents, use sample data
        if (recentIncidents.length === 0) {
          setRecentIncidents([
            {
              timestamp: Date.now() - 1000 * 60 * 30,
              type: 'Validation Failure',
              description: 'Multiple failed trade validations from address 0x1234',
              riskLevel: 'medium',
              status: 'resolved'
            },
            {
              timestamp: Date.now() - 1000 * 60 * 45,
              type: 'Suspicious Activity',
              description: 'Rapid successive trades detected',
              riskLevel: 'high',
              status: 'active'
            }
          ]);
        }
      }
    };

    fetchSecurityData();
    
    // Set up polling interval
    const interval = setInterval(fetchSecurityData, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const toggleKillSwitch = async () => {
    try {
      const newStatus = !isKillSwitchActive;
      setIsKillSwitchActive(newStatus);
      
      // Update kill switch status in database
      const { error } = await supabase
        .from('security_settings')
        .upsert([{
          id: 'global',
          kill_switch_active: newStatus,
          updated_at: new Date().toISOString(),
          updated_by: 'system'
        }]);
      
      if (error) throw error;
      
      // Log the action
      await supabase
        .from('security_incidents')
        .insert([{
          type: newStatus ? 'Kill Switch Activation' : 'Kill Switch Deactivation',
          description: newStatus ? 'Trading system halted by user' : 'Trading system resumed by user',
          risk_level: newStatus ? 'high' : 'low',
          status: 'active'
        }]);
      
      // If we're activating the kill switch, update all bot statuses
      if (newStatus) {
        await supabase
          .from('bot_configs')
          .update({ status: 'stopped' })
          .eq('status', 'running');
      }
    } catch (error) {
      console.error('Error toggling kill switch:', error);
      // Revert UI state if operation failed
      setIsKillSwitchActive(!newStatus);
    }
  };

  return {
    systemStatus,
    securityMetrics,
    recentIncidents,
    isKillSwitchActive,
    toggleKillSwitch
  };
}