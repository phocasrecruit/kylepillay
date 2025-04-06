import type { PeopleQuery } from './generated/graphql';

type Person = PeopleQuery['people'][0];


/**
 * requirements teams must sit together.
 * People who don't like dogs should be placed as far away from those who have dogs as possible.
 * People who have dogs should be placed as far apart as possible.
 * Preference to be given to people who would like to avoid dogs. See Example below
 * Desks are arranged in a single line of adjacent desks.
 * Teams sit next to each other, so the team boundary must be taken into account.
 *
 * For example, if given a single team of 5 people with the following preferences:
 * 1. Alice - likes dogs
 * 2. Bob - likes dogs
 * 3. Charlie - doesn't like dogs
 * 4. David - has a dog
 * 5. Eve - has a dog
 *
 * A valid desk layout would be:
 * Charlie(Avoid), Alice(Like), David(Has), Bob(Like), Eve(Has)
 *
 * If Bob left, then a new valid desk layout would be
 * Charlie(Avoid), Alice(Like), David(Has), Eve(Has)
 *
 * There is a test suite provided that is disabled in calculateDeskLayout.spec.ts
 * This test suite may not be exhaustive for all edge cases.
 */
export const calculateDeskLayout = (people: Person[]): Person[] => {
  const teamMap: { [teamName: string]: Person[] } = {};
  const teamTypes: { [teamName: string]: string } = {};
  
  for (const person of people) {
    const team = person.team
    const teamId = person.team ? person.team.id : 'no-team';
    if (!teamMap[teamId]) {
      teamMap[teamId] = [];
    }
    teamMap[teamId].push(person);
  }

  for (const teamName in teamMap) {
    const team = teamMap[teamName];
    const hasAvoid = team.some(p => p.dogStatus === 'AVOID');
    const hasHave = team.some(p => p.dogStatus === 'HAVE');
    
    if (hasAvoid && !hasHave) {
      teamTypes[teamName] = 'AVOID';
    } else if (hasHave && !hasAvoid) {
      teamTypes[teamName] = 'HAVE';
    } else {
      teamTypes[teamName] = 'MIXED';
    }
  }

  const avoidTeams: string[] = [];
  const haveTeams: string[] = [];
  const mixedTeams: string[] = [];
  
  for (const teamName in teamTypes) {
    if (teamTypes[teamName] === 'AVOID') {
      avoidTeams.push(teamName);
    } else if (teamTypes[teamName] === 'HAVE') {
      haveTeams.push(teamName);
    } else {
      mixedTeams.push(teamName);
    }
  }

  const arrangedTeams: Person[][] = [];
  
  for (const teamName of avoidTeams) {
    arrangedTeams.push([...teamMap[teamName]]);
  }
  
  let mixSortOrder = 0;
  for (const teamName of mixedTeams) {
    const team = teamMap[teamName];
    const avoid = team.filter(p => p.dogStatus === 'AVOID');
    const like = team.filter(p => p.dogStatus === 'LIKE');
    const have = team.filter(p => p.dogStatus === 'HAVE');
    
    arrangedTeams.push(
      mixSortOrder === 0 
        ? [...avoid, ...like, ...have]
        : [...have, ...like, ...avoid]
    );
    mixSortOrder = 1 - mixSortOrder;
  }
  
  for (const teamName of haveTeams) {
    arrangedTeams.push([...teamMap[teamName]]);
  }

  for (let i = 0; i < arrangedTeams.length - 1; i++) {
    const current = arrangedTeams[i];
    const next = arrangedTeams[i + 1];
    
    const currentLast = current[current.length - 1].dogStatus;
    const nextFirst = next[0].dogStatus;
    
    if ((currentLast === 'AVOID' && nextFirst === 'HAVE') ||
      (currentLast === 'HAVE' && nextFirst === 'AVOID'))
      {
        const likeTeam = Object.keys(teamMap).find(
          name => teamTypes[name] === 'MIXED' && 
                !arrangedTeams.some(t => t[0]?.team?.name === name)
        );
        
        if (likeTeam) {
          const team = teamMap[likeTeam];
          arrangedTeams.splice(i + 1, 0, [...team]);
        }
      }
  }

  return arrangedTeams.flat();
};