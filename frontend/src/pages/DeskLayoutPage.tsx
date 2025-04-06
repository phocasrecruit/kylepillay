import { useQuery } from '@apollo/client';
import { Box, Typography, Paper, Tooltip, Divider, LinearProgress } from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import BlockIcon from '@mui/icons-material/Block';
import GroupsIcon from '@mui/icons-material/Groups';
import { PEOPLE_QUERY } from '../queries/people';
import { calculateDeskLayout } from '../calculateDeskLayout';
import { PeopleQuery } from '../generated/graphql';

interface DeskPerson {
  id: string;
  name: string;
  dogStatus: 'HAVE' | 'AVOID' | 'LIKE';
  team: {
    id: string;
    name: string;
    __typename?: string;
  } | null;
  position: number;
  __typename?: string;
}

export default function LayoutPage() {
  const { loading, error, data } = useQuery<PeopleQuery>(PEOPLE_QUERY);

  if (loading) return <LinearProgress />;
  if (error) return <Typography color="error">Error: {error.message}</Typography>;

  const rawPeople = data?.people || [];
  const people = calculateDeskLayout(rawPeople);

  const teamGroups: {
    team: string | null;
    members: DeskPerson[];
  }[] = [];
  
  let currentTeam: string | null = null;
  let currentGroup: DeskPerson[] = [];

  people.forEach((person, index) => {
    const personTeam = person.team?.name || null;
    
    if (personTeam !== currentTeam) {
      if (currentGroup.length > 0) {
        teamGroups.push({
          team: currentTeam,
          members: [...currentGroup]
        });
      }
      currentGroup = [];
      currentTeam = personTeam;
    }
    
    currentGroup.push({
      id: person.id,
      name: person.name,
      dogStatus: person.dogStatus as 'HAVE' | 'AVOID' | 'LIKE',
      team: person.team ? {
        id: person.team.id,
        name: person.team.name,
        __typename: person.team.__typename
      } : null,
      position: index + 1,
      __typename: person.__typename
    });
  });

  if (currentGroup.length > 0) {
    teamGroups.push({
      team: currentTeam,
      members: [...currentGroup]
    });
  }

  return (
    <Box sx={styles.container}>
      <Box sx={styles.legend}>
        <Box sx={styles.legendItem}>
          <Box sx={{ ...styles.desk, ...styles.deskWithDog }} />
          <Typography variant="caption">Has Dog</Typography>
        </Box>
        <Box sx={styles.legendItem}>
          <Box sx={{ ...styles.desk, ...styles.deskAvoidsDog }} />
          <Typography variant="caption">Avoids Dogs</Typography>
        </Box>
        <Box sx={styles.legendItem}>
          <Box sx={{ ...styles.desk, ...styles.deskNeutral }} />
          <Typography variant="caption">Likes Dogs</Typography>
        </Box>
        <Box sx={styles.legendItem}>
          <Divider orientation="vertical" sx={styles.teamDivider} />
          <Typography variant="caption">Team Boundary</Typography>
        </Box>
      </Box>

      <Paper elevation={2} sx={styles.desksContainer}>
        <Box sx={styles.desksRow}>
          {teamGroups.map((group, groupIndex) => (
            <Box key={`team-${groupIndex}`} sx={styles.teamCluster}>
              <Box sx={styles.teamGroup}>
                {group.members.map((person) => (
                  <Tooltip 
                    key={person.id} 
                    title={
                      <Box>
                        <Typography>Desk #{person.position}</Typography>
                        <Typography>Name: {person.name}</Typography>
                        <Typography>Team: {person.team?.name || 'No Team'}</Typography>
                        <Typography>
                          Dog Status: {person.dogStatus === 'HAVE' ? 'Has Dog' : 
                                     person.dogStatus === 'AVOID' ? 'Avoids Dogs' : 'Likes Dogs'}
                        </Typography>
                      </Box>
                    }
                    arrow
                  >
                    <Box sx={{
                      ...styles.desk,
                      ...(person.dogStatus === 'HAVE' ? styles.deskWithDog : 
                         person.dogStatus === 'AVOID' ? styles.deskAvoidsDog : 
                         styles.deskNeutral),
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: 2,
                        zIndex: 2
                      }
                    }}>
                      {person.dogStatus === 'HAVE' && <PetsIcon sx={styles.deskIcon} />}
                      {person.dogStatus === 'AVOID' && <BlockIcon sx={styles.deskIcon} />}
                      <Typography variant="caption" sx={styles.deskNumber}>
                        {person.position}
                      </Typography>
                    </Box>
                  </Tooltip>
                ))}
              </Box>
              <Typography variant="caption" sx={styles.teamNameLabel}>
                {group.team || 'No Team'}
              </Typography>
              {groupIndex < teamGroups.length - 1 && (
                <Divider orientation="vertical" flexItem sx={styles.teamBoundary} />
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      <Box sx={styles.teamSummary}>
        {teamGroups.map((group) => (
          <Paper key={group.team || 'no-team'} elevation={1} sx={styles.teamCard}>
            <Box sx={styles.teamCardHeader}>
              <GroupsIcon color="primary" />
              <Typography variant="subtitle1" sx={styles.teamName}>
                {group.team || 'No Team'}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {group.members.length} members • 
              Dogs: {group.members.filter(m => m.dogStatus === 'HAVE').length} • 
              Avoiders: {group.members.filter(m => m.dogStatus === 'AVOID').length}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

const styles = {
  container: {
    p: 3,
    maxWidth: 1200,
    mx: 'auto',
  },
  header: {
    mb: 3,
    fontWeight: 'bold',
    color: 'text.primary',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: 3,
    mb: 3,
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  desksContainer: {
    p: 3,
    mb: 4,
    borderRadius: 2,
    backgroundColor: 'background.paper',
    overflowX: 'auto',
  },
  desksRow: {
    display: 'flex',
    alignItems: 'flex-start',
    minHeight: 120,
  },
  teamCluster: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    mx: 2,
    position: 'relative',
  },
  desk: {
    width: 60,
    height: 60,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 1,
    position: 'relative',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    backgroundColor: 'background.default',
    border: '1px solid',
    borderColor: 'divider',
    mb: 1,
    mx: '4px',
  },
  deskWithDog: {
    backgroundColor: 'rgba(255, 245, 0, 0.1)',
    borderColor: 'warning.main',
  },
  deskAvoidsDog: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: 'error.main',
  },
  deskNeutral: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderColor: 'primary.main',
  },
  deskIcon: {
    fontSize: '1.2rem',
    color: 'text.primary',
  },
  deskNumber: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    fontSize: '0.6rem',
    color: 'text.secondary',
  },
  teamGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  teamNameLabel: {
    mt: 1,
    fontWeight: 'medium',
    color: 'text.secondary',
    textAlign: 'center',
  },
  teamBoundary: {
    height: '80px',
    borderColor: 'divider',
    position: 'absolute',
    right: -20,
    top: 0,
  },
  teamSummary: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
  },
  teamCard: {
    p: 2,
    minWidth: 200,
    borderRadius: 2,
  },
  teamCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
  },
  teamName: {
    fontWeight: 'medium',
  },
  teamDivider: {
    height: '80px',
    borderColor: 'divider',
    mx: 1,
  },
};