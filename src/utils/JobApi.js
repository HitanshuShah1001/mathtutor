// utils/JobApi.js

/**
 * Simulate an API call to create a question paper generation job.
 * In real-world usage, just replace this function to call your actual endpoint.
 *
 * @param {Object} payload - The configuration needed to generate question paper
 * @returns {Promise<{ jobId: string }>}
 */
export async function createQuestionPaperJob(payload) {
  // Simulate a delay
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Return a dummy jobId
      resolve({ jobId: "job_" + Date.now() });
    }, 1000);
  });
}
