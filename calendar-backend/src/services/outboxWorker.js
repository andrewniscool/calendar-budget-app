export function createOutboxWorker({ repository, mailService, logger, cleanup, pollIntervalMs = 1_000 }) {
  let timer;
  let activeRun;
  let stopped = true;
  let lastCleanupAt = 0;

  async function processOnce() {
    const jobs = await repository.claimBatch(10);
    for (const job of jobs) {
      try {
        await mailService.sendJob(job);
        await repository.markSent(job.id);
        logger.info('mail.sent', { jobId: job.id, type: job.type, attempt: job.attempts });
      } catch (error) {
        const retryDelaySeconds = Math.min(3_600, 30 * (2 ** Math.max(0, job.attempts - 1)));
        await repository.markFailed(job, error.message, retryDelaySeconds);
        logger.warn('mail.failed', {
          jobId: job.id,
          type: job.type,
          attempt: job.attempts,
          terminal: job.attempts >= job.max_attempts,
          errorName: error.name,
        });
      }
    }

    if (cleanup && Date.now() - lastCleanupAt >= 60 * 60 * 1000) {
      const result = await cleanup();
      lastCleanupAt = Date.now();
      logger.info('auth_tokens.cleaned', result);
    }
    return jobs.length;
  }

  function schedule() {
    if (stopped) return;
    timer = setTimeout(async () => {
      activeRun = processOnce().catch((error) => {
        logger.error('worker.run_failed', { errorName: error.name, errorMessage: error.message });
      });
      await activeRun;
      activeRun = undefined;
      schedule();
    }, pollIntervalMs);
  }

  return {
    processOnce,
    start() {
      if (!stopped) return;
      stopped = false;
      schedule();
    },
    async stop() {
      stopped = true;
      clearTimeout(timer);
      await activeRun;
    },
  };
}
