const MediatorFactory = () => {
  const subscribers = {};

  const on = (event, callback) => {
    if (!subscribers[event]) {
      subscribers[event] = new Set();
    }

    subscribers[event].add(callback);
    return () => {
      subscribers.delete(callback);
    };
  };

  const emit = (event, payload) => {
    if (!subscribers[event]) return;
    subscribers[event].forEach((cb) => cb(payload));
  };

  return {
    on,
    emit
  };
};

const MediatorService = MediatorFactory();
export { MediatorService, MediatorFactory };
