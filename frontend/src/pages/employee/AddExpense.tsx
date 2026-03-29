import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const categories = ["Meals", "Travel", "Supplies", "Events", "Software", "Equipment", "Other"];
const currencies = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD"];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function AddExpense() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UX States
  const [form, setForm] = useState({ amount: "", currency: "USD", category: "", date: "", description: "" });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [progressStep, setProgressStep] = useState<"idle" | "creating" | "uploading" | "submitting" | "done">("idle");

  // MUTATION 1: Create Draft
  const createDraftMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/expenses", data);
      return res.data;
    },
    onError: (err: any) => {
      toast({ title: "Failed to create draft", description: err.response?.data?.message || err.message, variant: "destructive" });
      setProgressStep("idle");
    }
  });

  // MUTATION 2: Upload Receipt
  const uploadReceiptMutation = useMutation({
    mutationFn: async ({ file, expenseId }: { file: File, expenseId: string }) => {
      const formData = new FormData();
      formData.append("receipt", file);
      formData.append("expense_id", expenseId);
      
      const res = await api.post("/receipts/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data;
    },
    onError: (err: any) => {
      toast({ title: "Failed to upload receipt", description: "Network error or file too large. Please retry.", variant: "destructive" });
      setProgressStep("idle");
    }
  });

  // MUTATION 3: Submit Final Workflow
  const submitExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await api.post(`/expenses/${expenseId}/submit`);
      return res.data;
    },
    onSuccess: () => {
      setProgressStep("done");
      toast({ title: "Success!", description: "Expense successfully mapped and submitted for Approval." });
      
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      
      // Clear forms
      setForm({ amount: "", currency: "USD", category: "", date: "", description: "" });
      setReceipt(null);
      
      setTimeout(() => navigate("/employee/expenses"), 1500);
    },
    onError: (err: any) => {
      toast({ title: "Submission Failed", description: err.response?.data?.message || err.message, variant: "destructive" });
      setProgressStep("idle");
    }
  });

  // MUTATION 4: Smart Scan (Stateless OCR Pre-fill)
  const smartScanMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("receipt", file);
      
      const res = await api.post("/receipts/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.data) {
        const { amount, date, merchant, currency, category, description } = data.data;
        setForm(prev => ({
          ...prev,
          amount: amount ? String(amount) : prev.amount,
          date: date ? String(date) : prev.date,
          currency: currency || prev.currency,
          category: category || prev.category,
          description: description || prev.description
        }));
        toast({ title: "Smart Scan Complete", description: "Form auto-populated from receipt." });
      }
    },
    onError: () => {
      toast({ title: "Smart Scan Failed", description: "Could not auto-extract data. Please enter manually.", variant: "destructive" });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceipt(file);
      smartScanMutation.mutate(file);
      toast({ title: "Scanning...", description: "Extracting transaction data" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!receipt) {
       toast({ title: "Receipt missing", description: "You must attach a receipt physically before submitting.", variant: "destructive" });
       return;
    }

    if (receipt.size > MAX_FILE_SIZE) {
       toast({ title: "File too large", description: "Limit is 5MB.", variant: "destructive" });
       return;
    }

    setProgressStep("creating");

    // Start Phase 1 Sequence
    createDraftMutation.mutate({
      ...form, 
      amount: parseFloat(form.amount)
    }, {
      onSuccess: (draftResponse) => {
         const expenseId = draftResponse.data._id;
         
         // Start Phase 2 Sequence
         setProgressStep("uploading");
         uploadReceiptMutation.mutate({ file: receipt, expenseId }, {
            onSuccess: () => {
               
               setProgressStep("submitting");
               
               setTimeout(() => {
                 // Start Phase 3 Sequence
                 submitExpenseMutation.mutate(expenseId);
               }, 100); 

            }
         });
      }
    });
  };

  const isProcessing = progressStep !== "idle" && progressStep !== "done";

  return (
    <DashboardLayout allowedRoles={["employee"]}>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} disabled={isProcessing}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-semibold">Add Expense</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 shadow-sm space-y-5">
          
          <div>
            <Label>Smart Scan Receipt First</Label>
            <div className={`mt-1.5 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isProcessing || smartScanMutation.isPending ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/30 border-primary/50 bg-primary/5'}`} onClick={() => !(isProcessing || smartScanMutation.isPending) && document.getElementById("receipt")?.click()}>
              {smartScanMutation.isPending ? (
                 <Loader2 className="h-6 w-6 mx-auto text-primary animate-spin mb-2" />
              ) : (
                 <Upload className="h-6 w-6 mx-auto text-primary mb-2" />
              )}
              <p className="text-sm font-medium text-foreground">{receipt ? receipt.name : "Click to auto-scan receipt"}</p>
              <p className="text-xs text-muted-foreground mt-1">We'll automatically extract the amount, date, and merchant.</p>
              <input id="receipt" type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileSelect} disabled={isProcessing || smartScanMutation.isPending} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="mt-1.5" placeholder="0.00" disabled={isProcessing} />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })} disabled={isProcessing}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} disabled={isProcessing}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="mt-1.5" disabled={isProcessing} />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Merchant / Description (Optional)</Label>
            <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" rows={3} placeholder="Describe the expense..." disabled={isProcessing} />
          </div>

          <div className="pt-4 border-t flex flex-col sm:flex-row justify-between items-center w-full gap-4">
               
            <div className="flex items-center text-sm font-medium">
               {progressStep === "creating" && <span className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Generating Draft...</span>}
               {progressStep === "uploading" && <span className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Uploading receipt & extracting OCR...</span>}
               {progressStep === "submitting" && <span className="text-blue-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Finalizing Approval Workflow...</span>}
               {progressStep === "done" && <span className="text-green-500 flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/> Successfully mapped to pipeline!</span>}
            </div>

            <div className="flex gap-3">
               <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isProcessing}>Cancel</Button>
               <Button type="submit" disabled={!form.amount || !form.category || !receipt || isProcessing} className="min-w-32">
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Submit Expense"}
               </Button>
            </div>

          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
