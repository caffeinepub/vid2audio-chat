import { useState, useCallback } from 'react';
import { ConversionJob } from './types';

export function useJobHistory() {
  const [jobs, setJobs] = useState<ConversionJob[]>([]);

  const addJob = useCallback(
    (job: Omit<ConversionJob, 'id' | 'timestamp'>): string => {
      const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newJob: ConversionJob = {
        ...job,
        id,
        timestamp: Date.now(),
      };
      setJobs((prev) => [...prev, newJob]);
      return id;
    },
    []
  );

  const updateJob = useCallback((id: string, updates: Partial<ConversionJob>) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job))
    );
  }, []);

  return { jobs, addJob, updateJob };
}
