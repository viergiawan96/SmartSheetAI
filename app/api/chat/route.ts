import { NextRequest, NextResponse } from "next/server";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();

    const model = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "llama3.2",
    });

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a helpful assistant that answers questions based on the provided Excel data context. Context: {context}",
      ],
      ["human", "{message}"],
    ]);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const response = await chain.invoke({
      message,
      context,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
