import { describe, it, expect } from 'vitest';
import { roomReducer, initialRoomContext } from './roomReducer';

describe('Live Room State Machine Reducer', () => {
  it('handles valid forward transition: ready -> interviewer_speaking -> listening -> candidate_answering -> processing', () => {
    let state = roomReducer(initialRoomContext, { type: 'START_INTERVIEW' });
    expect(state.state).toBe('interviewer_speaking');

    state = roomReducer(state, { type: 'INTERVIEWER_SPEAK_END' });
    expect(state.state).toBe('listening');

    state = roomReducer(state, { type: 'CANDIDATE_START_ANSWER' });
    expect(state.state).toBe('candidate_answering');

    state = roomReducer(state, { type: 'CANDIDATE_SUBMIT_ANSWER', text: 'Atomic Lua scripts guarantee race-free increments.' });
    expect(state.state).toBe('processing');
    expect(state.answers.length).toBe(1);

    // Advances to next question
    state = roomReducer(state, { type: 'PROCESS_COMPLETE', isLastQuestion: false });
    expect(state.state).toBe('interviewer_speaking');
    expect(state.currentQuestionIndex).toBe(1);

    // Completes interview on last question
    state = roomReducer(state, { type: 'INTERVIEWER_SPEAK_END' });
    state = roomReducer(state, { type: 'CANDIDATE_SUBMIT_ANSWER', text: 'Second answer' });
    state = roomReducer(state, { type: 'PROCESS_COMPLETE', isLastQuestion: true });
    expect(state.state).toBe('completed');
  });

  it('supports barge-in: interrupts speaking interviewer and switches immediately to candidate_answering', () => {
    let state = roomReducer(initialRoomContext, { type: 'START_INTERVIEW' });
    expect(state.state).toBe('interviewer_speaking');

    state = roomReducer(state, { type: 'BARGE_IN' });
    expect(state.state).toBe('candidate_answering');
  });

  it('handles network loss and restoration gracefully from live state', () => {
    let state = roomReducer(initialRoomContext, { type: 'START_INTERVIEW' });
    state = roomReducer(state, { type: 'INTERVIEWER_SPEAK_END' });
    expect(state.state).toBe('listening');

    // Network drops
    state = roomReducer(state, { type: 'NETWORK_LOST' });
    expect(state.state).toBe('reconnecting');
    expect(state.previousLiveState).toBe('listening');

    // Network resumes
    state = roomReducer(state, { type: 'NETWORK_RESTORED' });
    expect(state.state).toBe('listening');
    expect(state.previousLiveState).toBeNull();
  });

  it('rejects invalid state transitions', () => {
    // Cannot submit answer while ready
    const unchanged = roomReducer(initialRoomContext, { type: 'CANDIDATE_SUBMIT_ANSWER', text: 'Invalid' });
    expect(unchanged.state).toBe('ready');
  });
});
