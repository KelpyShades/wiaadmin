"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Edit2, Trash2, MoreHorizontal, Image as ImageIcon, Video } from "lucide-react";

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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const testimonialSchema = z.object({
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role is required"),
  type: z.enum(["written", "video", "success_story"]),
  quote: z.string().optional(),
  achievement: z.string().optional(),
});

type FormValues = z.infer<typeof testimonialSchema>;

export default function TestimonialsPage() {
  const testimonials = useQuery(api.testimonials.getTestimonials);
  const addTestimonial = useMutation(api.testimonials.addTestimonial);
  const deleteTestimonial = useMutation(api.testimonials.deleteTestimonial);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    itemId: Id<"testimonials"> | null;
  }>({
    isOpen: false,
    itemId: null,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: "",
      role: "",
      type: "written",
      quote: "",
      achievement: "",
    },
  });

  const watchType = form.watch("type");

  const openAddSheet = () => {
    form.reset({ name: "", role: "", type: "written", quote: "", achievement: "" });
    setSelectedImage(null);
    setSelectedVideo(null);
    setIsSheetOpen(true);
  };

  const handleDelete = (id: Id<"testimonials">) => {
    setConfirmState({
      isOpen: true,
      itemId: id,
    });
  };

  const confirmDelete = async () => {
    if (confirmState.itemId) {
      await deleteTestimonial({ id: confirmState.itemId });
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
    setIsUploading(true);
    try {
      let imageId: Id<"_storage"> | undefined = undefined;
      let videoId: Id<"_storage"> | undefined = undefined;

      if (selectedImage) imageId = await handleUpload(selectedImage);
      if (selectedVideo) videoId = await handleUpload(selectedVideo);

      await addTestimonial({
        ...values,
        imageId,
        videoId,
      });

      setIsSheetOpen(false);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (testimonials === undefined) {
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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Testimonials</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage student success stories, reviews, and video testimonials.
          </p>
        </div>
        <Button onClick={openAddSheet}>
          <Plus className="mr-2 h-4 w-4" /> Add Testimonial
        </Button>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Media</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testimonials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-zinc-500">
                  No testimonials found.
                </TableCell>
              </TableRow>
            ) : (
              testimonials.map((test) => (
                <TableRow key={test._id}>
                  <TableCell>
                    {test.imageUrl ? (
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-zinc-200">
                        <img src={test.imageUrl} alt={test.name} className="h-full w-full object-cover" />
                      </div>
                    ) : test.videoUrl ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200">
                        <Video className="h-5 w-5 text-zinc-500" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200">
                        <ImageIcon className="h-5 w-5 text-zinc-500" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{test.name}</TableCell>
                  <TableCell>{test.role}</TableCell>
                  <TableCell>
                    <span className="capitalize text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-1 rounded-full border border-zinc-200">
                      {test.type.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(test._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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

      <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Testimonial</DialogTitle>
            <DialogDescription>
              Add a new student testimonial. All changes are saved instantly.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testimonial Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="written">Written Quote</SelectItem>
                        <SelectItem value="video">Video Review</SelectItem>
                        <SelectItem value="success_story">Success Story (Alumni)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
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
                      <FormLabel>Role / Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Alumna" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {(watchType === "written" || watchType === "success_story") && (
                <FormField
                  control={form.control}
                  name="quote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote</FormLabel>
                      <FormControl>
                        <textarea 
                          className="flex min-h-[100px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm"
                          placeholder="What did they say?" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchType === "success_story" && (
                <FormField
                  control={form.control}
                  name="achievement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Achievement</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Raised $50k funding" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="space-y-4">
                {(watchType === "written" || watchType === "success_story") && (
                  <div className="space-y-2">
                    <FormLabel>Profile Image</FormLabel>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                    />
                  </div>
                )}

                {watchType === "video" && (
                  <div className="space-y-2">
                    <FormLabel>Video File</FormLabel>
                    <Input 
                      type="file" 
                      accept="video/*"
                      onChange={(e) => setSelectedVideo(e.target.files?.[0] || null)}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                  ) : "Add Testimonial"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <ConfirmDialog 
        open={confirmState.isOpen} 
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, isOpen: open }))}
        title="Delete Testimonial"
        description="Are you sure you want to delete this testimonial? This action cannot be undone."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
