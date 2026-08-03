"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "../../convex/_generated/api";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Users, 
  MessageSquareQuote, 
  Handshake,
  Loader2
} from "lucide-react";

export default function OverviewPage() {
  const stats = useQuery(api.dashboard.getStats);

  if (stats === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Overview</h1>
        <p className="mt-1 flex items-center text-zinc-500">
          A high-level view of your academy&apos;s performance.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Partnerships
            </CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{stats.totalPartnerships}</div>
            <p className="mt-1 text-xs text-zinc-500">
              Total organization leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Applications
            </CardTitle>
            <Handshake className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">
              {stats.successfulApplications + stats.pendingApplications}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {stats.pendingApplications} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Testimonials
            </CardTitle>
            <MessageSquareQuote className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{stats.totalTestimonials}</div>
            <p className="mt-1 text-xs text-zinc-500">
              Published on main site
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
