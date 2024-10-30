export interface DocumentData {
  id: string;
  name: string;
  data: any[];
  timestamp: string;
  embeddingModel: string;
  parameters?: any;
}

export interface VectorStoreData {
  documentId: string;
  store: any;
}
