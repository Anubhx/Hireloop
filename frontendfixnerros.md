# OpenCode Task: Wire Frontend to FastAPI Backend (Seeker Flow)

Hey OpenCode! Now that the visual UI and initial components are done, your next task is to link the Next.js Seeker Dashboard to the live LangGraph Agent Backend.

The backend is running locally at: `http://localhost:8000`

Please implement the following integrations step-by-step. All data fetching should be done from Client Components (using `react` hooks like `useState` and `useEffect`) for maximum interactivity.

---

## Step 1: Initialize Global Store (Zustand or Context)
We need a simple global state to hold the current `userId`.
*   Create a file `frontend/lib/store.ts` (using `zustand` if installed, or just React Context).
*   Add a default mocked user: `const userId = "test_user_123"`. This will be sent as standard params for our API calls.

---

## Step 2: Wire the Resume Upload (`/seeker` Landing)
*   **Component**: The file dropzone on the main Seeker route where users upload PDFs.
*   **Action**: On file select and "Choose File / Upload", send a `multipart/form-data` POST request.
*   **Endpoint:** `POST http://localhost:8000/api/seeker/upload-resume`
*   **Payload:** Form data containing `user_id` (from store) and `file` (the uploaded file object).
*   **UX**: Show a loading spinner during the upload, and when successful, automatically route the user to `/seeker/discovery`.

---

## Step 3: View Agent Activity Feed (SSE Stream)
*   **Component**: The "Agent Activity Feed" sidebar component (which shows live agent steps).
*   **Action**: On mount, instantiate a native browser `EventSource()`.
*   **Endpoint:** `GET http://localhost:8000/api/seeker/activity-feed/{userId}` (Server-Sent Events)
*   **Implementation Example**:
    ```typescript
    useEffect(() => {
        const source = new EventSource(`http://localhost:8000/api/seeker/activity-feed/${userId}`);
        source.onmessage = (e) => {
            const log = JSON.parse(e.data);
            setActivityFeed(prev => [log, ...prev]);
        };
        return () => source.close();
    }, [userId]);
    ```
*   **UX**: Render the incoming `{action, result, timestamp}` JSON events dynamically down the timeline list.

---

## Step 4: Wire Job Discovery & Fit Scores (`/seeker/discovery`)
*   **Component**: The main "Matches" job grid/table.
*   **Action**: Ping the server every few seconds (polling) OR just on component mount to retrieve matched jobs.
*   **Endpoint:** `GET http://localhost:8000/api/seeker/jobs/{userId}`
*   **Response Handling**: The API returns `{ "scored_jobs": [], "raw_jobs": [] }`. Map through the `scored_jobs` array to populate your Job Cards. Each card should show the job title, company, description, and `score`.

---

## Step 5: Wire the "Generate Cover Letter" Button
*   **Component**: Inside a specific Job Detail view or job dropdown.
*   **Action**: When "Generate Cover Letter" is clicked.
*   **Endpoint:** `POST http://localhost:8000/api/seeker/generate-cover-letter`
*   **Payload:** JSON body: `{ "user_id": "{userId}", "job_id": "{selectedJobId}" }`.
*   **UX**: This tells the backend agent to write the letter. (The live progress will be reflected simultaneously in the SSE Activity Feed!).

---

## Step 6: Wire the "Approve Application" (Human-in-the-Loop)
*   **Component**: Typically triggered after viewing the generated cover letter.
*   **Action**: When the user clicks "Approve & Submit".
*   **Endpoint:** `POST http://localhost:8000/api/seeker/approve-application`
*   **Payload**: JSON body `{ "user_id": "{userId}" }`.
*   **UX**: This un-pauses the underlying LangGraph agent to officially perform the job application action. Update the local UI state to show "Status: Applied".

**Note:** Ensure you configure CORS in the requests using standard `fetch()` or `axios`. You might want to setup a base utility like `apiClient` mapping to `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`.
