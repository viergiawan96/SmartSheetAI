"use client";

import { useCallback, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, FileSpreadsheet, Cloud, Cpu } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { processExcelFile } from "@/lib/excel";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FileUploaderProps {
  onUpload: (
    data: any[],
    model: string,
    parameters?: any,
    filename?: string
  ) => void;
  isLoading: boolean;
}

export function FileUploader({ onUpload, isLoading }: FileUploaderProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<"local" | "openai">("local");
  const [selectedModel, setSelectedModel] = useState("nomic-embed-text");

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;

      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const buffer = e.target?.result as ArrayBuffer;
            const { data } = processExcelFile(buffer);

            if (!data || data.length === 0) {
              toast({
                title: "Error",
                description: "The Excel file appears to be empty",
                variant: "destructive",
              });
              return;
            }

            const parameters = {
              type: selectedType,
              ...(selectedType === "openai" && {
                apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
              }),
            };

            onUpload(data, selectedModel, parameters, file.name);

            toast({
              title: "Success",
              description: `File "${file.name}" uploaded successfully`,
            });
          } catch (error) {
            console.error("Error processing Excel file:", error);
            toast({
              title: "Error",
              description: "Failed to process the Excel file",
              variant: "destructive",
            });
          }
        };

        reader.onerror = () => {
          toast({
            title: "Error",
            description: "Failed to read the file",
            variant: "destructive",
          });
        };

        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error uploading file:", error);
        toast({
          title: "Error",
          description: "Failed to upload the file",
          variant: "destructive",
        });
      }
    },
    [onUpload, selectedModel, selectedType, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const embedModels = {
    local: [
      {
        id: "nomic-embed-text",
        name: "Nomic Embed Text",
        description: "262MB - Local embedding model",
      },
      {
        id: "mxbai-embed-large",
        name: "MXBai Embed Large",
        description: "669MB - High performance embeddings",
      },
    ],
    openai: [
      {
        id: "text-embedding-3-small",
        name: "Text Embedding 3 Small",
        description: "Efficient, lower dimensional embeddings",
      },
      {
        id: "text-embedding-3-large",
        name: "Text Embedding 3 Large",
        description: "High-performance embeddings",
      },
    ],
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        dragActive
          ? "border-2 border-dashed border-primary ring-2 ring-primary/20"
          : "border border-border hover:border-primary/50",
        "p-8"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mx-auto mb-4 rounded-full bg-primary/10 p-4 ring-8 ring-primary/5">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Upload Excel File</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Drag and drop your Excel file here, or click to browse.
            <br />
            We support .xlsx and .xls formats.
          </p>
        </motion.div>

        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedType("local")}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-md transition-colors",
                selectedType === "local"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <Cpu className="h-4 w-4" />
              <span>Local</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedType("openai")}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-md transition-colors",
                selectedType === "openai"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <Cloud className="h-4 w-4" />
              <span>OpenAI</span>
            </motion.button>
          </div>

          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger>
              <SelectValue placeholder="Select embedding model" />
            </SelectTrigger>
            <SelectContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedType}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {embedModels[selectedType].map((model) => (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      className="transition-colors hover:bg-accent"
                    >
                      <motion.div
                        className="flex flex-col py-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </motion.div>
                    </SelectItem>
                  ))}
                </motion.div>
              </AnimatePresence>
            </SelectContent>
          </Select>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleButtonClick}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Browse Files
                </>
              )}
            </Button>
          </motion.div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      {dragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-primary animate-bounce" />
            <p className="mt-2 text-lg font-medium">Drop your file here</p>
          </div>
        </motion.div>
      )}
    </Card>
  );
}
