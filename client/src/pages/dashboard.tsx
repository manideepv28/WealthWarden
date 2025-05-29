import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { TransactionForm } from "@/components/transaction-form";
import { IncomeExpenseChart, ExpenseCategoryChart, MonthlyTrendsChart } from "@/components/charts";
import { getCurrentUser } from "@/lib/auth";
import { getTransactionsFromLocal, removeTransactionFromLocal } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, ArrowDown, Wallet, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import type { Transaction } from "@shared/schema";

type DashboardSection = "dashboard" | "transactions" | "analytics" | "add-transaction";

export default function Dashboard() {
  const [location] = useLocation();
  const [activeSection, setActiveSection] = useState<DashboardSection>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState(getCurrentUser());
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    fromDate: "",
    toDate: "",
  });
  const { toast } = useToast();

  // Load transactions from localStorage on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      const localTransactions = getTransactionsFromLocal(currentUser.id);
      setTransactions(localTransactions);
      setFilteredTransactions(localTransactions);
    }
  }, []);

  // Update active section based on route
  useEffect(() => {
    const path = location.split("/")[1] as DashboardSection;
    if (["dashboard", "transactions", "analytics", "add-transaction"].includes(path)) {
      setActiveSection(path);
    }
  }, [location]);

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const balance = income - expenses;

    return { income, expenses, balance };
  }, [transactions]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Delete transaction
  const handleDeleteTransaction = (transactionId: number) => {
    if (!user) return;
    
    if (confirm("Are you sure you want to delete this transaction?")) {
      removeTransactionFromLocal(user.id, transactionId);
      const updatedTransactions = transactions.filter(t => t.id !== transactionId);
      setTransactions(updatedTransactions);
      setFilteredTransactions(updatedTransactions.filter(t => applyFilters(t)));
      
      toast({
        title: "Success",
        description: "Transaction deleted successfully!",
      });
    }
  };

  // Apply filters
  const applyFilters = (transaction: Transaction) => {
    if (filters.type && transaction.type !== filters.type) return false;
    if (filters.category && transaction.category !== filters.category) return false;
    if (filters.fromDate && transaction.date < filters.fromDate) return false;
    if (filters.toDate && transaction.date > filters.toDate) return false;
    return true;
  };

  // Handle filter application
  const handleApplyFilters = () => {
    const filtered = transactions.filter(applyFilters);
    setFilteredTransactions(filtered);
    toast({
      title: "Filters Applied",
      description: `Showing ${filtered.length} transactions`,
    });
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({ type: "", category: "", fromDate: "", toDate: "" });
    setFilteredTransactions(transactions);
    toast({
      title: "Filters Cleared",
      description: "Showing all transactions",
    });
  };

  // Get unique categories
  const categories = Array.from(new Set(transactions.map(t => t.category)));

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="lg:ml-64">
        {/* Dashboard Section */}
        {activeSection === "dashboard" && (
          <div className="p-6 pb-20 lg:pb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Financial Overview</h2>
              <p className="text-gray-600">Track your income, expenses, and financial progress</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Balance</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {formatCurrency(financialSummary.balance)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(financialSummary.income)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <ArrowUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(financialSummary.expenses)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <ArrowDown className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Income vs Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <IncomeExpenseChart transactions={transactions} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpenseCategoryChart transactions={transactions} />
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No transactions yet. Add your first transaction to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                            transaction.type === "income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          }`}>
                            {transaction.type === "income" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{transaction.description}</p>
                            <p className="text-sm text-gray-600">
                              {transaction.category} • {formatDate(transaction.date)}
                            </p>
                          </div>
                        </div>
                        <span className={`font-semibold ${
                          transaction.type === "income" ? "text-green-600" : "text-red-600"
                        }`}>
                          {transaction.type === "income" ? "+" : "-"}{formatCurrency(parseFloat(transaction.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transactions Section */}
        {activeSection === "transactions" && (
          <div className="p-6 pb-20 lg:pb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaction History</h2>
              <p className="text-gray-600">View and manage all your financial transactions</p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label htmlFor="typeFilter">Filter by Type</Label>
                    <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="categoryFilter">Filter by Category</Label>
                    <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fromDate">From Date</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="toDate">To Date</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleApplyFilters}>Apply Filters</Button>
                  <Button variant="outline" onClick={handleClearFilters}>Clear</Button>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Date</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Description</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Category</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Type</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">Amount</th>
                        <th className="text-center px-6 py-4 text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-800">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-800">
                              {transaction.description}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {transaction.category}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.type === "income" 
                                  ? "bg-green-100 text-green-600" 
                                  : "bg-red-100 text-red-600"
                              }`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className={`px-6 py-4 text-sm text-right font-medium ${
                              transaction.type === "income" ? "text-green-600" : "text-red-600"
                            }`}>
                              {transaction.type === "income" ? "+" : "-"}
                              {formatCurrency(parseFloat(transaction.amount))}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Section */}
        {activeSection === "analytics" && (
          <div className="p-6 pb-20 lg:pb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Financial Analytics</h2>
              <p className="text-gray-600">Detailed insights into your spending patterns and trends</p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyTrendsChart transactions={transactions} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Spending Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.filter(t => t.type === "expense").length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No expense data available</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(
                        transactions
                          .filter(t => t.type === "expense")
                          .reduce((acc, t) => {
                            acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
                            return acc;
                          }, {} as Record<string, number>)
                      )
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([category, amount]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{category}</span>
                            <span className="text-sm font-bold text-gray-900">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Savings Goal</h4>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min((financialSummary.balance / 5000) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(Math.max(financialSummary.balance, 0))} of $5,000 
                        ({Math.round(Math.min((financialSummary.balance / 5000) * 100, 100))}%)
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Emergency Fund</h4>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((financialSummary.balance / 10000) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(Math.max(financialSummary.balance, 0))} of $10,000 
                        ({Math.round(Math.min((financialSummary.balance / 10000) * 100, 100))}%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Add Transaction Section */}
        {activeSection === "add-transaction" && <TransactionForm />}
      </main>
    </div>
  );
}
