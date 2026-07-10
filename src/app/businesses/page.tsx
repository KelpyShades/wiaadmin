"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Edit2, Trash2, MoreHorizontal, Image as ImageIcon, ExternalLink } from "lucide-react";

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

const businessSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  founder: z.string().min(2, "Founder name is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  website: z.string().url("Must be a valid URL (e.g. https://google.com)").or(z.literal("#")),
});

type FormValues = z.infer<typeof businessSchema>;

export default function BusinessesPage() {
  const businesses = useQuery(api.businesses.getBusinesses);
  const addBusiness = useMutation(api.businesses.addBusiness);
  const updateBusiness = useMutation(api.businesses.updateBusiness);
  const deleteBusiness = useMutation(api.businesses.deleteBusiness);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getFileUrl = useMutation(api.files.getFileUrl);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"businesses"> | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    businessId: Id<"businesses"> | null;
  }>({
    isOpen: false,
    businessId: null,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: "",
      founder: "",
      description: "",
      website: "#",
    },
  });

  const handleOpen = (business?: any) => {
    if (business) {
      setEditingId(business._id);
      form.reset({
        name: business.name,
        founder: business.founder,
        description: business.description,
        website: business.website || "#",
      });
    } else {
      setEditingId(null);
      form.reset({
        name: "",
        founder: "",
        description: "",
        website: "#",
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
      } else if (editingId && businesses) {
        const current = businesses.find(b => b._id === editingId);
        if (current?.imageId) imageId = current.imageId;
      }

      if (editingId) {
        await updateBusiness({
          id: editingId,
          ...values,
          imageId,
        });
      } else {
        await addBusiness({
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
      alert("Failed to save business");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmState.businessId) return;
    try {
      await deleteBusiness({ id: confirmState.businessId });
      setConfirmState({ isOpen: false, businessId: null });
    } catch (err) {
      console.error(err);
      alert("Failed to delete business");
    }
  };

  if (businesses === undefined) {
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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Alumni Businesses</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the listing of businesses built by WIA alumni displayed on the main landing page and subpages.
          </p>
        </div>
        <Button onClick={() => handleOpen()} className="flex items-center gap-2 w-fit">
          <Plus className="h-4 w-4" /> Add Business
        </Button>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Preview</TableHead>
              <TableHead>Business Name</TableHead>
              <TableHead>Founder</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead>Website</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                  No businesses found. Add one to get started!
                </TableCell>
              </TableRow>
            ) : (
              businesses.map((business) => (
                <TableRow key={business._id}>
                  <TableCell>
                    {business.imageUrl ? (
                      <div className="relative h-12 w-10 overflow-hidden rounded border border-zinc-200">
                        <Image
                          src={business.imageUrl}
                          alt={business.name}
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
                  <TableCell className="font-semibold text-zinc-900">{business.name}</TableCell>
                  <TableCell className="text-zinc-600">{business.founder}</TableCell>
                  <TableCell className="max-w-xs truncate hidden md:table-cell text-zinc-500">
                    {business.description}
                  </TableCell>
                  <TableCell>
                    {business.website && business.website !== "#" ? (
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-plum font-semibold hover:underline"
                      >
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-400 italic">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500" />
                      }>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpen(business)} className="flex items-center gap-2">
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setConfirmState({ isOpen: true, businessId: business._id })}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Business" : "Add Business"}</DialogTitle>
            <DialogDescription>
              Provide the details of the alumni business below.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. AfriTech Solutions" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="founder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Founder Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Amara Osei" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the business impact, size, and services..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website Link</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. https://afritech.com (or #)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Business Image / Logo</FormLabel>
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
                  Save Business
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, isOpen: open }))}
        title="Delete Business"
        description="Are you sure you want to delete this alumni business? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
