import { Router, Request, Response } from "express";
import multer from "multer";
import { AudioToTextService } from "../services/AudioToTextService";
import { ConversationService } from "../services/ConversationService";
import { Clients } from "../types";

// Define interfaces for request and response types
interface ConversationResponse {
  text: string;
  translation: string;
  success: boolean;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  success: boolean;
  timestamp: string;
}

// Use memory storage for better performance
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
  },
});

// Helper function to create standardized error response
const createErrorResponse = (
  message: string,
  statusCode: number = 500
): ErrorResponse => ({
  error: message,
  success: false,
  timestamp: new Date().toISOString(),
});

// Helper function to create standardized success response
const createSuccessResponse = (data: {
  text: string;
  translation: string;
}): ConversationResponse => {
  return {
    text: data.text,
    translation: data.translation,
    success: true,
    timestamp: new Date().toISOString(),
  };
};

export const createRoutes = (clients: Clients) => {
  const router = Router();
  const apiKey = process.env.ASSEMBLYAI_API_KEY || "";
  const audioToTextService = new AudioToTextService(apiKey);
  const conversationService = new ConversationService(clients);

  // Endpoint for handling audio file input
  router.post(
    "/converse/audio",
    upload.single("audio"),
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.file || !req.file.buffer) {
          res
            .status(400)
            .json(createErrorResponse("No audio file uploaded or invalid audio data", 400));
          return;
        }

        if (!req.body.scenarioName) {
          res
            .status(400)
            .json(createErrorResponse("Scenario name is required", 400));
          return;
        }

        const transcribedText = await audioToTextService.convertBufferToText(
          req.file.buffer
        );
        const response = await conversationService.converse(
          req.body.scenarioName,
          [{ role: "user", content: transcribedText }]
        );

        res.json(createSuccessResponse(response));
      } catch (error) {
        console.error("Error in /converse/audio:", error);
        const statusCode =
          error instanceof Error && error.message.includes("required")
            ? 400
            : 500;
        const errorMessage =
          error instanceof Error ? error.message : "Failed to process audio";
        res
          .status(statusCode)
          .json(createErrorResponse(errorMessage, statusCode));
      }
    }
  );

  // Endpoint for handling direct text input
  router.post(
    "/converse/text",
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.body.scenarioName) {
          res
            .status(400)
            .json(createErrorResponse("Scenario name is required", 400));
          return;
        }

        const response = await conversationService.converse(
          req.body.scenarioName,
          [{ role: "user", content: req.body.text || "olá" }]
        );

        // Convert null audioBuffer to undefined before passing to createSuccessResponse
        const successResponse = createSuccessResponse({
          ...response,
          audioBuffer: response.audioBuffer || undefined
        });

        res.json(successResponse);
      } catch (error) {
        console.error("Error in /converse/text:", error);
        const statusCode =
          error instanceof Error && error.message.includes("required")
            ? 400
            : 500;
        const errorMessage =
          error instanceof Error ? error.message : "Failed to generate response";
        res
          .status(statusCode)
          .json(createErrorResponse(errorMessage, statusCode));
      }
    }
  );

  // Endpoint for API conversation
  router.post(
    "/api/conversation",
    async (req: Request, res: Response): Promise<void> => {
      try {
        // Validate request body
        if (!req.body) {
          res.status(400).json({
            error: "Missing request body",
            message: "Request body is required"
          });
          return;
        }

        if (!req.body.scenario) {
          res.status(400).json({
            error: "Missing scenario",
            message: "Scenario field is required"
          });
          return;
        }

        if (!req.body.message) {
          res.status(400).json({
            error: "Missing message",
            message: "Message field is required"
          });
          return;
        }

        const response = await conversationService.converse(
          req.body.scenario,
          [{ role: "user", content: req.body.message }]
        );

        // Validate response before sending
        if (!response || !response.text) {
          throw new Error("Invalid response from conversation service");
        }

        res.json({
          text: response.text,
          translation: response.translation,
          audio: response.audioBuffer ? response.audioBuffer.toString('base64') : ''
        });
      } catch (error) {
        console.error("Error in /api/conversation:", error);
        
        // Determine if error is from OpenAI/DeepSeek
        const isAIError = error instanceof Error && 
          (error.message.includes('deepseek') || 
           error.message.includes('openai'));

        const statusCode = isAIError ? 503 : 500;
        const errorMessage = isAIError 
          ? "AI service temporarily unavailable" 
          : error instanceof Error ? error.message : "Internal server error";

        res.status(statusCode).json({
          error: "Conversation Error",
          message: errorMessage,
          details: process.env.NODE_ENV === 'development' ? error : undefined
        });
      }
    }
  );

  return router;
};
