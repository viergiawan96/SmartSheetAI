"use client";

import { useState, useEffect } from "react";
import { FileUploader } from "@/components/ExcelViewer/FileUploader";
import { DataTable } from "@/components/ExcelViewer/DataTable";
import { ChatInterface } from "@/components/Chat/ChatInterface";
import { DocumentList } from "@/components/DocumentList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Table } from "lucide-react";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import {
  processExcelToDocuments,
  createVectorStore,
  createRAGChain,
} from "@/lib/ollama";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentData } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function Home() {
  const { documents, addDocument, removeDocument } = useDocuments();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"table" | "chat">("table");
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  // Load vector stores from localStorage
  const loadVectorStore = async (doc: DocumentData) => {
    try {
      const documents = await processExcelToDocuments(doc.data);
      return await createVectorStore(
        documents,
        doc.embeddingModel,
        doc.parameters
      );
    } catch (error) {
      console.error("Error recreating vector store:", error);
      return null;
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleUpload = async (
    data: any[],
    embeddingModel: string,
    parameters?: any,
    filename?: string
  ) => {
    setIsLoading(true);
    try {
      const documents = await processExcelToDocuments(data);
      const store = await createVectorStore(
        documents,
        embeddingModel,
        parameters
      );

      const newDoc: DocumentData = {
        id: crypto.randomUUID(),
        name: filename || `Document ${documents.length + 1}`,
        data,
        timestamp: new Date().toISOString(),
        embeddingModel,
        parameters,
      };

      addDocument(newDoc);
      setSelectedDocId(newDoc.id);

      toast({
        title: "Document uploaded",
        description: `${filename} has been processed and is ready for analysis.`,
      });
    } catch (error) {
      console.error("Failed to process documents:", error);
      toast({
        title: "Upload failed",
        description: "There was an error processing your document.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    removeDocument(id);
    if (selectedDocId === id) {
      setSelectedDocId(null);
    }
    toast({
      title: "Document deleted",
      description: "The document has been removed successfully.",
    });
  };

  const handleChat = async (
    message: string,
    model: string,
    parameters?: any
  ) => {
    if (!selectedDocId) {
      return "Please select a document first.";
    }

    const selectedDoc = documents.find((doc) => doc.id === selectedDocId);
    if (!selectedDoc) {
      return "Document not found.";
    }

    try {
      // Recreate vector store from the document data
      const vectorStore = await loadVectorStore(selectedDoc);
      if (!vectorStore) {
        return "Failed to process document data. Please try re-uploading the document.";
      }

      const chain = createRAGChain(vectorStore, model, parameters);
      const response = await chain.invoke({
        question: message,
      });

      return response;
    } catch (error) {
      console.error("Chat error:", error);
      return "Sorry, I encountered an error processing your request.";
    }
  };

  const selectedDocument = documents.find((doc) => doc.id === selectedDocId);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <FileUploader onUpload={handleUpload} isLoading={isLoading} />

          {documents.length > 0 && (
            <div className="space-y-4">
              <DocumentList
                documents={documents}
                selectedId={selectedDocId}
                onSelect={setSelectedDocId}
                onDelete={handleDelete}
              />

              {selectedDocument && (
                <div>
                  <Tabs
                    defaultValue={activeTab}
                    onValueChange={(value) =>
                      setActiveTab(value as "table" | "chat")
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="table"
                        className={cn(
                          "transition-all duration-200",
                          activeTab === "table" &&
                            "data-[state=active]:bg-primary"
                        )}
                      >
                        <Table className="h-4 w-4 mr-2" />
                        Table View
                      </TabsTrigger>
                      <TabsTrigger
                        value="chat"
                        className={cn(
                          "transition-all duration-200",
                          activeTab === "chat" &&
                            "data-[state=active]:bg-primary"
                        )}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat View
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="table" className="mt-4">
                      <DataTable data={selectedDocument.data} />
                    </TabsContent>

                    <TabsContent value="chat" className="mt-4">
                      <ChatInterface
                        onSendMessage={handleChat}
                        type={selectedDocument.parameters?.type}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
