import '@testing-library/jest-dom';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock AudioContext
class MockAudioContext {
  state = 'running';
  createAnalyser() {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteTimeDomainData: () => {},
      getByteFrequencyData: () => {},
      connect: () => {},
      disconnect: () => {},
    };
  }
  createMediaStreamSource() {
    return {
      connect: () => {},
      disconnect: () => {},
    };
  }
  createOscillator() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      frequency: { value: 440 },
    };
  }
  createGain() {
    return {
      connect: () => {},
      gain: { value: 1, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
    };
  }
  close() {
    return Promise.resolve();
  }
}

// @ts-expect-error Mocking window AudioContext
window.AudioContext = MockAudioContext;
// @ts-expect-error Mocking window webkitAudioContext
window.webkitAudioContext = MockAudioContext;
