import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Manage customer invoices</p>
            <Link to="/invoices">
              <Button>View Invoices</Button>
            </Link>
          </CardContent>
        </Card>
        
        {/* Placeholder for future cards */}
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Financial reports and analysis</p>
            <Button disabled>Coming Soon</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
