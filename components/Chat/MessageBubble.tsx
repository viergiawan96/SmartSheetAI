"use client";

import { Bot, User, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function formatMessage(content: string) {
  // Check if the message contains numerical data
  if (content.match(/\d+/)) {
    return (
      <Card className="p-6 bg-background/50 border-primary/10">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/50 pb-4">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-primary">Analysis Result</h3>
              <p className="text-xs text-muted-foreground">
                Statistical overview of your data
              </p>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                strong: ({ node, ...props }) => (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center justify-center px-2 py-0.5 text-lg font-semibold text-primary bg-primary/10 rounded"
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="leading-relaxed"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <motion.ul
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-2 my-4"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <motion.li
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-2"
                    {...props}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                    <span>{props.children}</span>
                  </motion.li>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </Card>
    );
  }

  // For regular text messages
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-start space-x-2 mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="w-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[90%] rounded-lg px-4 py-2",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {formatMessage(message.content)}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          <User className="w-4 w-4 text-primary-foreground" />
        </div>
      )}
    </motion.div>
  );
}
