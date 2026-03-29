import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const roles: Record<string, string> = {
        "admin@demo.com": "/admin/dashboard",
        "employee@demo.com": "/employee/dashboard",
        "manager@demo.com": "/manager/approvals",
        "finance@demo.com": "/finance/dashboard",
        "cfo@demo.com": "/cfo/dashboard",
      };
      navigate(roles[email.toLowerCase()] || "/employee/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-lg font-semibold mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to your account</p>
          {error && <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@demo.com" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Any password" required className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
            <p className="text-sm text-muted-foreground">Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link></p>
          </div>
        </div>
        <div className="mt-4 bg-card border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-2">Demo accounts:</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span>admin@demo.com</span><span>→ Admin</span>
            <span>employee@demo.com</span><span>→ Employee</span>
            <span>manager@demo.com</span><span>→ Manager</span>
            <span>finance@demo.com</span><span>→ Finance</span>
            <span>cfo@demo.com</span><span>→ CFO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
