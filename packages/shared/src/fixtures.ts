import type {
  GymTrackHistory,
  GymTrackProgression,
  RosterClient
} from "./types.js";

/** Fixed "today" for deterministic demo reviews. Override with COACHOPS_DEMO_NOW. */
export function demoNow(): Date {
  const raw = process.env.COACHOPS_DEMO_NOW;
  if (raw) return new Date(raw);
  return new Date("2026-11-25T08:00:00+13:00");
}

function isoDaysAgo(days: number, hour = 17): string {
  const d = demoNow();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const DEMO_ROSTER: RosterClient[] = [
  {
    id: "demo-alex-inactive",
    displayName: "Alex Rivera",
    mode: "fixture",
    demoRole: "inactive",
    trainerContext: {
      expectedCadenceDays: 3,
      followUpNotes: "Prefers morning check-ins.",
      syntheticEmail: "alex.rivera.demo@coachops.example"
    }
  },
  {
    id: "demo-jordan-shortfall",
    displayName: "Jordan Lee",
    mode: "fixture",
    demoRole: "shortfall",
    trainerContext: {
      expectedCadenceDays: 4,
      equipmentNotes: "Home gym, limited to dumbbells under 40kg.",
      syntheticEmail: "jordan.lee.demo@coachops.example"
    }
  },
  {
    id: "demo-sam-stalled",
    displayName: "Sam Okonkwo",
    mode: "fixture",
    demoRole: "stalled",
    trainerContext: {
      expectedCadenceDays: 3,
      syntheticEmail: "sam.okonkwo.demo@coachops.example"
    }
  },
  {
    id: "demo-casey-sensitive",
    displayName: "Casey Nguyen",
    mode: "fixture",
    demoRole: "sensitive",
    trainerContext: {
      expectedCadenceDays: 3,
      syntheticEmail: "casey.nguyen.demo@coachops.example"
    }
  },
  {
    id: "demo-morgan-healthy",
    displayName: "Morgan Patel",
    mode: "fixture",
    demoRole: "healthy",
    trainerContext: {
      expectedCadenceDays: 3,
      syntheticEmail: "morgan.patel.demo@coachops.example"
    }
  },
  {
    id: "demo-riley-healthy",
    displayName: "Riley Brooks",
    mode: "fixture",
    demoRole: "healthy",
    trainerContext: {
      expectedCadenceDays: 4,
      travelNotes: "Back from travel last week; cadence resumed.",
      syntheticEmail: "riley.brooks.demo@coachops.example"
    }
  },
  {
    id: "demo-taylor-unavailable",
    displayName: "Taylor Kim",
    mode: "fixture",
    demoRole: "unavailable",
    trainerContext: {
      expectedCadenceDays: 3,
      syntheticEmail: "taylor.kim.demo@coachops.example"
    }
  }
];

const histories: Record<string, GymTrackHistory> = {
  "demo-alex-inactive": {
    workouts: [
      {
        id: "w-alex-1",
        performedAt: isoDaysAgo(14),
        notes: "Felt fine. Travel upcoming.",
        plannedWorkoutId: "p-alex-1",
        sets: [
          {
            id: "s-alex-1",
            exerciseName: "Back Squat",
            setIndex: 1,
            reps: 5,
            weight: 100,
            unit: "kg",
            plannedReps: 5,
            plannedWeight: 100
          },
          {
            id: "s-alex-2",
            exerciseName: "Romanian Deadlift",
            setIndex: 1,
            reps: 8,
            weight: 80,
            unit: "kg",
            plannedReps: 8,
            plannedWeight: 80
          }
        ]
      }
    ]
  },
  "demo-jordan-shortfall": {
    workouts: [
      {
        id: "w-jordan-1",
        performedAt: isoDaysAgo(2),
        notes: "Energy low.",
        plannedWorkoutId: "p-jordan-1",
        sets: [
          {
            id: "s-j-1",
            exerciseName: "Bench Press",
            setIndex: 1,
            reps: 5,
            weight: 60,
            unit: "kg",
            plannedReps: 8,
            plannedWeight: 70
          },
          {
            id: "s-j-2",
            exerciseName: "Bench Press",
            setIndex: 2,
            reps: 4,
            weight: 60,
            unit: "kg",
            plannedReps: 8,
            plannedWeight: 70
          },
          {
            id: "s-j-3",
            exerciseName: "Dumbbell Row",
            setIndex: 1,
            reps: 8,
            weight: 20,
            unit: "kg",
            plannedReps: 10,
            plannedWeight: 25
          }
        ]
      },
      {
        id: "w-jordan-2",
        performedAt: isoDaysAgo(5),
        notes: null,
        plannedWorkoutId: "p-jordan-2",
        sets: [
          {
            id: "s-j-4",
            exerciseName: "Bench Press",
            setIndex: 1,
            reps: 6,
            weight: 62.5,
            unit: "kg",
            plannedReps: 8,
            plannedWeight: 70
          },
          {
            id: "s-j-5",
            exerciseName: "Bench Press",
            setIndex: 2,
            reps: 5,
            weight: 62.5,
            unit: "kg",
            plannedReps: 8,
            plannedWeight: 70
          }
        ]
      },
      {
        id: "w-jordan-3",
        performedAt: isoDaysAgo(8),
        notes: null,
        plannedWorkoutId: "p-jordan-3",
        sets: [
          {
            id: "s-j-6",
            exerciseName: "Bench Press",
            setIndex: 1,
            reps: 5,
            weight: 65,
            unit: "kg",
            plannedReps: 8,
            plannedWeight: 70
          }
        ]
      }
    ]
  },
  "demo-sam-stalled": {
    workouts: [
      {
        id: "w-sam-1",
        performedAt: isoDaysAgo(1),
        notes: null,
        plannedWorkoutId: "p-sam-1",
        sets: [
          {
            id: "s-sam-1",
            exerciseName: "Barbell Hip Thrust",
            setIndex: 1,
            reps: 8,
            weight: 100,
            unit: "kg",
            plannedReps: 8,
            plannedWeight: 100
          }
        ]
      },
      {
        id: "w-sam-2",
        performedAt: isoDaysAgo(4),
        notes: null,
        plannedWorkoutId: "p-sam-2",
        sets: [
          {
            id: "s-sam-2",
            exerciseName: "Barbell Hip Thrust",
            setIndex: 1,
            reps: 8,
            weight: 100,
            unit: "kg",
            plannedReps: 8,
            plannedWeight: 100
          }
        ]
      },
      {
        id: "w-sam-3",
        performedAt: isoDaysAgo(7),
        notes: null,
        plannedWorkoutId: "p-sam-3",
        sets: [
          {
            id: "s-sam-3",
            exerciseName: "Barbell Hip Thrust",
            setIndex: 1,
            reps: 8,
            weight: 100,
            unit: "kg",
            plannedReps: 8,
            plannedWeight: 100
          }
        ]
      },
      {
        id: "w-sam-4",
        performedAt: isoDaysAgo(10),
        notes: null,
        plannedWorkoutId: "p-sam-4",
        sets: [
          {
            id: "s-sam-4",
            exerciseName: "Barbell Hip Thrust",
            setIndex: 1,
            reps: 8,
            weight: 100,
            unit: "kg",
            plannedReps: 8,
            plannedWeight: 100
          }
        ]
      }
    ]
  },
  "demo-casey-sensitive": {
    workouts: [
      {
        id: "w-casey-1",
        performedAt: isoDaysAgo(1),
        notes: "Sharp pain in right shoulder during overhead press — stopped early.",
        plannedWorkoutId: "p-casey-1",
        sets: [
          {
            id: "s-casey-1",
            exerciseName: "Overhead Press",
            setIndex: 1,
            reps: 3,
            weight: 40,
            unit: "kg",
            plannedReps: 6,
            plannedWeight: 45
          },
          {
            id: "s-casey-2",
            exerciseName: "Lat Pulldown",
            setIndex: 1,
            reps: 10,
            weight: 45,
            unit: "kg",
            plannedReps: 10,
            plannedWeight: 45
          }
        ]
      },
      {
        id: "w-casey-2",
        performedAt: isoDaysAgo(4),
        notes: null,
        plannedWorkoutId: "p-casey-2",
        sets: [
          {
            id: "s-casey-3",
            exerciseName: "Overhead Press",
            setIndex: 1,
            reps: 6,
            weight: 42.5,
            unit: "kg",
            plannedReps: 6,
            plannedWeight: 42.5
          }
        ]
      }
    ]
  },
  "demo-morgan-healthy": {
    workouts: [
      {
        id: "w-morgan-1",
        performedAt: isoDaysAgo(1),
        notes: "Solid session.",
        plannedWorkoutId: "p-morgan-1",
        sets: [
          {
            id: "s-m-1",
            exerciseName: "Deadlift",
            setIndex: 1,
            reps: 5,
            weight: 140,
            unit: "kg",
            plannedReps: 5,
            plannedWeight: 140
          },
          {
            id: "s-m-2",
            exerciseName: "Pull-Up",
            setIndex: 1,
            reps: 8,
            weight: 0,
            unit: "kg",
            plannedReps: 8,
            plannedWeight: 0
          }
        ]
      },
      {
        id: "w-morgan-2",
        performedAt: isoDaysAgo(3),
        notes: null,
        plannedWorkoutId: "p-morgan-2",
        sets: [
          {
            id: "s-m-3",
            exerciseName: "Deadlift",
            setIndex: 1,
            reps: 5,
            weight: 137.5,
            unit: "kg",
            plannedReps: 5,
            plannedWeight: 135
          }
        ]
      },
      {
        id: "w-morgan-3",
        performedAt: isoDaysAgo(6),
        notes: null,
        plannedWorkoutId: "p-morgan-3",
        sets: [
          {
            id: "s-m-4",
            exerciseName: "Squat",
            setIndex: 1,
            reps: 5,
            weight: 110,
            unit: "kg",
            plannedReps: 5,
            plannedWeight: 110
          }
        ]
      }
    ]
  },
  "demo-riley-healthy": {
    workouts: [
      {
        id: "w-riley-1",
        performedAt: isoDaysAgo(2),
        notes: "Back on schedule.",
        plannedWorkoutId: "p-riley-1",
        sets: [
          {
            id: "s-r-1",
            exerciseName: "Front Squat",
            setIndex: 1,
            reps: 6,
            weight: 70,
            unit: "kg",
            plannedReps: 6,
            plannedWeight: 70
          }
        ]
      },
      {
        id: "w-riley-2",
        performedAt: isoDaysAgo(5),
        notes: null,
        plannedWorkoutId: "p-riley-2",
        sets: [
          {
            id: "s-r-2",
            exerciseName: "Front Squat",
            setIndex: 1,
            reps: 6,
            weight: 67.5,
            unit: "kg",
            plannedReps: 6,
            plannedWeight: 67.5
          }
        ]
      }
    ]
  }
};

const progressions: Record<string, GymTrackProgression[]> = {
  "demo-sam-stalled": [
    {
      exerciseName: "Barbell Hip Thrust",
      sets: [
        {
          performedAt: isoDaysAgo(1),
          workoutId: "w-sam-1",
          setIndex: 1,
          reps: 8,
          weight: 100,
          unit: "kg",
          plannedReps: 8,
          plannedWeight: 100
        },
        {
          performedAt: isoDaysAgo(4),
          workoutId: "w-sam-2",
          setIndex: 1,
          reps: 8,
          weight: 100,
          unit: "kg",
          plannedReps: 8,
          plannedWeight: 100
        },
        {
          performedAt: isoDaysAgo(7),
          workoutId: "w-sam-3",
          setIndex: 1,
          reps: 8,
          weight: 100,
          unit: "kg",
          plannedReps: 8,
          plannedWeight: 100
        },
        {
          performedAt: isoDaysAgo(10),
          workoutId: "w-sam-4",
          setIndex: 1,
          reps: 8,
          weight: 100,
          unit: "kg",
          plannedReps: 8,
          plannedWeight: 100
        }
      ]
    }
  ],
  "demo-jordan-shortfall": [
    {
      exerciseName: "Bench Press",
      sets: [
        {
          performedAt: isoDaysAgo(2),
          workoutId: "w-jordan-1",
          setIndex: 1,
          reps: 5,
          weight: 60,
          unit: "kg",
          plannedReps: 8,
          plannedWeight: 70
        },
        {
          performedAt: isoDaysAgo(5),
          workoutId: "w-jordan-2",
          setIndex: 1,
          reps: 6,
          weight: 62.5,
          unit: "kg",
          plannedReps: 8,
          plannedWeight: 70
        },
        {
          performedAt: isoDaysAgo(8),
          workoutId: "w-jordan-3",
          setIndex: 1,
          reps: 5,
          weight: 65,
          unit: "kg",
          plannedReps: 8,
          plannedWeight: 70
        }
      ]
    }
  ],
  "demo-morgan-healthy": [
    {
      exerciseName: "Deadlift",
      sets: [
        {
          performedAt: isoDaysAgo(1),
          workoutId: "w-morgan-1",
          setIndex: 1,
          reps: 5,
          weight: 140,
          unit: "kg",
          plannedReps: 5,
          plannedWeight: 140
        },
        {
          performedAt: isoDaysAgo(3),
          workoutId: "w-morgan-2",
          setIndex: 1,
          reps: 5,
          weight: 137.5,
          unit: "kg",
          plannedReps: 5,
          plannedWeight: 135
        }
      ]
    }
  ]
};

export function fixtureHistory(clientId: string): GymTrackHistory {
  return histories[clientId] ?? { workouts: [] };
}

export function fixtureProgressions(clientId: string): GymTrackProgression[] {
  return progressions[clientId] ?? [];
}

export function loadRoster(): RosterClient[] {
  // Live clients can be appended via COACHOPS_LIVE_ROSTER_JSON (array of RosterClient).
  const liveRaw = process.env.COACHOPS_LIVE_ROSTER_JSON;
  let live: RosterClient[] = [];
  if (liveRaw) {
    try {
      live = JSON.parse(liveRaw) as RosterClient[];
    } catch {
      // ignore malformed live roster overlay
    }
  }
  return [...DEMO_ROSTER, ...live];
}
