import { ExecutionStep } from '@/store/visualizerStore';
import { javaEventsToSteps } from './javaTraceAdapter';

interface JavaDebugRunResponse {
  runId: string;
}

interface JavaEventsResponse {
  runId: string;
  events: any[];
}

export async function generateJavaExecutionSteps(
  code: string,
  className: string
): Promise<ExecutionStep[]> {
  const runRes = await fetch('/api/run-java-debug', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, className }),
  });

  if (!runRes.ok) {
    const err = await runRes.json().catch(() => ({}));
    const message = err.error || `Java debug run failed with status ${runRes.status}`;
    const details = [err.stdout, err.stderr].filter(Boolean).join('\n');

    return [
      {
        line: 0,
        code: '',
        description: 'Java compilation/debug start error',
        nodes: [],
        variables: [],
        callStack: [],
        console: details ? [message, details] : [message],
      },
    ];
  }

  const { runId } = (await runRes.json()) as JavaDebugRunResponse;

  // Simple polling: try a few times to get events
  let attempts = 0;
  let events: any[] = [];

  while (attempts < 5) {
    // wait a bit between polls
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 400));
    // eslint-disable-next-line no-await-in-loop
    const evRes = await fetch(`/api/java-events?runId=${encodeURIComponent(runId)}`);
    if (!evRes.ok) {
      attempts++;
      continue;
    }
    const data = (await evRes.json()) as JavaEventsResponse;
    events = data.events || [];
    if (events.length > 0) {
      break;
    }
    attempts++;
  }

  return javaEventsToSteps(events);
}

