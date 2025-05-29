import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from "recharts";
import { Transaction } from "@shared/schema";

interface ChartsProps {
  transactions: Transaction[];
}

const COLORS = ["#4caf50", "#f44336", "#ff9800", "#2196f3", "#9c27b0", "#00bcd4"];

export function IncomeExpenseChart({ transactions }: ChartsProps) {
  const data = useMemo(() => {
    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return [
      { name: "Income", value: income, color: "#4caf50" },
      { name: "Expenses", value: expenses, color: "#f44336" },
    ];
  }, [transactions]);

  if (data.every(d => d.value === 0)) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={(entry) => `$${entry.value.toLocaleString()}`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Amount"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ExpenseCategoryChart({ transactions }: ChartsProps) {
  const data = useMemo(() => {
    const expensesByCategory: { [key: string]: number } = {};
    
    transactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + parseFloat(t.amount);
      });

    return Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        No expense data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Amount"]} />
        <Bar dataKey="amount" fill="#1976d2" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendsChart({ transactions }: ChartsProps) {
  const data = useMemo(() => {
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    
    transactions.forEach(t => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (t.type === "income") {
        monthlyData[month].income += parseFloat(t.amount);
      } else {
        monthlyData[month].expenses += parseFloat(t.amount);
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        income: values.income,
        expenses: values.expenses,
      }));
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        No monthly data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Amount"]} />
        <Legend />
        <Line type="monotone" dataKey="income" stroke="#4caf50" strokeWidth={2} />
        <Line type="monotone" dataKey="expenses" stroke="#f44336" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
