"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheet, Trash2, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { DocumentData } from "@/types";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DocumentListProps {
  documents: DocumentData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DocumentList({
  documents,
  selectedId,
  onSelect,
  onDelete,
}: DocumentListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDocumentToDelete(id);
    setIsOpen(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      onDelete(documentToDelete);
      setIsOpen(false);
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {documents.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={cn(
              "group relative flex items-center justify-between p-4 rounded-lg border transition-all duration-200",
              selectedId === doc.id
                ? "bg-primary/5 border-primary/30 shadow-sm"
                : "bg-background hover:bg-accent/50 border-border/50",
              "cursor-pointer"
            )}
            onClick={() => onSelect(doc.id)}
          >
            <div className="flex items-center space-x-4">
              <div
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  selectedId === doc.id ? "bg-primary/10" : "bg-muted"
                )}
              >
                <FileSpreadsheet
                  className={cn(
                    "h-5 w-5",
                    selectedId === doc.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
              </div>
              <div>
                <h3 className="font-medium text-sm">{doc.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Uploaded {formatDistanceToNow(new Date(doc.timestamp))} ago
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity",
                  "hover:bg-destructive/10 hover:text-destructive"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(doc.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <ChevronRight
                className={cn(
                  "h-5 w-5 transition-transform",
                  selectedId === doc.id && "rotate-90",
                  "text-muted-foreground"
                )}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
