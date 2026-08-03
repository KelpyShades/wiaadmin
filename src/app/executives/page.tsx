"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Edit2, Trash2, MoreHorizontal, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Image from "next/image";

const executiveSchema = z.object({
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role is required"),
  bio: z.string().optional(),
  order: z.number().int(),
});

type FormValues = z.infer<typeof executiveSchema>;

export default function ExecutivesPage() {
  const executives = useQuery(api.executives.getExecutives);
  const addExecutive = useMutation(api.executives.addExecutive);
  const updateExecutive = useMutation(api.executives.updateExecutive);
  const removeExecutive = useMutation(api.executives.removeExecutive);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"executives"> | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    executiveId: Id<"executives"> | null;
  }>({
    isOpen: false,
    executiveId: null,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(executiveSchema),
    defaultValues: {
      name: "",
      role: "",
      bio: "",
      order: 0,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpen = (executive?: any) => {
    if (executive) {
      setEditingId(executive._id);
      form.reset({
        name: executive.name,
        role: executive.role,
        bio: executive.bio || "",
        order: executive.order,
      });
    } else {
      setEditingId(null);
      form.reset({
        name: "",
        role: "",
        bio: "",
        order: (executives?.length || 0) + 1,
      });
    }
    setSelectedImage(null);
    setIsOpen(true);
  };

  const handleUpload = async (file: File) => {
    const postUrl = await generateUploadUrl();
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    return storageId as Id<"_storage">;
  };

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      let imageId: Id<"_storage"> | undefined = undefined;
      
      if (selectedImage) {
        imageId = await handleUpload(selectedImage);
      } else if (editingId && executives) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const current = executives.find((b: any) => b._id === editingId);
        if (current?.imageId) imageId = current.imageId;
      }

      if (editingId) {
        await updateExecutive({
          id: editingId,
          ...values,
          imageId,
        });
      } else {
        await addExecutive({
          ...values,
          imageId,
        });
      }
      setIsOpen(false);
      form.reset();
      setSelectedImage(null);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save executive");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmState.executiveId) return;
    try {
      await removeExecutive({ id: confirmState.executiveId });
      setConfirmState({ isOpen: false, executiveId: null });
    } catch (err) {
      console.error(err);
      alert("Failed to delete executive");
    }
  };

  if (executives === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Our Executives</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the executives displayed on the team page.
          </p>
        </div>
        <Button onClick={() => handleOpen()} className="flex items-center gap-2 w-fit">
          <Plus className="h-4 w-4" /> Add Executive
        </Button>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Bio</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                  No executives found. Add one to get started!
                </TableCell>
              </TableRow>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              executives.map((executive: any) => (
                <TableRow key={executive._id}>
                  <TableCell>
                    {executive.imageUrl ? (
                      <div className="relative h-12 w-10 overflow-hidden rounded border border-zinc-200">
                        <Image
                          src={executive.imageUrl}
                          alt={executive.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-10 items-center justify-center rounded border border-zinc-200 bg-zinc-50 text-zinc-300">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-zinc-900">{executive.name}</TableCell>
                  <TableCell className="text-zinc-600">{executive.role}</TableCell>
                  <TableCell className="max-w-xs truncate hidden md:table-cell text-zinc-500">
                    {executive.bio}
                  </TableCell>
                  <TableCell className="text-zinc-600">{executive.order}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500" />
                      }>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpen(executive)} className="flex items-center gap-2">
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setConfirmState({ isOpen: true, executiveId: executive._id })}
                          className="flex items-center gap-2 text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Executive" : "Add Executive"}</DialogTitle>
            <DialogDescription>
              Provide the details of the executive below.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                     <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Director" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief biography..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value, 10))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Profile Image</FormLabel>
                <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-lg border-zinc-200 bg-zinc-50/50">
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                    className="max-w-xs mt-1"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    {selectedImage ? `Selected: ${selectedImage.name}` : "Leave empty to keep current image"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Executive
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, isOpen: open }))}
        title="Delete Executive"
        description="Are you sure you want to delete this executive? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
