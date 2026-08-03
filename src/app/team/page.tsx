"use client";

import { useState, useEffect } from "react";
import { useQueryWithStatus } from "@/lib/convex-hooks";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";

interface Admin {
  _id?: Id<"users">;
  roleId: Id<"userRoles">;
  name?: string;
  email?: string;
  createdAt?: number;
}

interface Invite {
  _id: Id<"invites">;
  email: string;
  token: string;
  expiresAt: number;
  used: boolean;
  role: string;
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, CheckCircle2, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function TeamPage() {
  const { data: admins, isPending: adminsPending } = useQueryWithStatus(api.invites.getAdmins);
  const { data: invites, isPending: invitesPending } = useQueryWithStatus(api.invites.getInvites);
  const createInvite = useMutation(api.invites.createInvite);
  const revokeInvite = useMutation(api.invites.revokeInvite);
  const removeAdmin = useMutation(api.invites.removeAdmin);

  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const token = await createInvite({ email });
      const link = `${window.location.origin}/login?invite=${token}`;
      setInviteLink(link);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEmail("");
      setInviteLink("");
      setCopied(false);
    }
  };

  const handleRemoveAdmin = (roleId: Id<"userRoles">) => {
    setConfirmState({
      isOpen: true,
      title: "Remove Admin",
      description: "Are you sure you want to remove this admin? They will lose access to the dashboard.",
      onConfirm: async () => {
        try {
          await removeAdmin({ roleId });
        } catch (err) {
          const error = err as Error;
          alert(error.message || "Failed to remove admin.");
        }
      }
    });
  };

  const handleRevokeInvite = (id: Id<"invites">) => {
    setConfirmState({
      isOpen: true,
      title: "Revoke Invite",
      description: "Are you sure you want to revoke this invite? Any user trying to use it will be blocked.",
      onConfirm: async () => {
        await revokeInvite({ id });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Team Management</h2>
        <p className="text-muted-foreground">
          Manage admin access and generate invite links for new team members.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Active Admins</h3>
        <Button onClick={() => setIsOpen(true)}>Generate Invite</Button>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-106.25">
            <DialogHeader>
              <DialogTitle>Invite New Admin</DialogTitle>
              <DialogDescription>
                Generate a secure, one-time invite link that expires in 24 hours.
              </DialogDescription>
            </DialogHeader>
            {!inviteLink ? (
              <form onSubmit={handleGenerate}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isGenerating}>
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Link
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Invite Link</Label>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This link will expire in 24 hours and can only be used once.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-25"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminsPending ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-300" />
                </TableCell>
              </TableRow>
            ) : admins?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No active admins found.
                </TableCell>
              </TableRow>
            ) : (
              admins?.map((admin: Admin) => (
                <TableRow key={admin._id}>
                  <TableCell className="font-medium">{admin.email}</TableCell>
                  <TableCell>
                    {admin.createdAt ? format(new Date(admin.createdAt), "PPP") : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveAdmin(admin.roleId)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="pt-8">
        <h3 className="text-xl font-semibold mb-4">Recent Invites</h3>
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intended Email</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-25"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitesPending ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-300" />
                  </TableCell>
                </TableRow>
              ) : invites?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No recent invites.
                  </TableCell>
                </TableRow>
              ) : (
                invites?.map((invite: Invite) => {
                  const isExpired = currentTime > 0 ? invite.expiresAt < currentTime : false;
                  return (
                    <TableRow key={invite._id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>
                        {format(new Date(invite.expiresAt), "PPP p")}
                      </TableCell>
                      <TableCell>
                        {invite.used ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                            Used
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!invite.used && !isExpired && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRevokeInvite(invite._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <ConfirmDialog 
        open={confirmState.isOpen} 
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, isOpen: open }))}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
      />
    </div>
  );
}
