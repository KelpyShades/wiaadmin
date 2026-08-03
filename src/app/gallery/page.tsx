"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Image as ImageIcon, Video, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const gallerySchema = z.object({
  caption: z.string().min(2, "Caption is required"),
  category: z.string().min(2, "Category is required (e.g. 2026 Cohort)"),
  type: z.enum(["image", "video", "award"]),
});

type FormValues = z.infer<typeof gallerySchema>;

export default function GalleryPage() {
  const gallery = useQuery(api.gallery.getGallery);
  const addGalleryItem = useMutation(api.gallery.addGalleryItem);
  const deleteGalleryItem = useMutation(api.gallery.deleteGalleryItem);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    itemId: Id<"gallery"> | null;
  }>({
    isOpen: false,
    itemId: null,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      caption: "",
      category: "",
      type: "image",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchType = form.watch("type");

  const openAddSheet = () => {
    form.reset({ caption: "", category: "", type: "image" });
    setSelectedFile(null);
    setIsSheetOpen(true);
  };

  const handleDelete = (id: Id<"gallery">) => {
    setConfirmState({
      isOpen: true,
      itemId: id,
    });
  };

  const confirmDelete = async () => {
    if (confirmState.itemId) {
      await deleteGalleryItem({ id: confirmState.itemId });
    }
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
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    try {
      const fileId = await handleUpload(selectedFile);
      await addGalleryItem({
        ...values,
        fileId,
      });
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (gallery === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Gallery</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Upload photos, videos, and awards to display on the main website.
          </p>
        </div>
        <Button onClick={openAddSheet}>
          <Plus className="mr-2 h-4 w-4" /> Upload Media
        </Button>
      </div>

      {gallery.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-white text-zinc-500">
          <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
          <p>Your gallery is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.map((item) => (
            <Card key={item._id} className="overflow-hidden group relative border-zinc-200 shadow-sm">
              <div className="aspect-square bg-zinc-100 relative">
                {item.type === "video" ? (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-200">
                    <Video className="h-10 w-10 text-zinc-400" />
                  </div>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url!} alt={item.caption} className="h-full w-full object-cover" />
                  </>
                )}
                
                <div className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-1 backdrop-blur-sm">
                  {item.type === "award" ? (
                    <Trophy className="h-3 w-3 text-white" />
                  ) : item.type === "video" ? (
                    <Video className="h-3 w-3 text-white" />
                  ) : (
                    <ImageIcon className="h-3 w-3 text-white" />
                  )}
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleDelete(item._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="truncate text-sm font-medium text-zinc-900">{item.caption}</p>
                <p className="truncate text-xs text-zinc-500">{item.category}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
            <DialogDescription>
              Add a new photo or video to your global gallery.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Media Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="image">Standard Photo</SelectItem>
                        <SelectItem value="award">Award / Recognition</SelectItem>
                        <SelectItem value="video">Video Clip</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Graduation Ceremony 2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category / Album</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Events, Cohort 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>File Upload</FormLabel>
                <Input 
                  type="file" 
                  accept={watchType === "video" ? "video/*" : "image/*"}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isUploading} className="w-full">
                  {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                  ) : "Upload Media"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <ConfirmDialog 
        open={confirmState.isOpen} 
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, isOpen: open }))}
        title="Delete Media"
        description="Are you sure you want to delete this media item? It will be permanently removed."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
