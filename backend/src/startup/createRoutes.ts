import { Router, Request, Response } from "express";
import multer from "multer";
import { AudioToTextService } from "../services/AudioToTextService";
import { ConversationService } from "../services/ConversationService";
import { Clients } from "../types";

// Define interfaces for request and response types
interface ConversationResponse {
  audio: string;
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
  audio?: string;
  audioBuffer?: Buffer;
}): ConversationResponse => {
  let audioData: Buffer;
  
  if (data.audioBuffer && Buffer.isBuffer(data.audioBuffer)) {
    audioData = data.audioBuffer;
  } else if (data.audio) {
    audioData = Buffer.from(data.audio, 'base64');
  } else {
    // Minimal valid audio file as fallback
    audioData = Buffer.from('SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADzABtbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1t//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA8w2tt+t', 'base64');
  }

  return {
    audio: audioData.toString('base64'),
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

        res.json(createSuccessResponse(response));
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
        if (!req.body.scenario) {
          res
            .status(400)
            .json(createErrorResponse("Scenario is required", 400));
          return;
        }

        const response = await conversationService.converse(req.body.scenario, [
          { role: "user", content: req.body.message || "olá" }
        ]);

        res.json(createSuccessResponse(response));
      } catch (error) {
        console.error("Error in /api/conversation:", error);
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

  return router;
};
