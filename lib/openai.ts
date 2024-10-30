import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const fetchOpenAIModels = async () => {
  try {
    const response = await openai.models.list();

    const chatModels = response.data
      .filter(
        (model) => model.id.includes("gpt-3.5") || model.id.includes("gpt-4")
      )
      .map((model) => ({
        id: model.id,
        name: model.id
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        description: "OpenAI GPT model",
        type: "openai" as const,
        parameters: {
          temperature: 0.7,
          topP: 1,
          maxTokens: model.id.includes("gpt-4") ? 8192 : 4096,
        },
      }));

    const embeddingModels = [
      {
        id: "text-embedding-3-small",
        name: "Text Embedding 3 Small",
        description: "Efficient, lower dimensional embeddings",
        type: "openai" as const,
      },
      {
        id: "text-embedding-3-large",
        name: "Text Embedding 3 Large",
        description: "High-performance embeddings",
        type: "openai" as const,
      },
    ];

    return { chatModels, embeddingModels };
  } catch (error) {
    console.error("Failed to fetch OpenAI models:", error);
    return {
      chatModels: [],
      embeddingModels: [
        {
          id: "text-embedding-3-small",
          name: "Text Embedding 3 Small",
          description: "Efficient, lower dimensional embeddings",
          type: "openai" as const,
        },
        {
          id: "text-embedding-3-large",
          name: "Text Embedding 3 Large",
          description: "High-performance embeddings",
          type: "openai" as const,
        },
      ],
    };
  }
};

export const createOpenAIChat = (model: string, parameters?: any) => {
  return new ChatOpenAI({
    modelName: model,
    openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    temperature: parameters?.temperature ?? 0.7,
    maxTokens: parameters?.maxTokens,
    topP: parameters?.topP ?? 1,
  });
};

export const createOpenAIEmbeddings = (model: string) => {
  return new OpenAIEmbeddings({
    modelName: model,
    openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dimensions: model.includes("small") ? 512 : 1536,
    stripNewLines: true,
  });
};
