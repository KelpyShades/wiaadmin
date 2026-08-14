"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Image as ImageIcon,
  Sliders,
  Calendar,
  DollarSign,
  Landmark,
  Globe,
  Coins,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

const settingsSchema = z.object({
  heroQuote: z.string().min(5, "Hero quote must be at least 5 characters"),
  heroQuoteAuthor: z.string().min(2, "Author is required"),
  seatsAvailable: z.number().min(1, "Must allow at least 1 seat"),
  deadlineDate: z.string().min(2, "Deadline date is required"),
  startDate: z.string().min(2, "Start date is required"),
  stat1Value: z.string().min(1, "Stat 1 value is required"),
  stat1Label: z.string().min(1, "Stat 1 label is required"),
  stat2Value: z.string().min(1, "Stat 2 value is required"),
  stat2Label: z.string().min(1, "Stat 2 label is required"),
  stat3Value: z.string().min(1, "Stat 3 value is required"),
  stat3Label: z.string().min(1, "Stat 3 label is required"),
  foundationTotal: z.number().min(0, "Must be positive number"),
  foundationSecure: z.number().min(0, "Must be positive number"),
  foundationInstallment1Amount: z.number().min(0, "Must be positive number"),
  foundationInstallment1Month: z.string().min(1, "Month is required"),
  foundationInstallment2Amount: z.number().min(0, "Must be positive number"),
  foundationInstallment2Month: z.string().min(1, "Month is required"),
  fullExpTotal: z.number().min(0, "Must be positive number"),
  fullExpSecure: z.number().min(0, "Must be positive number"),
  fullExpInstallment1Amount: z.number().min(0, "Must be positive number"),
  fullExpInstallment1Month: z.string().min(1, "Month is required"),
  fullExpInstallment2Amount: z.number().min(0, "Must be positive number"),
  fullExpInstallment2Month: z.string().min(1, "Month is required"),
  bankAccountName: z.string().min(1, "Required"),
  bankAccountNumber: z.string().min(1, "Required"),
  bankName: z.string().min(1, "Required"),
  usdBankAccountName: z.string().optional(),
  usdBankAccountNumber: z.string().optional(),
  usdBankName: z.string().optional(),
  usdRoutingNumber: z.string().optional(),
  usdSwiftCode: z.string().optional(),
  eurBankAccountName: z.string().optional(),
  eurIban: z.string().optional(),
  eurBankName: z.string().optional(),
  eurSwiftCode: z.string().optional(),
});

type FormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const settings = useQuery(api.globalSettings.getGlobalSettings);
  const updateSettings = useMutation(api.globalSettings.updateGlobalSettings);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      heroQuote: "",
      heroQuoteAuthor: "",
      seatsAvailable: 5,
      deadlineDate: "",
      startDate: "",
      stat1Value: "",
      stat1Label: "",
      stat2Value: "",
      stat2Label: "",
      stat3Value: "",
      stat3Label: "",
      foundationTotal: 0,
      foundationSecure: 0,
      foundationInstallment1Amount: 0,
      foundationInstallment1Month: "",
      foundationInstallment2Amount: 0,
      foundationInstallment2Month: "",
      fullExpTotal: 0,
      fullExpSecure: 0,
      fullExpInstallment1Amount: 0,
      fullExpInstallment1Month: "",
      fullExpInstallment2Amount: 0,
      fullExpInstallment2Month: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankName: "",
      usdBankAccountName: "",
      usdBankAccountNumber: "",
      usdBankName: "",
      usdRoutingNumber: "",
      usdSwiftCode: "",
      eurBankAccountName: "",
      eurIban: "",
      eurBankName: "",
      eurSwiftCode: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        heroQuote: settings.heroQuote,
        heroQuoteAuthor: settings.heroQuoteAuthor,
        seatsAvailable: settings.seatsAvailable,
        deadlineDate: settings.deadlineDate,
        startDate: settings.startDate,
        stat1Value: settings.stat1Value,
        stat1Label: settings.stat1Label,
        stat2Value: settings.stat2Value,
        stat2Label: settings.stat2Label,
        stat3Value: settings.stat3Value,
        stat3Label: settings.stat3Label,
        foundationTotal: settings.foundationTotal,
        foundationSecure: settings.foundationSecure,
        foundationInstallment1Amount: settings.foundationInstallment1Amount,
        foundationInstallment1Month: settings.foundationInstallment1Month,
        foundationInstallment2Amount: settings.foundationInstallment2Amount,
        foundationInstallment2Month: settings.foundationInstallment2Month,
        fullExpTotal: settings.fullExpTotal,
        fullExpSecure: settings.fullExpSecure,
        fullExpInstallment1Amount: settings.fullExpInstallment1Amount,
        fullExpInstallment1Month: settings.fullExpInstallment1Month,
        fullExpInstallment2Amount: settings.fullExpInstallment2Amount,
        fullExpInstallment2Month: settings.fullExpInstallment2Month,
        bankAccountName: settings.bankAccountName || "",
        bankAccountNumber: settings.bankAccountNumber || "",
        bankName: settings.bankName || "",
        usdBankAccountName: settings.usdBankAccountName || "",
        usdBankAccountNumber: settings.usdBankAccountNumber || "",
        usdBankName: settings.usdBankName || "",
        usdRoutingNumber: settings.usdRoutingNumber || "",
        usdSwiftCode: settings.usdSwiftCode || "",
        eurBankAccountName: settings.eurBankAccountName || "",
        eurIban: settings.eurIban || "",
        eurBankName: settings.eurBankName || "",
        eurSwiftCode: settings.eurSwiftCode || "",
      });
    }
  }, [settings, form]);

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
      let heroImageId: Id<"_storage"> | undefined = undefined;

      if (selectedImage) {
        heroImageId = await handleUpload(selectedImage);
      } else if (settings?.heroImageId) {
        heroImageId = settings.heroImageId;
      }

      await updateSettings({
        ...values,
        heroImageId,
      });

      setSelectedImage(null);
      alert("Successfully updated Global Settings!");
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (settings === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Global Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure shared content, cohorts, and packages across the main site.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="hero" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="hero" className="flex items-center gap-2">
                <Sliders className="h-4 w-4" /> Hero & Quote
              </TabsTrigger>
              <TabsTrigger value="cohort" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Cohort & Stats
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Pricing & Tiers
              </TabsTrigger>
              <TabsTrigger value="bank" className="flex items-center gap-2">
                <Landmark className="h-4 w-4" /> Bank Details
              </TabsTrigger>
            </TabsList>

            {/* TAB: HERO SECTION */}
            <TabsContent value="hero" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Hero Quote</CardTitle>
                    <CardDescription>
                      Configure the featured quote card on the landing page.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="heroQuote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quote Text</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="We are women of excellence..."
                              className="min-h-25"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="heroQuoteAuthor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quote Author</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Emanuella Ulamba, Founder"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hero Image</CardTitle>
                    <CardDescription>
                      Upload a high-quality portrait to display in the editorial
                      hero.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-lg border-zinc-200 bg-zinc-50/50">
                      {settings.imageUrl ? (
                        <div className="aspect-3/4 w-full max-w-40 overflow-hidden rounded-lg border border-zinc-200 shadow-sm mb-4">
                          <Image
                            src={settings.imageUrl}
                            alt="Current Hero"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <ImageIcon className="h-12 w-12 text-zinc-300 mb-2" />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setSelectedImage(e.target.files?.[0] || null)
                        }
                        className="max-w-xs mt-2"
                      />
                      <p className="text-xs text-zinc-500 mt-2">
                        {selectedImage
                          ? `Selected: ${selectedImage.name}`
                          : "Leave empty to keep current image"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB: COHORT DETAILS */}
            <TabsContent value="cohort" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cohort Schedule & Availability</CardTitle>
                    <CardDescription>
                      Set the size limit, application deadline, and starting
                      date of the upcoming cohort.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="seatsAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seats Available</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Number of spots open for enrollment (e.g. 5)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deadlineDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application Deadline</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. July 18, 2026"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cohort Start Date</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. July 27, 2026"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Badges / Stats Section</CardTitle>
                    <CardDescription>
                      Edit the three prominent numbers and labels displayed on
                      the landing page.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stat1Value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stat 1 Value</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stat1Label"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stat 1 Label</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Cohorts" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stat2Value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stat 2 Value</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 6" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stat2Label"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stat 2 Label</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Months" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stat3Value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stat 3 Value</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 7" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stat3Label"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stat 3 Label</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Pillars" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB: PRICING & INSTALLMENTS */}
            <TabsContent value="pricing" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* FOUNDATION PACK */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-plum">
                      The Foundation (Tier 1)
                    </CardTitle>
                    <CardDescription>
                      Setup pricing and monthly payment installments for the
                      Foundation tier.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="foundationTotal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Payment (GH₵)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="foundationSecure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secure Seat Amount (GH₵)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h4 className="text-sm font-semibold text-zinc-900">
                        Installment Schedule
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="foundationInstallment1Month"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>1st Installment Month</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. August" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="foundationInstallment1Amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>1st Installment (GH₵)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="foundationInstallment2Month"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>2nd Installment Month</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. September"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="foundationInstallment2Amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>2nd Installment (GH₵)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* FULL EXPERIENCE PACK */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-soft-gold">
                      The Full Experience (Tier 2)
                    </CardTitle>
                    <CardDescription>
                      Setup pricing and monthly payment installments for the
                      Full Experience tier.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullExpTotal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Payment (GH₵)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fullExpSecure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secure Seat Amount (GH₵)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h4 className="text-sm font-semibold text-zinc-900">
                        Installment Schedule
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fullExpInstallment1Month"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>1st Installment Month</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. August" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fullExpInstallment1Amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>1st Installment (GH₵)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fullExpInstallment2Month"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>2nd Installment Month</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. September"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fullExpInstallment2Amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>2nd Installment (GH₵)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB: BANK DETAILS */}
            <TabsContent value="bank" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Local African Account */}
                <Card className="border border-emerald-100 shadow-sm">
                  <CardHeader className="bg-emerald-50/50 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-emerald-800 flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-emerald-600" />
                        African Account
                      </CardTitle>
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                        Local Currency
                      </span>
                    </div>
                    <CardDescription>
                      Default bank details for GHS and other African transfers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    <FormField
                      control={form.control}
                      name="bankAccountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Women of Influence Academy"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="GT Bank" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* USD Account */}
                <Card className="border border-blue-100 shadow-sm">
                  <CardHeader className="bg-blue-50/50 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-blue-800 flex items-center gap-2">
                        <Coins className="h-5 w-5 text-blue-600" />
                        USD Account (Accrue)
                      </CardTitle>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        USD Currency
                      </span>
                    </div>
                    <CardDescription>
                      USD account details for international sponsors outside Africa.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    <FormField
                      control={form.control}
                      name="usdBankAccountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Women of Influence Academy (USD)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="usdBankAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="usdBankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Accrue Bank USA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="usdRoutingNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Routing Number</FormLabel>
                          <FormControl>
                            <Input placeholder="123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="usdSwiftCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SWIFT / BIC Code</FormLabel>
                          <FormControl>
                            <Input placeholder="ABCBUS33XXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* EUR Account */}
                <Card className="border border-purple-100 shadow-sm">
                  <CardHeader className="bg-purple-50/50 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-purple-800 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-purple-600" />
                        EUR Account (Accrue)
                      </CardTitle>
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                        EUR Currency
                      </span>
                    </div>
                    <CardDescription>
                      EUR account details for international sponsors outside Africa.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    <FormField
                      control={form.control}
                      name="eurBankAccountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Women of Influence Academy (EUR)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="eurIban"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IBAN</FormLabel>
                          <FormControl>
                            <Input placeholder="EU12345678901234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="eurBankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Accrue Bank Europe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="eurSwiftCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SWIFT / BIC Code</FormLabel>
                          <FormControl>
                            <Input placeholder="ABCBEE22XXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            type="submit"
            disabled={isSaving}
            className="w-full md:w-auto px-8"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                Settings...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
