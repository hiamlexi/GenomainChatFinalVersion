const { loadSummarizationChain } = require("langchain/chains");
const { PromptTemplate } = require("@langchain/core/prompts");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const Provider = require("../providers/ai-provider");
/**
 * @typedef {Object} LCSummarizationConfig
 * @property {string} provider The LLM to use for summarization (inherited)
 * @property {string} model The LLM Model to use for summarization (inherited)
 * @property {AbortController['signal']} controllerSignal Abort controller to stop recursive summarization
 * @property {string} content The text content of the text to summarize
 */

/**
 * Summarize content using LLM LC-Chain call
 * @param {LCSummarizationConfig} The LLM to use for summarization (inherited)
 * @returns {Promise<string>} The summarized content.
 */
async function summarizeContent({
  provider = "openai",
  model = null,
  controllerSignal,
  content,
}) {
  const llm = Provider.LangChainChatModel(provider, {
    temperature: 0,
    model: model,
  });

  const textSplitter = new RecursiveCharacterTextSplitter({
    separators: ["\n\n", "\n"],
    chunkSize: 10000,
    chunkOverlap: 500,
  });
  const docs = await textSplitter.createDocuments([content]);

  const mapPrompt = `
      Write a detailed summary of the following text for a research purpose:
      "{text}"
      SUMMARY:
      `;

  const mapPromptTemplate = new PromptTemplate({
    template: mapPrompt,
    inputVariables: ["text"],
  });

  // This convenience function creates a document chain prompted to summarize a set of documents.
  // Using "stuff" type instead of "map_reduce" to avoid multiple API calls
  // This will concatenate all documents and summarize in a single call
  const chain = loadSummarizationChain(llm, {
    type: "stuff", // Changed from "map_reduce" to "stuff" for single API call
    prompt: mapPromptTemplate,
    verbose: false, // Disabled verbose to avoid interference with response
  });

  const res = await chain.call({
    ...(controllerSignal ? { signal: controllerSignal } : {}),
    input_documents: docs,
  });

  return res.text;
}

module.exports = { summarizeContent };
