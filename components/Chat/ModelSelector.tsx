"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Cpu, Cloud } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Model {
  name: string;
  id: string;
  description: string;
  type: "local" | "openai";
  parameters?: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    numThread?: number;
    numGpu?: number;
    batchSize?: number;
  };
}

interface ModelSelectorProps {
  onModelSelect: (modelId: string, parameters?: any) => void;
}

export function ModelSelector({ onModelSelect }: ModelSelectorProps) {
  const [selectedType, setSelectedType] = useState<"local" | "openai">("local");
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("llama3.2");

  useEffect(() => {
    const fetchModels = async () => {
      try {
        // Fetch local models from Ollama
        const ollamaResponse = await fetch("http://localhost:11434/api/tags");
        const ollamaData = await ollamaResponse.json();
        const localModels = ollamaData.models
          .filter((model) => !model.name.includes("embed"))
          .map((model) => ({
            id: model.name,
            name: model.name.replace(":latest", ""),
            type: "local" as const,
            description: `Size: ${model.size}`,
            parameters: {
              temperature: 0.7,
              topP: 0.9,
              maxTokens: 8192,
              numThread: 8,
              numGpu: 1,
              batchSize: 512,
            },
          }));

        // Fetch OpenAI models
        const openAIResponse = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          },
        });
        const openAIData = await openAIResponse.json();
        const openAIModels = openAIData.data
          .filter((model) => model.id.includes("gpt"))
          .map((model) => ({
            id: model.id,
            name: model.id,
            type: "openai" as const,
            description: "OpenAI GPT model",
            parameters: {
              temperature: 0.7,
              topP: 1,
              maxTokens: model.id.includes("gpt-4") ? 8192 : 4096,
            },
          }));

        setModels([...localModels, ...openAIModels]);
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleModelSelect = (modelId: string) => {
    const selectedModel = models.find((m) => m.id === modelId);

    setSelectedModel(modelId);
    onModelSelect(modelId, {
      ...selectedModel?.parameters,
      type: selectedModel?.type,
    });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center space-x-2 p-2 rounded-md bg-muted/50"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading models...</span>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedType("local")}
          className={cn(
            "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
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
            "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
            selectedType === "openai"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          <Cloud className="h-4 w-4" />
          <span>OpenAI</span>
        </motion.button>
      </div>

      <Select onValueChange={handleModelSelect} value={selectedModel}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Model" />
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
              {models
                .filter((m) => m.type === selectedType)
                .map((model) => (
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
    </div>
  );
}
