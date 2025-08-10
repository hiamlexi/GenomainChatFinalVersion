const fs = require("fs").promises;
const path = require("path");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

class TextExtractor {
  static async extract(filePath, mimeType) {
    const extension = path.extname(filePath).toLowerCase();
    
    try {
      switch (extension) {
        case ".pdf":
          return await this.extractPDF(filePath);
        case ".txt":
        case ".text":
        case ".md":
        case ".markdown":
        case ".log":
        case ".csv":
        case ".json":
        case ".xml":
        case ".html":
        case ".htm":
        case ".js":
        case ".jsx":
        case ".ts":
        case ".tsx":
        case ".py":
        case ".java":
        case ".c":
        case ".cpp":
        case ".h":
        case ".css":
        case ".scss":
        case ".sass":
        case ".yaml":
        case ".yml":
        case ".toml":
        case ".ini":
        case ".cfg":
        case ".conf":
        case ".sh":
        case ".bash":
        case ".zsh":
        case ".fish":
        case ".sql":
          return await this.extractPlainText(filePath);
        case ".doc":
        case ".docx":
          return await this.extractDOCX(filePath);
        default:
          // Try to read as plain text for unknown extensions
          return await this.extractPlainText(filePath);
      }
    } catch (error) {
      console.error(`Error extracting text from ${filePath}:`, error);
      throw error;
    }
  }

  static async extractPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      
      // Clean up the text - remove excessive whitespace and empty lines
      const cleanedText = data.text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
      
      return {
        text: cleanedText,
        pageCount: data.numpages,
        info: data.info
      };
    } catch (error) {
      console.error("PDF extraction error:", error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  static async extractPlainText(filePath) {
    try {
      const text = await fs.readFile(filePath, 'utf-8');
      return {
        text: text.trim(),
        pageCount: 1,
        info: {
          fileName: path.basename(filePath)
        }
      };
    } catch (error) {
      console.error("Plain text extraction error:", error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  static async extractDOCX(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      
      if (result.messages && result.messages.length > 0) {
        console.warn("DOCX extraction warnings:", result.messages);
      }
      
      // Clean up the text
      const cleanedText = result.value
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
      
      return {
        text: cleanedText,
        pageCount: 1,
        info: {
          fileName: path.basename(filePath)
        }
      };
    } catch (error) {
      console.error("DOCX extraction error:", error);
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  static async extractFromBuffer(buffer, mimeType, fileName = "uploaded_file") {
    const extension = path.extname(fileName).toLowerCase();
    
    try {
      if (mimeType === "application/pdf" || extension === ".pdf") {
        const data = await pdf(buffer);
        const cleanedText = data.text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        
        return {
          text: cleanedText,
          pageCount: data.numpages,
          info: data.info
        };
      } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType === "application/msword" ||
        extension === ".docx" ||
        extension === ".doc"
      ) {
        const result = await mammoth.extractRawText({ buffer });
        const cleanedText = result.value
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        
        return {
          text: cleanedText,
          pageCount: 1,
          info: { fileName }
        };
      } else {
        // Try to read as plain text
        const text = buffer.toString('utf-8');
        return {
          text: text.trim(),
          pageCount: 1,
          info: { fileName }
        };
      }
    } catch (error) {
      console.error(`Error extracting text from buffer:`, error);
      throw error;
    }
  }
}

module.exports = { TextExtractor };