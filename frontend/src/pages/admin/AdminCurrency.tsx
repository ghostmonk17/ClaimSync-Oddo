import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const currencies = [
  { code: "USD", name: "US Dollar", rate: 1.0 },
  { code: "EUR", name: "Euro", rate: 0.92 },
  { code: "GBP", name: "British Pound", rate: 0.79 },
  { code: "INR", name: "Indian Rupee", rate: 83.12 },
  { code: "JPY", name: "Japanese Yen", rate: 149.50 },
  { code: "CAD", name: "Canadian Dollar", rate: 1.36 },
  { code: "AUD", name: "Australian Dollar", rate: 1.53 },
];

export default function AdminCurrency() {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">Currency Settings</h1>

        <div className="bg-card border rounded-lg p-5 shadow-sm space-y-4">
          <div>
            <Label>Base Currency</Label>
            <Select defaultValue="USD">
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button>Save</Button>
        </div>

        <div className="bg-card border rounded-lg shadow-sm">
          <div className="p-4 border-b"><h2 className="font-medium">Conversion Rates (Base: USD)</h2></div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Currency</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Rate</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Preview ($100)</th>
              </tr>
            </thead>
            <tbody>
              {currencies.filter((c) => c.code !== "USD").map((c) => (
                <tr key={c.code} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3 font-medium">{c.code} — {c.name}</td>
                  <td className="p-3 text-muted-foreground">{c.rate}</td>
                  <td className="p-3">{c.code} {(100 * c.rate).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
