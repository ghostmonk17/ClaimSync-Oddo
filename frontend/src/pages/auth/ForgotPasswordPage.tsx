import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

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
          {!sent ? (
            <>
              <h1 className="text-lg font-semibold mb-1">Reset password</h1>
              <p className="text-sm text-muted-foreground mb-6">We'll send you a reset link</p>
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" />
                </div>
                <Button type="submit" className="w-full">Send Reset Link</Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Receipt className="h-6 w-6 text-success" />
              </div>
              <h2 className="font-semibold mb-1">Check your email</h2>
              <p className="text-sm text-muted-foreground">We sent a reset link to {email}</p>
            </div>
          )}
          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
