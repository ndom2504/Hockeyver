import type { Conference, Division, Standing, Team } from '@/services/nhl/nhl.types';

export const DIVISION_LABEL: Record<Division, string> = {
  Atlantic: 'Atlantique',
  Metropolitan: 'Métropolitaine',
  Central: 'Centrale',
  Pacific: 'Pacifique',
};

export const CONFERENCE_LABEL: Record<Conference, string> = {
  Eastern: "Association de l'Est",
  Western: "Association de l'Ouest",
};

const DIVISIONS: Record<Conference, Division[]> = {
  Eastern: ['Atlantic', 'Metropolitan'],
  Western: ['Central', 'Pacific'],
};

export type StandingRow = { standing: Standing; team: Team; rank: number };

export function groupStandings(standings: Standing[], teams: Team[], conference: Conference) {
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  return DIVISIONS[conference].map((division) => {
    const rows = standings
      .map((standing) => {
        const team = teamsById.get(standing.teamId);
        return team && team.division === division ? { standing, team } : null;
      })
      .filter((row): row is { standing: Standing; team: Team } => row !== null)
      .sort(
        (a, b) =>
          b.standing.points - a.standing.points ||
          b.standing.wins - a.standing.wins ||
          b.standing.goalDiff - a.standing.goalDiff,
      )
      .map((row, index) => ({ ...row, rank: index + 1 }));
    return { division, label: DIVISION_LABEL[division], rows };
  });
}

export function teamStanding(standings: Standing[], teams: Team[], teamId: string) {
  const team = teams.find((item) => item.id === teamId);
  if (!team) return null;
  const groups = groupStandings(standings, teams, team.conference);
  const division = groups.find((group) => group.division === team.division);
  return division?.rows.find((row) => row.team.id === teamId) ?? null;
}
