"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessage } from "./StreamingMessage";
import { ModelSelector } from "./ModelSelector";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ModelParameters {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  type?: "local" | "openai";
}

interface ChatInterfaceProps {
  onSendMessage: (
    message: string,
    model: string,
    parameters?: ModelParameters
  ) => Promise<string>;
  type?: "local" | "openai";
}

export function ChatInterface({
  onSendMessage,
  type = "local",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    type === "local" ? "llama3.2" : "gpt-3.5-turbo"
  );
  const [streamedText, setStreamedText] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [modelParameters, setModelParameters] = useState<ModelParameters>({
    temperature: 0.7,
    topP: type === "local" ? 0.9 : 1,
    maxTokens: type === "local" ? 8192 : 4096,
    type,
  });

  // Update parameters when type changes
  useEffect(() => {
    setModelParameters((prev) => ({
      ...prev,
      type,
      topP: type === "local" ? 0.9 : 1,
      maxTokens: type === "local" ? 8192 : 4096,
    }));
    setSelectedModel(type === "local" ? "llama3.2" : "gpt-3.5-turbo");
  }, [type]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      setTimeout(() => {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedText]);

  const simulateStreaming = async (text: string) => {
    const words = text.split(" ");
    setStreamedText("");

    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      setStreamedText((prev) => prev + (i === 0 ? "" : " ") + words[i]);
    }

    return text;
  };

  const handleModelSelect = (modelId: string, parameters?: ModelParameters) => {
    setSelectedModel(modelId);
    console.log(parameters);

    if (parameters) {
      // Ensure we keep the current type when updating parameters
      setModelParameters({
        ...parameters,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    const messageId = Date.now().toString();

    setMessages((prev) => [
      ...prev,
      { id: `user-${messageId}`, role: "user", content: userMessage },
    ]);

    setIsLoading(true);
    setStreamedText("");

    try {
      const response = await onSendMessage(userMessage, selectedModel, {
        ...modelParameters,
      });
      await simulateStreaming(response);

      setMessages((prev) => [
        ...prev,
        { id: `assistant-${messageId}`, role: "assistant", content: response },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${messageId}`,
          role: "assistant",
          content: "Sorry, I encountered an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamedText("");
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Card className="flex flex-col h-[600px] p-4">
      <div className="mb-4">
        <ModelSelector onModelSelect={handleModelSelect} />
      </div>

      <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            <motion.div layout className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && streamedText && (
                <StreamingMessage text={streamedText} />
              )}
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your data..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className={cn(
            "transition-all duration-200",
            isLoading ? "opacity-50" : "hover:scale-105"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </Card>
  );
}
