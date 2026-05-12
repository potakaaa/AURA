/**
 * AURA Voice — wake-word and STT modules.
 */
export {
	AndroidWhisperCppCapture,
	AndroidWhisperCppEngine,
	WhisperSttSession,
	assertChunkingConfig,
	createOverlappingChunks,
	mergeChunkTranscripts,
} from "./stt/index.js";
export * as stt from "./stt/index.js";
