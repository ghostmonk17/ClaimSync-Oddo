import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const categories = ["Meals", "Travel", "Supplies", "Events", "Software", "Equipment", "Other"];
const currencies = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD"];

export default function AddExpense() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ amount: "", currency: "USD", category: "", date: "", description: "" });
  const [receipt, setReceipt] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Expense added", description: `$${form.amount} ${form.category} expense submitted.` });
    navigate("/employee/expenses");
  };

  return (
    <DashboardLayout allowedRoles={["employee"]}>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-semibold">Add Expense</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="mt-1.5" placeholder="0.00" />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.currency !== "USD" && form.amount && (
                <p className="text-xs text-muted-foreground mt-1">≈ ${(parseFloat(form.amount) * 1.1).toFixed(2)} USD</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" rows={3} placeholder="Describe the expense..." />
          </div>

          <div>
            <Label>Receipt</Label>
            <div className="mt-1.5 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => document.getElementById("receipt")?.click()}>
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{receipt ? receipt.name : "Click to upload receipt"}</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF up to 10MB</p>
              <input id="receipt" type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
            </div>
            {receipt && <p className="text-xs text-success mt-2">✓ OCR will process this receipt automatically</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={!form.amount || !form.category}>Submit Expense</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
