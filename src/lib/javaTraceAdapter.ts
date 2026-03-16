import { ExecutionStep, VisualizationNode, Variable, NodeState } from '@/store/visualizerStore';

type JavaTraceEvent = {
  runId?: string;
  type: string;
  file?: string;
  line?: number;
  vars?: Record<string, unknown>;
};

function arrayToNodes(values: unknown[], state: NodeState): VisualizationNode[] {
  return values.map((v, i) => ({
    id: `jdi-${i}`,
    value: typeof v === 'number' ? (v as number) : String(v),
    state,
    x: 80 + i * 70,
    y: 150,
  }));
}

export function javaEventsToSteps(events: JavaTraceEvent[]): ExecutionStep[] {
  if (!events.length) {
    return [
      {
        line: 0,
        code: '',
        description: 'No trace events from Java',
        nodes: [],
        variables: [],
        callStack: [],
        console: [],
      },
    ];
  }

  const steps: ExecutionStep[] = [];

  events.forEach((ev, idx) => {
    const vars: Variable[] = [];
    let nodes: VisualizationNode[] = [];

    if (ev.vars) {
      for (const [name, value] of Object.entries(ev.vars)) {
        vars.push({
          name,
          value: value as any,
          type: typeof value,
          changed: true,
        });

        if (Array.isArray(value) && !nodes.length) {
          nodes = arrayToNodes(value as unknown[], idx === events.length - 1 ? 'visited' : 'active');
        }
      }
    }

    steps.push({
      line: typeof ev.line === 'number' ? ev.line : 0,
      code: '',
      description: ev.type || `Step ${idx}`,
      nodes,
      variables: vars,
      callStack: [],
      console: [],
    });
  });

  return steps;
}

