const API_BASE_URL = "http://localhost:8080";

export function getAllJobs() {
  return fetch(`${API_BASE_URL}/job`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching jobs:", error);
      throw error;
    });
}

export function createJob(job) {
  return fetch(`${API_BASE_URL}/job`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(job),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error creating job:", error);
      throw error;
    });
}

export function deleteJob(id) {
  return fetch(`${API_BASE_URL}/job/${id}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
    })
    .catch((error) => {
      console.error("Error deleting job:", error);
      throw error;
    });
}
