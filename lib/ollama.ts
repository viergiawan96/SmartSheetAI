import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createOpenAIChat, createOpenAIEmbeddings } from "./openai";

const OLLAMA_BASE_URL = "http://localhost:11434";

export const createEmbeddings = (
  model: string,
  type: "local" | "openai" = "local"
) => {
  if (type === "openai") {
    return createOpenAIEmbeddings(model);
  }

  return new OllamaEmbeddings({
    model: model || "nomic-embed-text",
    baseUrl: OLLAMA_BASE_URL,
    requestOptions: {
      numGpu: 1,
      numThread: 8,
      numCtx: 16384,
      temperature: 0.2,
    },
  });
};

export const createLLM = (model: string, parameters?: any) => {
  if (parameters?.type === "openai") {
    return createOpenAIChat(model, parameters);
  }

  return new ChatOllama({
    model,
    baseUrl: OLLAMA_BASE_URL,
    temperature: parameters?.temperature ?? 0.3,
    numCtx: parameters?.maxTokens ?? 16384,
    numGpu: 1,
    numThread: 8,
    format: "json",
    options: {
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
      topK: 30,
      topP: parameters?.topP ?? 0.8,
      stop: ["</answer>"],
      repeatPenalty: 1.2,
    },
  });
};

export const createVectorStore = async (
  documents: Document[],
  embeddingModel: string,
  parameters?: any
) => {
  const embeddings = createEmbeddings(embeddingModel, parameters?.type);
  const vectorStore = await MemoryVectorStore.fromDocuments(
    documents,
    embeddings
  );

  return vectorStore;
};

export const createTextSplitter = () => {
  return new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 500,
    separators: [
      "\n\n\n",
      "\n\n",
      "\n",
      "。",
      ".",
      "！",
      "!",
      "？",
      "?",
      "；",
      ";",
      ":",
      "，",
      ",",
      " ",
      "",
    ],
    keepSeparator: true,
    lengthFunction: (text) => {
      const multiByteLength = text.replace(
        /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
        "_"
      ).length;
      const specialCharsLength = text.replace(/[^a-zA-Z\s]/g, "").length;
      return Math.max(multiByteLength, specialCharsLength);
    },
    trimWhitespace: true,
  });
};

export const processExcelToDocuments = async (data: any[]) => {
  const texts = data.map((row, index) => {
    const entries = Object.entries(row)
      .filter(([_, value]) => value != null)
      .map(([key, value]) => {
        let formattedValue = value;

        if (typeof value === "number") {
          formattedValue = value.toLocaleString("id-ID");
        } else if (value instanceof Date) {
          formattedValue = value.toLocaleDateString("id-ID");
        } else if (typeof value === "object") {
          formattedValue = JSON.stringify(value, null, 2);
        } else {
          formattedValue = String(value).trim();
        }

        const fieldType = typeof value;
        return `${key} (${fieldType}): ${formattedValue}`;
      });

    return {
      pageContent: `Row ${index + 1}:\n${entries.join("\n")}`,
      metadata: {
        rowIndex: index + 1,
        source: "excel_data",
        totalRows: data.length,
        fields: Object.keys(row).join(", "),
        timestamp: new Date().toISOString(),
      },
    };
  });

  const documents = texts.map(
    ({ pageContent, metadata }) => new Document({ pageContent, metadata })
  );

  const textSplitter = createTextSplitter();
  return await textSplitter.splitDocuments(documents);
};

export const createRAGChain = (
  vectorStore: MemoryVectorStore,
  model: string = "llama3.2",
  parameters?: any
) => {
  const totalDocuments = vectorStore.memoryVectors?.length || 0;
  const dynamicK = Math.min(Math.max(Math.ceil(totalDocuments * 0.2), 20), 100);

  const retriever = vectorStore.asRetriever({
    k: dynamicK,
    searchType: "similarity",
    filter: undefined,
    minRelevanceScore: 0.7,
    maxConcurrency: 5,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a precise data analyst specialized in analyzing Excel data.
Your primary task is to provide accurate numerical analysis and counts based on the data.

Guidelines for Data Analysis:
1. Always analyze ALL matching records in the dataset
2. When counting or analyzing data:
   - Consider the entire dataset
   - Double-check your calculations
   - Include the total number of records analyzed
3. For status or category counts:
   - List all unique values found
   - Provide exact counts for each
4. Format numbers using Indonesian locale
5. Always mention the total records analyzed
6. Provide specific row references when applicable

Current Data Context:
{context}

Remember:
- Be extremely precise with numbers
- Analyze ALL instances, not just the first few
- Verify calculations multiple times
- Consider the entire dataset
- State if data appears incomplete or inconsistent`,
    ],
    ["human", "{question}"],
  ]);

  const llm = createLLM(model, parameters);

  const chain = RunnableSequence.from([
    {
      context: async (input: any) => {
        try {
          const docs = await retriever.invoke(input.question);
          if (!Array.isArray(docs) || docs.length === 0) {
            return "No relevant data found in the dataset.";
          }

          const totalDocuments = docs[0].metadata.totalRows || "unknown";
          const relevantContent = docs
            .map((doc) => doc.pageContent)
            .join("\n\n");

          return `Total Records in Dataset: ${totalDocuments}\n\nRelevant Data:\n${relevantContent}`;
        } catch (error) {
          console.error("Retriever error:", error);
          return "Error accessing the relevant data.";
        }
      },
      question: (input: any) => input.question,
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return {
    invoke: async (input: { question: string }) => {
      try {
        const response = await chain.invoke(input);
        if (!response || response === "") {
          return "I apologize, but I couldn't find enough relevant information to answer your question accurately. Could you please rephrase or provide more context?";
        }
        return response;
      } catch (error) {
        console.error("RAG Chain error:", error);
        return "I encountered an error while processing your request. This might be due to the complexity of the query or data limitations. Could you try simplifying your question?";
      }
    },
  };
};
