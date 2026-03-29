import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt } from "lucide-react";

const countries = [
  { code: "US", name: "United States", currency: "USD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "AU", name: "Australia", currency: "AUD" },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", country: "" });
  const [loading, setLoading] = useState(false);

  const selectedCountry = countries.find((c) => c.code === form.country);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signup(form);
    navigate("/admin/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Receipt className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">ClaimSync</span>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h1 className="text-lg font-semibold mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">Start managing expenses</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="mt-1.5" />
            </div>
            <div>
              <Label>Country</Label>
              <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name} ({c.currency})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCountry && <p className="text-xs text-muted-foreground mt-1">Currency: {selectedCountry.currency}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading || !form.country}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
