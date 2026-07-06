import type {
  SearchEnqueuedTask,
  SearchTask,
  SearchTaskFilters,
  SearchTaskStatus,
  SearchTasksResponse,
} from "~/types/search";

const TERMINAL_STATUSES: SearchTaskStatus[] = [
  "succeeded",
  "failed",
  "canceled",
];

function buildTaskQuery(
  filters: SearchTaskFilters = {},
): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  if (filters.limit !== undefined) {
    query.limit = filters.limit;
  }
  if (filters.from !== undefined) {
    query.from = filters.from;
  }
  if (filters.reverse !== undefined) {
    query.reverse = filters.reverse;
  }
  if (filters.batchUids?.length) {
    query.batchUids = filters.batchUids.join(",");
  }
  if (filters.uids?.length) {
    query.uids = filters.uids.join(",");
  }
  if (filters.canceledBy?.length) {
    query.canceledBy = filters.canceledBy.join(",");
  }
  if (filters.types?.length) {
    query.types = filters.types.join(",");
  }
  if (filters.statuses?.length) {
    query.statuses = filters.statuses.join(",");
  }
  if (filters.indexUids?.length) {
    query.indexUids = filters.indexUids.join(",");
  }
  if (filters.afterEnqueuedAt) {
    query.afterEnqueuedAt = filters.afterEnqueuedAt;
  }
  if (filters.beforeEnqueuedAt) {
    query.beforeEnqueuedAt = filters.beforeEnqueuedAt;
  }
  if (filters.afterStartedAt) {
    query.afterStartedAt = filters.afterStartedAt;
  }
  if (filters.beforeStartedAt) {
    query.beforeStartedAt = filters.beforeStartedAt;
  }
  if (filters.afterFinishedAt) {
    query.afterFinishedAt = filters.afterFinishedAt;
  }
  if (filters.beforeFinishedAt) {
    query.beforeFinishedAt = filters.beforeFinishedAt;
  }

  return query;
}

export function useSearchTask() {
  const { request } = useSearchApi();
  const toast = useToast();

  async function getTasks(filters: SearchTaskFilters = {}) {
    return request<SearchTasksResponse>("tasks", {
      query: buildTaskQuery(filters),
    });
  }

  async function getTask(taskUid: number) {
    return request<SearchTask>(`tasks/${taskUid}`);
  }

  async function cancelTasks(filters: SearchTaskFilters) {
    return request<SearchEnqueuedTask>("tasks/cancel", {
      method: "POST",
      query: buildTaskQuery(filters),
    });
  }

  async function deleteTasks(filters: SearchTaskFilters) {
    return request<SearchEnqueuedTask>("tasks", {
      method: "DELETE",
      query: buildTaskQuery(filters),
    });
  }

  async function waitForTask(
    taskUid: number,
    options: { interval?: number; timeout?: number } = {},
  ) {
    const interval = options.interval ?? 500;
    const timeout = options.timeout ?? 120_000;
    const startedAt = Date.now();

    while (true) {
      const task = await getTask(taskUid);

      if (TERMINAL_STATUSES.includes(task.status)) {
        if (task.status === "succeeded") {
          return task;
        }

        throw new Error(
          task.error?.message || `Task ${taskUid} ${task.status}`,
        );
      }

      if (Date.now() - startedAt > timeout) {
        throw new Error(`Task ${taskUid} timed out`);
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  async function runWithTask(
    promise: Promise<SearchEnqueuedTask>,
    options: { successMessage?: string; wait?: boolean } = {},
  ) {
    const { successMessage, wait = true } = options;
    const enqueued = await promise;

    toast.add({
      title: "Task enqueued",
      description: `Task #${enqueued.taskUid} (${enqueued.type})`,
      color: "info",
      actions: [
        {
          label: "View tasks",
          to: "/tasks",
        },
      ],
    });

    if (!wait) {
      return enqueued;
    }

    try {
      await waitForTask(enqueued.taskUid);

      if (successMessage) {
        toast.add({ title: successMessage, color: "success" });
      }

      return enqueued;
    } catch (error) {
      toast.add({
        title: "Task failed",
        description: error instanceof Error ? error.message : "Unknown error",
        color: "error",
      });
      throw error;
    }
  }

  return {
    getTasks,
    getTask,
    cancelTasks,
    deleteTasks,
    waitForTask,
    runWithTask,
  };
}
