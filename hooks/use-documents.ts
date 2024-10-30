import { useLocalStorage } from "./use-local-storage";
import { DocumentData } from "@/types";

export function useDocuments() {
  const [documents, setDocuments] = useLocalStorage<DocumentData[]>(
    "excel_documents",
    []
  );

  const addDocument = (newDoc: DocumentData) => {
    setDocuments((prev) => [...prev, newDoc]);
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const updateDocument = (id: string, updates: Partial<DocumentData>) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
    );
  };

  return {
    documents,
    addDocument,
    removeDocument,
    updateDocument,
  };
}
