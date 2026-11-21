import { NextTurnResponse, ResumableInterviewState } from '../../data/contracts';

export type RoomState =
  | 'setup'
  | 'device_check'
  | 'ready'
  | 'interviewer_speaking'
  | 'listening'
  | 'candidate_answering'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'reconnecting';

export type RoomAction =
  | { type: 'START_INTERVIEW' }
  | { type: 'INTERVIEWER_SPEAK_START'; questionIndex: number; turnSeq?: number; text?: string }
  | { type: 'INTERVIEWER_SPEAK_END' }
  | { type: 'CANDIDATE_START_ANSWER' }
  | { type: 'CANDIDATE_SUBMIT_ANSWER'; text: string }
  | { type: 'TURN_RESPONSE_RECEIVED'; response: NextTurnResponse }
  | { type: 'RESUME_SESSION_STATE'; state: ResumableInterviewState }
  | { type: 'BARGE_IN' }
  | { type: 'PROCESS_COMPLETE'; isLastQuestion: boolean }
  | { type: 'NETWORK_LOST' }
  | { type: 'NETWORK_RESTORED' }
  | { type: 'CANCEL_INTERVIEW' };

export interface RoomContext {
  state: RoomState;
  previousLiveState: RoomState | null;
  currentQuestionIndex: number;
  turnSeq: number;
  activeSpeechText: string;
  fallbackActive: boolean;
  totalQuestions: number;
  answers: { qIndex: number; text: string; timestamp: string }[];
  isMuted: boolean;
  isCameraOn: boolean;
  captionSize: 'sm' | 'md' | 'lg';
}

export const initialRoomContext: RoomContext = {
  state: 'ready',
  previousLiveState: null,
  currentQuestionIndex: 0,
  turnSeq: 0,
  activeSpeechText: '',
  fallbackActive: false,
  totalQuestions: 6,
  answers: [],
  isMuted: false,
  isCameraOn: false,
  captionSize: 'md',
};

export function roomReducer(context: RoomContext, action: RoomAction): RoomContext {
  switch (action.type) {
    case 'START_INTERVIEW':
      if (context.state === 'ready') {
        return {
          ...context,
          state: 'interviewer_speaking',
          currentQuestionIndex: 0,
          turnSeq: 0,
        };
      }
      return context;

    case 'INTERVIEWER_SPEAK_START':
      if (['listening', 'processing', 'ready'].includes(context.state)) {
        return {
          ...context,
          state: 'interviewer_speaking',
          currentQuestionIndex: action.questionIndex,
          ...(action.turnSeq !== undefined ? { turnSeq: action.turnSeq } : {}),
          ...(action.text ? { activeSpeechText: action.text } : {}),
        };
      }
      return context;

    case 'INTERVIEWER_SPEAK_END':
      if (context.state === 'interviewer_speaking') {
        return {
          ...context,
          state: 'listening',
        };
      }
      return context;

    case 'CANDIDATE_START_ANSWER':
      if (context.state === 'listening') {
        return {
          ...context,
          state: 'candidate_answering',
        };
      }
      return context;

    case 'BARGE_IN':
      // Candidate speaks over interviewer; interrupts interviewer immediately
      if (context.state === 'interviewer_speaking') {
        return {
          ...context,
          state: 'candidate_answering',
        };
      }
      return context;

    case 'CANDIDATE_SUBMIT_ANSWER':
      if (['listening', 'candidate_answering'].includes(context.state)) {
        const newAnswers = [
          ...context.answers,
          {
            qIndex: context.currentQuestionIndex,
            text: action.text,
            timestamp: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          },
        ];
        return {
          ...context,
          state: 'processing',
          answers: newAnswers,
        };
      }
      return context;

    case 'TURN_RESPONSE_RECEIVED': {
      const resp = action.response;
      const isWrapUp = resp.action === 'wrap_up' || resp.action === 'conclude_session';
      return {
        ...context,
        state: isWrapUp ? 'completed' : 'interviewer_speaking',
        currentQuestionIndex: resp.position,
        turnSeq: resp.turnSeq,
        activeSpeechText: resp.spokenText,
        fallbackActive: Boolean(resp.fallbackUsed),
      };
    }

    case 'RESUME_SESSION_STATE':
      return {
        ...context,
        state: action.state.is_completed ? 'completed' : 'listening',
        currentQuestionIndex: action.state.position,
        turnSeq: action.state.turn_seq,
        activeSpeechText: action.state.active_question_text || context.activeSpeechText,
      };

    case 'PROCESS_COMPLETE':
      if (action.isLastQuestion) {
        return {
          ...context,
          state: 'completed',
        };
      }
      return {
        ...context,
        state: 'interviewer_speaking',
        currentQuestionIndex: context.currentQuestionIndex + 1,
        turnSeq: context.turnSeq + 1,
      };

    case 'NETWORK_LOST':
      if (['interviewer_speaking', 'listening', 'candidate_answering', 'processing'].includes(context.state)) {
        return {
          ...context,
          previousLiveState: context.state,
          state: 'reconnecting',
        };
      }
      return context;

    case 'NETWORK_RESTORED':
      if (context.state === 'reconnecting') {
        return {
          ...context,
          state: context.previousLiveState || 'listening',
          previousLiveState: null,
        };
      }
      return context;

    case 'CANCEL_INTERVIEW':
      return {
        ...context,
        state: 'cancelled',
      };

    default:
      return context;
  }
}
