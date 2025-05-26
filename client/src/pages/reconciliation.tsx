import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, CheckCircle, AlertTriangle, DollarSign, TrendingUp, FileText } from "lucide-react";

export default function Reconciliation() {
  const [reconciliationDate, setReconciliationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [physicalCount, setPhysicalCount] = useState("");

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/transactions/stats"],
  });

  const approvedTransactions = transactions?.filter((t: any) => t.status === "approved") || [];
  const currentBalance = stats?.currentBalance || 0;
  const physicalCountValue = parseFloat(physicalCount) || 0;
  const variance = physicalCountValue - currentBalance;
  const hasVariance = Math.abs(variance) > 0.01; // Allow for rounding differences

  // Calculate monthly summary
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  
  const monthlyTransactions = approvedTransactions.filter((t: any) => 
    new Date(t.date) >= startOfMonth
  );

  const monthlyExpenses = monthlyTransactions.reduce((sum: number, t: any) => {
    const amount = parseFloat(t.amount);
    return amount < 0 ? sum + Math.abs(amount) : sum;
  }, 0);

  const monthlyReplenishments = monthlyTransactions.reduce((sum: number, t: any) => {
    const amount = parseFloat(t.amount);
    return amount > 0 ? sum + amount : sum;
  }, 0);

  const initialFloat = currentBalance + monthlyExpenses - monthlyReplenishments;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Reconciliation</h2>
              <p className="text-gray-500 text-sm mt-1">Verify and reconcile petty cash balances</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-lg ${hasVariance ? 'bg-orange-100' : 'bg-green-100'}`}>
                <p className={`font-semibold text-lg ${hasVariance ? 'text-orange-600' : 'text-green-600'}`}>
                  ${Math.abs(variance).toFixed(2)}
                </p>
                <p className={`text-xs ${hasVariance ? 'text-orange-600' : 'text-green-600'}`}>
                  {hasVariance ? 'Variance' : 'Balanced'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="daily" className="space-y-6">
            <TabsList>
              <TabsTrigger value="daily">Daily Reconciliation</TabsTrigger>
              <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
              <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-6">
              {/* Physical Count */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5" />
                    <span>Physical Cash Count</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reconciliation Date
                      </label>
                      <Input
                        type="date"
                        value={reconciliationDate}
                        onChange={(e) => setReconciliationDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Physical Cash Count ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8"
                          value={physicalCount}
                          onChange={(e) => setPhysicalCount(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reconciliation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">System Balance</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                          ${currentBalance.toFixed(2)}
                        </p>
                        <p className="text-gray-500 text-sm">Per transaction records</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Physical Count</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">
                          ${physicalCountValue.toFixed(2)}
                        </p>
                        <p className="text-gray-500 text-sm">Actual cash on hand</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Variance</p>
                        <p className={`text-2xl font-semibold mt-1 ${
                          hasVariance ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {variance >= 0 ? '+' : ''}${variance.toFixed(2)}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {hasVariance ? 'Requires investigation' : 'Balanced'}
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        hasVariance ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {hasVariance ? (
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reconciliation Status */}
              {physicalCount && (
                <Card>
                  <CardContent className="p-6">
                    <div className={`p-4 rounded-lg ${
                      hasVariance ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {hasVariance ? (
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        )}
                        <div>
                          <h3 className={`font-medium ${
                            hasVariance ? 'text-red-800' : 'text-green-800'
                          }`}>
                            {hasVariance ? 'Variance Detected' : 'Reconciliation Complete'}
                          </h3>
                          <p className={`text-sm ${
                            hasVariance ? 'text-red-700' : 'text-green-700'
                          }`}>
                            {hasVariance 
                              ? `There is a ${variance >= 0 ? 'surplus' : 'shortage'} of $${Math.abs(variance).toFixed(2)}. Please investigate and document the cause.`
                              : 'Physical cash count matches the system balance. Reconciliation is complete.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="monthly" className="space-y-6">
              {/* Monthly Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Reconciliation Summary</CardTitle>
                  <p className="text-sm text-gray-500">
                    Summary for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Opening Balance</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Initial Float</span>
                          <span className="font-medium">${initialFloat.toFixed(2)}</span>
                        </div>
                      </div>

                      <h4 className="font-medium text-gray-900">Monthly Activity</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Expenses</span>
                          <span className="font-medium text-red-600">-${monthlyExpenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Replenishments</span>
                          <span className="font-medium text-green-600">+${monthlyReplenishments.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between items-center font-medium">
                            <span>Net Change</span>
                            <span className={monthlyReplenishments - monthlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {monthlyReplenishments - monthlyExpenses >= 0 ? '+' : ''}${(monthlyReplenishments - monthlyExpenses).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Closing Balance</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Current Balance</span>
                          <span className="font-medium">${currentBalance.toFixed(2)}</span>
                        </div>
                      </div>

                      <h4 className="font-medium text-gray-900">Transaction Summary</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Transactions</span>
                          <span className="font-medium">{monthlyTransactions.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Average Transaction</span>
                          <span className="font-medium">
                            ${monthlyTransactions.length > 0 ? (monthlyExpenses / monthlyTransactions.filter((t: any) => parseFloat(t.amount) < 0).length || 0).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-6">
              {/* Recent Transactions for Audit */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transaction History</CardTitle>
                  <p className="text-sm text-gray-500">
                    Last 20 approved transactions for audit purposes
                  </p>
                </CardHeader>
                <CardContent>
                  {approvedTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {approvedTransactions.slice(0, 20).map((transaction: any) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString()} • {transaction.receivedBy}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              parseFloat(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {parseFloat(transaction.amount) >= 0 ? '+' : ''}${parseFloat(transaction.amount).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Balance: ${parseFloat(transaction.runningBalance || '0').toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Transactions</h3>
                      <p className="text-gray-600">
                        No approved transactions found for audit review.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}