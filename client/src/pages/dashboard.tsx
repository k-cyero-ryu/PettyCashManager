import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import StatsCards from "@/components/dashboard/stats-cards";
import TransactionTable from "@/components/transactions/transaction-table";
import ApprovalCard from "@/components/approvals/approval-card";
import TransactionForm from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/transactions/stats"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions", { limit: 10 }],
  });

  const { data: pendingTransactions, isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/transactions", { status: "pending", limit: 5 }],
  });

  const currentBalance = stats?.currentBalance || 0;
  const isLowBalance = currentBalance < 1500;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
              <p className="text-gray-500 text-sm mt-1">Monitor petty cash transactions and balances</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Current Balance */}
              <div className={`px-4 py-2 rounded-lg ${isLowBalance ? 'bg-orange-100' : 'bg-green-100'}`}>
                <p className={`font-semibold text-lg ${isLowBalance ? 'text-orange-600' : 'text-green-600'}`}>
                  ${currentBalance.toFixed(2)}
                </p>
                <p className={`text-xs ${isLowBalance ? 'text-orange-600' : 'text-green-600'}`}>
                  Current Balance
                </p>
              </div>
              {/* Add Transaction Button */}
              <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>New Transaction</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <TransactionForm onSuccess={() => setShowTransactionForm(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Cards */}
          <StatsCards stats={stats} isLoading={statsLoading} />

          {/* Low Balance Alert */}
          {isLowBalance && (
            <Alert className="mb-8 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Current balance is below minimum threshold of $1,500. Consider requesting replenishment.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionTable 
                    transactions={transactions || []} 
                    isLoading={transactionsLoading}
                    showPagination={false}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Pending Approvals */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Pending Approvals</CardTitle>
                  <p className="text-sm text-gray-500">Transactions awaiting review</p>
                </CardHeader>
                <CardContent>
                  {pendingLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg" />
                      ))}
                    </div>
                  ) : pendingTransactions?.length > 0 ? (
                    <div className="space-y-3">
                      {pendingTransactions.map((transaction: any) => (
                        <ApprovalCard key={transaction.id} transaction={transaction} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No pending approvals</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
