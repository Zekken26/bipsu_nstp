import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

const queues = new Map();
const jobs = new Map();

class InMemoryQueue {
  constructor(name, options = {}) {
    this.name = name;
    this.maxConcurrent = options.maxConcurrent ?? env.queue.maxConcurrent;
    this.maxPending = options.maxPending ?? env.queue.maxPending;
    this.acquireTimeoutMs = options.acquireTimeoutMs ?? env.queue.acquireTimeoutMs;
    this.running = 0;
    this.pending = [];
  }

  stats() {
    return {
      name: this.name,
      running: this.running,
      pending: this.pending.length,
      maxConcurrent: this.maxConcurrent,
      maxPending: this.maxPending,
    };
  }

  acquire() {
    if (this.running < this.maxConcurrent) {
      this.running += 1;
      return Promise.resolve(this.releaseOnce());
    }

    if (this.pending.length >= this.maxPending) {
      return Promise.reject(new ApiError(503, 'The system is busy. Please retry this action shortly.', undefined, 'QUEUE_FULL'));
    }

    return new Promise((resolve, reject) => {
      const ticket = {
        resolve,
        reject,
        timer: setTimeout(() => {
          this.pending = this.pending.filter((item) => item !== ticket);
          reject(new ApiError(503, 'This action waited too long to start. Please retry shortly.', undefined, 'QUEUE_TIMEOUT'));
        }, this.acquireTimeoutMs),
      };
      ticket.timer.unref();
      this.pending.push(ticket);
    });
  }

  releaseOnce() {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.running = Math.max(0, this.running - 1);
      this.drain();
    };
  }

  drain() {
    while (this.running < this.maxConcurrent && this.pending.length > 0) {
      const ticket = this.pending.shift();
      clearTimeout(ticket.timer);
      this.running += 1;
      ticket.resolve(this.releaseOnce());
    }
  }
}

export function getQueue(name, options = {}) {
  if (!queues.has(name)) {
    queues.set(name, new InMemoryQueue(name, options));
  }
  return queues.get(name);
}

export function queueRequest(name, options = {}) {
  const queue = getQueue(name, options);
  return async (req, res, next) => {
    try {
      const release = await queue.acquire();
      const done = () => release();
      res.once('finish', done);
      res.once('close', done);
      if (req.timedOut || res.headersSent) {
        release();
        return undefined;
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function enqueueJob(name, handler, options = {}) {
  const queue = getQueue(name, options);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const job = {
    id,
    name,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    error: null,
  };
  jobs.set(id, job);

  queue.acquire()
    .then(async (release) => {
      const timeoutMs = options.timeoutMs ?? env.queue.jobTimeoutMs;
      const timeout = new Promise((_, reject) => {
        const timer = setTimeout(() => reject(new ApiError(503, 'Queued job timed out.', undefined, 'JOB_TIMEOUT')), timeoutMs);
        timer.unref();
      });

      try {
        jobs.set(id, { ...jobs.get(id), status: 'running', updatedAt: new Date().toISOString() });
        const result = await Promise.race([handler(), timeout]);
        jobs.set(id, { ...jobs.get(id), status: 'completed', result, updatedAt: new Date().toISOString() });
      } catch (error) {
        logger.error('Queued job failed', { id, name, message: error.message, code: error.code });
        jobs.set(id, { ...jobs.get(id), status: 'failed', error: error.message, code: error.code, updatedAt: new Date().toISOString() });
      } finally {
        release();
      }
    })
    .catch((error) => {
      jobs.set(id, { ...jobs.get(id), status: 'failed', error: error.message, code: error.code, updatedAt: new Date().toISOString() });
    });

  return job;
}

export function getJob(id) {
  return jobs.get(id) || null;
}

export function getQueueStats() {
  return Array.from(queues.values()).map((queue) => queue.stats());
}
