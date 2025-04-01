import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { RefreshCw, DollarSign, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface SalesRepStats {
  sales_rep_id: string;
  name: string;
  email: string;
  total_clients: number;
  paid_commission: number;
  unpaid_commission: number;
  total_commission: number;
  avg_commission_rate: number;
  default_commission_rate: number;
  payment_details: any;
}

export const SalesCommission = () => {
  const queryClient = useQueryClient();
  const [selectedRep, setSelectedRep] = useState<string | null>(null);

  // Fetch sales reps with their commission stats
  const { data: salesReps, isLoading } = useQuery({
    queryKey: ['sales-reps-stats'],
    queryFn: async () => {
      const { data: stats, error: statsError } = await supabase
        .from('sales_commission_stats')
        .select('*');

      if (statsError) throw statsError;

      const { data: reps, error: repsError } = await supabase
        .from('sales_reps')
        .select('*')
        .order('name');

      if (repsError) throw repsError;

      // Combine stats with rep details
      return reps.map(rep => ({
        ...rep,
        ...stats?.find(s => s.sales_rep_id === rep.id)
      }));
    }
  });

  // Fetch payment history for selected rep
  const { data: paymentHistory } = useQuery({
    queryKey: ['payment-history', selectedRep],
    queryFn: async () => {
      if (!selectedRep) return [];
      
      const { data, error } = await supabase
        .from('sales_commission_payments')
        .select('*')
        .eq('sales_rep_id', selectedRep)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedRep
  });

  // Reset payment mutation
  const resetPayment = useMutation({
    mutationFn: async (repId: string) => {
      const { error } = await supabase
        .from('sales_commission_payments')
        .insert([{
          sales_rep_id: repId,
          amount: 0,
          status: 'paid',
          payment_method: 'manual',
          notes: 'Payment reset'
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-reps-stats'] });
    }
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("Sales Commission Report", 105, 15, { align: "center" });
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 22, { align: "center" });
    
    // Commission Overview
    doc.setFontSize(14);
    doc.text("Commission Overview", 14, 35);
    
    const overviewData = [
      ["Total Commission", `$${salesReps?.reduce((sum, rep) => sum + (rep.total_commission || 0), 0).toFixed(2) || '0.00'}`],
      ["Active Sales Reps", `${salesReps?.filter(rep => rep.active).length || 0}`],
      ["Pending Payments", `$${salesReps?.reduce((sum, rep) => sum + (rep.unpaid_commission || 0), 0).toFixed(2) || '0.00'}`]
    ];
    
    (doc as any).autoTable({
      startY: 40,
      head: [["Metric", "Value"]],
      body: overviewData,
      theme: 'grid',
      headStyles: { fillColor: [0, 26, 26] }
    });
    
    // Sales Representatives Table
    doc.setFontSize(14);
    doc.text("Sales Representatives", 14, (doc as any).lastAutoTable.finalY + 15);
    
    const repsData = salesReps?.map(rep => [
      rep.name,
      rep.email,
      rep.total_clients || 0,
      `${rep.commission_rate}%`,
      `$${rep.total_commission?.toFixed(2) || '0.00'}`,
      `$${rep.unpaid_commission?.toFixed(2) || '0.00'}`,
      rep.active ? 'Active' : 'Inactive'
    ]) || [];
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Name", "Email", "Clients", "Rate", "Total", "Pending", "Status"]],
      body: repsData,
      theme: 'grid',
      headStyles: { fillColor: [0, 26, 26] }
    });
    
    // Payment History
    if (selectedRep && paymentHistory?.length) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Payment History", 14, 20);
      
      const paymentData = paymentHistory.map(payment => [
        new Date(payment.payment_date).toLocaleDateString(),
        `$${payment.amount.toFixed(2)}`,
        payment.status.toUpperCase(),
        payment.payment_method,
        payment.transaction_id || 'N/A',
        payment.notes || ''
      ]);
      
      (doc as any).autoTable({
        startY: 25,
        head: [["Date", "Amount", "Status", "Method", "Transaction ID", "Notes"]],
        body: paymentData,
        theme: 'grid',
        headStyles: { fillColor: [0, 26, 26] }
      });
    }
    
    doc.save("sales-commission-report.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sales Commission</h1>
        <button
          onClick={exportToPDF}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Commission Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Total Commission</h3>
            <DollarSign className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            ${salesReps?.reduce((sum, rep) => sum + (rep.total_commission || 0), 0).toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Sales Reps</h3>
            <AlertCircle className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {salesReps?.filter(rep => rep.active).length || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pending Payments</h3>
            <AlertCircle className="text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            ${salesReps?.reduce((sum, rep) => sum + (rep.unpaid_commission || 0), 0).toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Sales Representatives Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-xl font-semibold">Sales Representatives</h2>
        </div>
        <div className="border-t border-gray-200">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Earned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading commission data...
                  </td>
                </tr>
              ) : salesReps?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No sales representatives found
                  </td>
                </tr>
              ) : (
                salesReps?.map((rep: SalesRepStats) => (
                  <tr 
                    key={rep.sales_rep_id} 
                    className={`border-b ${selectedRep === rep.sales_rep_id ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
                    onClick={() => setSelectedRep(rep.sales_rep_id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rep.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rep.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rep.total_clients || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rep.default_commission_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${rep.total_commission?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${rep.unpaid_commission?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rep.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {rep.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetPayment.mutateAsync(rep.sales_rep_id);
                        }}
                        disabled={resetPayment.isPending}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      {selectedRep && paymentHistory && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold">Payment History</h2>
          </div>
          <div className="border-t border-gray-200">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {payment.transaction_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesCommission;