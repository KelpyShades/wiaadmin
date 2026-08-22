"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Edit2, Trash2, MoreHorizontal, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FormDescription,
} from "@/components/ui/form";
import Image from "next/image";

const licenseSchema = z.object({
  country: z.string().min(2, "Country name is required"),
  body: z.string().min(2, "Licensing body name is required"),
  licenseName: z.string().min(2, "License name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  flagCode: z
    .string()
    .max(2, "Flag code must be at most 2 letters")
    .toUpperCase()
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof licenseSchema>;

// Convert 2-letter ISO country code to flag emoji
const getFlagEmoji = (countryCode?: string) => {
  if (!countryCode) return null;
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return null;
  }
};

export default function LicensesPage() {
  const licenses = useQuery(api.licenses.getLicenses);
  const addLicense = useMutation(api.licenses.addLicense);
  const updateLicense = useMutation(api.licenses.updateLicense);
  const deleteLicense = useMutation(api.licenses.deleteLicense);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"licenses"> | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    licenseId: Id<"licenses"> | null;
  }>({
    isOpen: false,
    licenseId: null,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      country: "",
      body: "",
      licenseName: "",
      licenseNumber: "",
      flagCode: "",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpen = (license?: any) => {
    if (license) {
      setEditingId(license._id);
      form.reset({
        country: license.country,
        body: license.body,
        licenseName: license.licenseName,
        licenseNumber: license.licenseNumber,
        flagCode: license.flagCode || "",
      });
    } else {
      setEditingId(null);
      form.reset({
        country: "",
        body: "",
        licenseName: "",
        licenseNumber: "",
        flagCode: "",
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
      } else if (editingId && licenses) {
        const current = licenses.find((l) => l._id === editingId);
        if (current?.imageId) imageId = current.imageId;
      }

      const flagCodeValue = values.flagCode && values.flagCode.trim() !== "" 
        ? values.flagCode.toUpperCase() 
        : undefined;

      if (editingId) {
        await updateLicense({
          id: editingId,
          country: values.country,
          body: values.body,
          licenseName: values.licenseName,
          licenseNumber: values.licenseNumber,
          flagCode: flagCodeValue,
          imageId,
        });
      } else {
        await addLicense({
          country: values.country,
          body: values.body,
          licenseName: values.licenseName,
          licenseNumber: values.licenseNumber,
          flagCode: flagCodeValue,
          imageId,
        });
      }
      setIsOpen(false);
      form.reset();
      setSelectedImage(null);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save license");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmState.licenseId) return;
    try {
      await deleteLicense({ id: confirmState.licenseId });
      setConfirmState({ isOpen: false, licenseId: null });
    } catch (err) {
      console.error(err);
      alert("Failed to delete license");
    }
  };

  if (licenses === undefined) {
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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Compliance & Licenses</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage registrations and licenses across various jurisdictions to show on the main website.
          </p>
        </div>
        <Button onClick={() => handleOpen()} className="flex items-center gap-2 w-fit">
          <Plus className="h-4 w-4" /> Add License
        </Button>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Flag/Logo</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Licensing Body</TableHead>
              <TableHead className="hidden md:table-cell">License Name</TableHead>
              <TableHead>License Number</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                  No licenses found. Add one to get started!
                </TableCell>
              </TableRow>
            ) : (
              licenses.map((license) => {
                const flagEmoji = getFlagEmoji(license.flagCode);
                return (
                  <TableRow key={license._id}>
                    <TableCell>
                      {license.imageUrl ? (
                        <div className="relative h-8 w-12 overflow-hidden rounded border border-zinc-200 shadow-xs">
                          <Image
                            src={license.imageUrl}
                            alt={license.country}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : flagEmoji ? (
                        <span className="text-2xl select-none" role="img" aria-label={license.country}>
                          {flagEmoji}
                        </span>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 border border-zinc-200">
                          <Globe className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-900">{license.country}</TableCell>
                    <TableCell className="text-zinc-600">{license.body}</TableCell>
                    <TableCell className="hidden md:table-cell text-zinc-500">{license.licenseName}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold bg-zinc-50 px-2 py-1 rounded w-fit border border-zinc-150">
                      {license.licenseNumber}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500" />
                        }>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpen(license)} className="flex items-center gap-2">
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setConfirmState({ isOpen: true, licenseId: license._id })}
                            className="flex items-center gap-2 text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit License" : "Add License"}</DialogTitle>
            <DialogDescription>
              Provide the details of the license/compliance record below.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Canada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Licensing Body / Agency</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ministry of Education" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licenseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Type / Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Registered Academy License" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Number / Registration ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 10294-A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="flagCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2-Letter Country Code (for Flag Emoji)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. CA, GH, NG, US" maxLength={2} {...field} />
                    </FormControl>
                    <FormDescription>
                      We use this ISO code to render the country flag.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Custom Country Flag / Logo Image</FormLabel>
                <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-lg border-zinc-200 bg-zinc-50/50">
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                    className="max-w-xs mt-1"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    {selectedImage ? `Selected: ${selectedImage.name}` : "Optional: upload image to override emoji flag"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save License
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, isOpen: open }))}
        title="Delete License"
        description="Are you sure you want to delete this compliance/license record? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
