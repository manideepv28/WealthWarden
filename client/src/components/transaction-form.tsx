import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertTransactionSchema, type InsertTransaction } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUser } from "@/lib/auth";
import { addTransactionToLocal } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const categories = {
  income: ["Salary", "Freelance", "Investment", "Gift", "Other Income"],
  expense: ["Food", "Transportation", "Entertainment", "Shopping", "Bills", "Healthcare", "Other Expense"],
};

export function TransactionForm() {
  const [selectedType, setSelectedType] = useState<"income" | "expense" | "">("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getCurrentUser();

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      type: undefined,
      amount: 0,
      description: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      if (!user) throw new Error("User not authenticated");
      
      // Create transaction locally first for immediate feedback
      const localTransaction = {
        id: Date.now(),
        userId: user.id,
        ...data,
        amount: data.amount.toString(),
        createdAt: new Date(),
      };

      // Add to localStorage
      addTransactionToLocal(user.id, localTransaction);

      // Also attempt to sync with server (but don't block UI on this)
      try {
        await apiRequest("POST", "/api/transactions", { ...data, userId: user.id });
      } catch (error) {
        console.warn("Failed to sync with server:", error);
      }

      return localTransaction;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      form.reset({
        type: undefined,
        amount: 0,
        description: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
      });
      setSelectedType("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add transaction",
      });
    },
  });

  const onSubmit = (data: InsertTransaction) => {
    addTransactionMutation.mutate(data);
  };

  const handleClear = () => {
    form.reset({
      type: undefined,
      amount: 0,
      description: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
    });
    setSelectedType("");
  };

  return (
    <div className="p-6 pb-20 lg:pb-6 lg:ml-64">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Add New Transaction</h2>
        <p className="text-gray-600">Record your income and expenses to track your financial health</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedType(value as "income" | "expense");
                          form.setValue("category", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter transaction description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedType && categories[selectedType]?.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={handleClear}>
                  Clear
                </Button>
                <Button type="submit" disabled={addTransactionMutation.isPending}>
                  {addTransactionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Transaction
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
