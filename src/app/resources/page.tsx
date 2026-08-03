"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, BookOpen, Mic, Video, Link, FileText, Globe, Award, HelpCircle } from "lucide-react";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Category Form Schema
const categorySchema = z.object({
  title: z.string().min(2, "Category title is required"),
  iconType: z.enum(["BookOpen", "Mic", "Video", "Link", "FileText", "Globe", "Award", "HelpCircle"]),
});

// Resource Form Schema
const resourceSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(2, "Resource title is required"),
  description: z.string().optional(),
  url: z.string().url("Must be a valid URL").or(z.literal("")).or(z.literal("#")),
});

type CategoryFormValues = z.infer<typeof categorySchema>;
type ResourceFormValues = z.infer<typeof resourceSchema>;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  BookOpen: BookOpen,
  Mic: Mic,
  Video: Video,
  Link: Link,
  FileText: FileText,
  Globe: Globe,
  Award: Award,
  HelpCircle: HelpCircle,
};

export default function ResourcesPage() {
  const data = useQuery(api.resources.getResources);
  const addCategory = useMutation(api.resources.addCategory);
  const deleteCategory = useMutation(api.resources.deleteCategory);
  const addResource = useMutation(api.resources.addResource);
  const deleteResource = useMutation(api.resources.deleteResource);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isResourceOpen, setIsResourceOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [confirmCatState, setConfirmCatState] = useState<{
    isOpen: boolean;
    catId: Id<"resourceCategories"> | null;
  }>({
    isOpen: false,
    catId: null,
  });

  const [confirmResState, setConfirmResState] = useState<{
    isOpen: boolean;
    resId: Id<"resources"> | null;
  }>({
    isOpen: false,
    resId: null,
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      title: "",
      iconType: "BookOpen",
    },
  });

  const resourceForm = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      categoryId: "",
      title: "",
      description: "",
      url: "",
    },
  });

  const onCategorySubmit = async (values: CategoryFormValues) => {
    setIsSaving(true);
    try {
      await addCategory(values);
      setIsCategoryOpen(false);
      categoryForm.reset();
    } catch (err) {
      console.error(err);
      alert("Failed to add category");
    } finally {
      setIsSaving(false);
    }
  };

  const onResourceSubmit = async (values: ResourceFormValues) => {
    setIsSaving(true);
    try {
      await addResource({
        categoryId: values.categoryId as Id<"resourceCategories">,
        title: values.title,
        description: values.description || undefined,
        url: values.url || undefined,
      });
      setIsResourceOpen(false);
      resourceForm.reset();
    } catch (err) {
      console.error(err);
      alert("Failed to add resource");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!confirmCatState.catId) return;
    try {
      await deleteCategory({ id: confirmCatState.catId });
      setConfirmCatState({ isOpen: false, catId: null });
    } catch (err) {
      console.error(err);
      alert("Failed to delete category");
    }
  };

  const handleDeleteResource = async () => {
    if (!confirmResState.resId) return;
    try {
      await deleteResource({ id: confirmResState.resId });
      setConfirmResState({ isOpen: false, resId: null });
    } catch (err) {
      console.error(err);
      alert("Failed to delete resource");
    }
  };

  const handleOpenAddResource = (categoryId: string) => {
    resourceForm.reset({
      categoryId,
      title: "",
      description: "",
      url: "",
    });
    setIsResourceOpen(true);
  };

  if (data === undefined) {
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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Curated Resources</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure reading materials, podcasts, videos, and guides for the growth of your cohort candidates.
          </p>
        </div>
        <Button onClick={() => setIsCategoryOpen(true)} className="flex items-center gap-2 w-fit">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {data.length === 0 ? (
          <div className="col-span-full border border-dashed rounded-lg p-12 text-center text-zinc-500 bg-white">
            No resource categories found. Create a category to start organizing resources!
          </div>
        ) : (
          data.map((cat) => {
            const Icon = ICON_MAP[cat.iconType] || HelpCircle;
            return (
              <Card key={cat._id} className="flex flex-col justify-between">
                <CardHeader className="flex flex-row items-start justify-between pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-plum/10 text-plum rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-zinc-900">{cat.title}</CardTitle>
                      <CardDescription className="text-xs text-zinc-500">
                        {cat.items?.length || 0} resource items
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                    onClick={() => setConfirmCatState({ isOpen: true, catId: cat._id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 pt-4 space-y-4">
                  <ul className="space-y-4">
                    {!cat.items || cat.items.length === 0 ? (
                      <li className="text-sm text-zinc-500 italic text-center py-4">
                        No resources under this category.
                      </li>
                    ) : (
                      cat.items.map((item) => (
                        <li key={item._id} className="flex items-start justify-between gap-4 p-2.5 rounded-lg border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                          <div className="space-y-1">
                            <span className="text-sm font-semibold text-zinc-900 block">{item.title}</span>
                            {item.description && (
                              <p className="text-xs text-zinc-500 leading-normal max-w-xs">{item.description}</p>
                            )}
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-plum font-semibold hover:underline inline-block"
                              >
                                Link &rarr;
                              </a>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 mt-0.5 shrink-0"
                            onClick={() => setConfirmResState({ isOpen: true, resId: item._id })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))
                    )}
                  </ul>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 flex items-center justify-center gap-1.5 border-dashed text-zinc-600 hover:text-zinc-900"
                    onClick={() => handleOpenAddResource(cat._id)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Resource Item
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* DIALOG: ADD CATEGORY */}
      <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new grouping for resource materials.</DialogDescription>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4 pt-4">
              <FormField
                control={categoryForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Recommended Books" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="iconType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an icon type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(ICON_MAP).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsCategoryOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Category
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ADD RESOURCE ITEM */}
      <Dialog open={isResourceOpen} onOpenChange={setIsResourceOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Add Resource Item</DialogTitle>
            <DialogDescription>Add a new file, book link, podcast, or tool link under this category.</DialogDescription>
          </DialogHeader>
          <Form {...resourceForm}>
            <form onSubmit={resourceForm.handleSubmit(onResourceSubmit)} className="space-y-4 pt-4">
              <FormField
                control={resourceForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. The Goal Digger Podcast" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resourceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Brené Brown's essential guide to brave leadership..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resourceForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Link (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. https://spotify.com/podcast (or #)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsResourceOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Resource
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE CATEGORY */}
      <ConfirmDialog
        open={confirmCatState.isOpen}
        onOpenChange={(open) => setConfirmCatState(prev => ({ ...prev, isOpen: open }))}
        title="Delete Category"
        description="Are you sure you want to delete this category and all resources under it? This action cannot be undone."
        onConfirm={handleDeleteCategory}
      />

      {/* CONFIRM DELETE RESOURCE */}
      <ConfirmDialog
        open={confirmResState.isOpen}
        onOpenChange={(open) => setConfirmResState(prev => ({ ...prev, isOpen: open }))}
        title="Delete Resource Item"
        description="Are you sure you want to delete this resource item? This action cannot be undone."
        onConfirm={handleDeleteResource}
      />
    </div>
  );
}
